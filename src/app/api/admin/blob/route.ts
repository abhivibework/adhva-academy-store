import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth-guard";
import { blobConfigured } from "@/lib/storage";
import { COVER_MAX_BYTES, FILE_MAX_BYTES } from "@/lib/upload-limits";

export const maxDuration = 60;

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Sign in as admin to upload." }, { status: 401 });
  }
  if (!blobConfigured()) {
    return NextResponse.json({ error: "Blob storage is not configured." }, { status: 400 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = JSON.parse(clientPayload || "{}") as { kind?: string };
        const kind = payload.kind === "covers" || payload.kind === "files" ? payload.kind : null;
        if (!kind || !pathname.startsWith(`${kind}/`)) {
          throw new Error("Invalid upload.");
        }

        return {
          addRandomSuffix: true,
          maximumSizeInBytes: kind === "covers" ? COVER_MAX_BYTES : FILE_MAX_BYTES,
          validUntil: Date.now() + 60 * 60 * 1000,
          ...(kind === "covers"
            ? { allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"] }
            : {}),
        };
      },
      onUploadCompleted: async () => undefined,
    });
    return NextResponse.json(json);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not upload file.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
