import { del, issueSignedToken, presignUrl } from "@vercel/blob";
import { isOwnedUploadPath, removeUpload } from "@/lib/uploads";

const BLOB_HOST = /\.blob\.vercel-storage\.com$/i;

export function blobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function isBlobUrl(value: string) {
  try {
    return BLOB_HOST.test(new URL(value).hostname);
  } catch {
    return false;
  }
}

export function blobPathname(url: string) {
  return decodeURIComponent(new URL(url).pathname.replace(/^\//, ""));
}

export function isStoredUpload(value: string, kind: "covers" | "files") {
  if (isOwnedUploadPath(value, kind)) return true;
  if (!isBlobUrl(value)) return false;
  const pathname = blobPathname(value);
  return pathname.startsWith(`${kind}/`);
}

export async function removeStoredUpload(value: string | null | undefined) {
  if (!value) return;
  if (isBlobUrl(value)) {
    await del(value).catch(() => undefined);
    return;
  }
  await removeUpload(value);
}

export async function signedBlobDownloadUrl(url: string, access: "public" | "private") {
  const pathname = blobPathname(url);
  const token = await issueSignedToken({
    pathname,
    operations: ["get"],
    validUntil: Date.now() + 60 * 60 * 1000,
  });
  const { presignedUrl } = await presignUrl(token, {
    operation: "get",
    pathname,
    access,
  });
  return presignedUrl;
}
