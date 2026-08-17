import { randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const COVER_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function extensionFor(file: File) {
  const fromName = path.extname(file.name).toLowerCase();
  if (fromName && fromName.length <= 8) return fromName;
  if (file.type === "image/jpeg") return ".jpg";
  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";
  if (file.type === "application/pdf") return ".pdf";
  return "";
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

  const dir = path.join(process.cwd(), "uploads", kind);
  await mkdir(dir, { recursive: true });
  const filename = `${randomBytes(16).toString("hex")}${extensionFor(file)}`;
  const relative = `${kind}/${filename}`;
  const absolute = path.join(process.cwd(), "uploads", kind, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolute, buffer);
  return { relative, originalName: file.name };
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
