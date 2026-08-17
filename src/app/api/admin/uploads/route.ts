import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth-guard";
import { writeUploadChunk } from "@/lib/uploads";

export const maxDuration = 60;

function integerParam(value: string | null) {
  if (value == null || value === "") return Number.NaN;
  return Number(value);
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Sign in as admin to upload." }, { status: 401 });
  }

  if (!request.body) {
    return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  }

  const url = new URL(request.url);
  const kindRaw = url.searchParams.get("kind");
  const kind = kindRaw === "covers" || kindRaw === "files" ? kindRaw : null;
  if (!kind) {
    return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  }

  try {
    const saved = await writeUploadChunk({
      kind,
      uploadId: String(url.searchParams.get("uploadId") ?? ""),
      chunkIndex: integerParam(url.searchParams.get("chunkIndex")),
      chunkCount: integerParam(url.searchParams.get("chunkCount")),
      fileName: String(url.searchParams.get("fileName") ?? ""),
      fileType: String(url.searchParams.get("fileType") ?? ""),
      totalSize: integerParam(url.searchParams.get("totalSize")),
      body: request.body,
    });
    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not upload file.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
