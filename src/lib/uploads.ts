import { randomBytes } from "crypto";
import { createReadStream, createWriteStream } from "fs";
import { mkdir, readdir, readFile, rm, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import {
  CHUNK_MAX_BYTES,
  COVER_MAX_BYTES,
  FILE_MAX_BYTES,
  formatMaxSize,
} from "@/lib/upload-limits";

const COVER_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const OWNED_UPLOAD = /^(covers|files)\/[a-f0-9]{32}(\.[a-z0-9]{1,8})?$/;
const UPLOAD_ID = /^[a-f0-9]{32}$/;

type ChunkMeta = {
  kind: "covers" | "files";
  fileName: string;
  fileType: string;
  totalSize: number;
  chunkCount: number;
};

export function isOwnedUploadPath(relative: string, kind: "covers" | "files") {
  return OWNED_UPLOAD.test(relative) && relative.startsWith(`${kind}/`);
}

function uploadsRoot() {
  return path.join(process.cwd(), "uploads");
}

function tmpRoot() {
  return path.join(uploadsRoot(), "tmp");
}

function originalNameFrom(fileName: string) {
  const base = path.basename(fileName).replace(/[\r\n]/g, "").trim();
  return base.slice(0, 180) || "download";
}

function extensionFor(fileName: string, mime: string) {
  const fromName = path.extname(fileName).toLowerCase();
  if (fromName && fromName.length <= 8) return fromName;
  if (mime === "image/jpeg" || mime === "image/jpg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  if (mime === "application/pdf") return ".pdf";
  if (mime === "application/zip") return ".zip";
  if (mime === "application/epub+zip") return ".epub";
  return "";
}

function isCoverFile(fileName: string, mime: string) {
  if (COVER_TYPES.has(mime)) return true;
  return /\.(jpe?g|png|webp|gif)$/i.test(fileName);
}

export function absoluteUploadPath(relative: string) {
  const root = path.resolve(uploadsRoot());
  const resolved = path.resolve(root, relative);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error("Invalid upload path.");
  }
  return resolved;
}

export async function removeUpload(relative: string | null | undefined) {
  if (!relative) return;
  try {
    await unlink(absoluteUploadPath(relative));
  } catch {
    // File may already be gone.
  }
}

async function cleanupStaleTemp() {
  const root = tmpRoot();
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(root, entry.name);
      const info = await stat(full).catch(() => null);
      if (!info || info.mtimeMs > cutoff) return;
      await rm(full, { recursive: true, force: true }).catch(() => undefined);
    }),
  );
}

export async function writeUploadChunk(input: {
  uploadId: string;
  kind: "covers" | "files";
  chunkIndex: number;
  chunkCount: number;
  fileName: string;
  fileType: string;
  totalSize: number;
  body: ReadableStream<Uint8Array>;
}) {
  if (!UPLOAD_ID.test(input.uploadId)) {
    throw new Error("Invalid upload.");
  }
  if (!Number.isInteger(input.chunkIndex) || !Number.isInteger(input.chunkCount)) {
    throw new Error("Invalid upload chunk.");
  }
  if (input.chunkIndex < 0 || input.chunkCount < 1 || input.chunkIndex >= input.chunkCount) {
    throw new Error("Invalid upload chunk.");
  }

  const maxBytes = input.kind === "covers" ? COVER_MAX_BYTES : FILE_MAX_BYTES;
  if (input.totalSize < 1 || input.totalSize > maxBytes) {
    throw new Error(
      `${input.kind === "covers" ? "Cover images" : "Digital files"} must be ${formatMaxSize(maxBytes)} or smaller.`,
    );
  }
  if (input.kind === "covers" && !isCoverFile(input.fileName, input.fileType)) {
    throw new Error("Cover must be a JPEG, PNG, WebP, or GIF image.");
  }

  await mkdir(tmpRoot(), { recursive: true });
  if (input.chunkIndex === 0) await cleanupStaleTemp();

  const sessionDir = path.join(tmpRoot(), input.uploadId);
  const metaPath = path.join(sessionDir, "meta.json");
  await mkdir(sessionDir, { recursive: true });

  let meta: ChunkMeta | null = null;
  try {
    meta = JSON.parse(await readFile(metaPath, "utf8")) as ChunkMeta;
  } catch {
    meta = null;
  }

  if (meta) {
    if (
      meta.kind !== input.kind ||
      meta.totalSize !== input.totalSize ||
      meta.chunkCount !== input.chunkCount
    ) {
      throw new Error("Upload session does not match this file.");
    }
  } else if (input.chunkIndex === 0) {
    meta = {
      kind: input.kind,
      fileName: originalNameFrom(input.fileName),
      fileType: input.fileType,
      totalSize: input.totalSize,
      chunkCount: input.chunkCount,
    };
    await writeFile(metaPath, JSON.stringify(meta));
  } else {
    throw new Error("Upload session expired. Try again.");
  }

  const partPath = path.join(sessionDir, `${input.chunkIndex}.part`);
  try {
    await pipeline(
      Readable.fromWeb(input.body as Parameters<typeof Readable.fromWeb>[0]),
      createWriteStream(partPath),
    );
  } catch (error) {
    await unlink(partPath).catch(() => undefined);
    throw error;
  }

  const partInfo = await stat(partPath);
  if (partInfo.size > CHUNK_MAX_BYTES) {
    await unlink(partPath).catch(() => undefined);
    throw new Error("Upload chunk is too large.");
  }
  const isLast = input.chunkIndex === input.chunkCount - 1;
  if (!isLast && partInfo.size < 1) {
    await unlink(partPath).catch(() => undefined);
    throw new Error("Upload chunk was empty.");
  }

  const parts = await readdir(sessionDir);
  const received = parts.filter((name) => name.endsWith(".part")).length;
  if (received < input.chunkCount) {
    return { done: false as const, received, chunkCount: input.chunkCount };
  }

  let assembled = 0;
  for (let index = 0; index < input.chunkCount; index += 1) {
    const info = await stat(path.join(sessionDir, `${index}.part`)).catch(() => null);
    if (!info) {
      throw new Error("Upload is incomplete. Try again.");
    }
    assembled += info.size;
  }
  if (assembled !== input.totalSize) {
    await rm(sessionDir, { recursive: true, force: true }).catch(() => undefined);
    throw new Error("Upload size did not match the original file.");
  }

  const destDir = path.join(uploadsRoot(), input.kind);
  await mkdir(destDir, { recursive: true });
  const filename = `${randomBytes(16).toString("hex")}${extensionFor(meta.fileName, meta.fileType)}`;
  const relative = `${input.kind}/${filename}`;
  const absolute = path.join(destDir, filename);

  try {
    for (let index = 0; index < input.chunkCount; index += 1) {
      await pipeline(
        createReadStream(path.join(sessionDir, `${index}.part`)),
        createWriteStream(absolute, { flags: index === 0 ? "w" : "a" }),
      );
    }
  } catch (error) {
    await unlink(absolute).catch(() => undefined);
    throw error;
  }

  await rm(sessionDir, { recursive: true, force: true }).catch(() => undefined);
  return {
    done: true as const,
    relative,
    originalName: meta.fileName,
  };
}
