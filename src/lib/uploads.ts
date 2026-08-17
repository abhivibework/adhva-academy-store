import { randomBytes } from "crypto";
import { createWriteStream } from "fs";
import { mkdir, unlink } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { COVER_MAX_BYTES, FILE_MAX_BYTES, formatMaxSize } from "@/lib/upload-limits";

const COVER_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const OWNED_UPLOAD = /^(covers|files)\/[a-f0-9]{32}(\.[a-z0-9]{1,8})?$/;

function extensionFor(file: File) {
  const fromName = path.extname(file.name).toLowerCase();
  if (fromName && fromName.length <= 8) return fromName;
  if (file.type === "image/jpeg") return ".jpg";
  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";
  if (file.type === "application/pdf") return ".pdf";
  return "";
}

function originalName(file: File) {
  const base = path.basename(file.name).replace(/[\r\n]/g, "").trim();
  return base.slice(0, 180) || "download";
}

export function isOwnedUploadPath(relative: string, kind: "covers" | "files") {
  return OWNED_UPLOAD.test(relative) && relative.startsWith(`${kind}/`);
}

export async function saveUpload(
  file: File,
  kind: "covers" | "files",
  options?: { imageOnly?: boolean },
) {
  if (!file || file.size === 0) return null;
  if (options?.imageOnly && !COVER_TYPES.has(file.type)) {
    throw new Error("Cover must be a JPEG, PNG, WebP, or GIF image.");
  }

  const maxBytes = options?.imageOnly ? COVER_MAX_BYTES : FILE_MAX_BYTES;
  if (file.size > maxBytes) {
    throw new Error(
      `${kind === "covers" ? "Cover images" : "Digital files"} must be ${formatMaxSize(maxBytes)} or smaller.`,
    );
  }

  const dir = path.join(process.cwd(), "uploads", kind);
  await mkdir(dir, { recursive: true });
  const filename = `${randomBytes(16).toString("hex")}${extensionFor(file)}`;
  const relative = `${kind}/${filename}`;
  const absolute = path.join(dir, filename);

  try {
    await pipeline(
      Readable.fromWeb(file.stream() as Parameters<typeof Readable.fromWeb>[0]),
      createWriteStream(absolute),
    );
  } catch (error) {
    await unlink(absolute).catch(() => undefined);
    throw error;
  }

  return { relative, originalName: originalName(file) };
}

export function absoluteUploadPath(relative: string) {
  const root = path.resolve(process.cwd(), "uploads");
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
