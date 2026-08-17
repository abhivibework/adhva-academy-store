import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth-guard";
import { saveUpload } from "@/lib/uploads";

export const maxDuration = 60;

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Sign in as admin to upload." }, { status: 401 });
  }

  const formData = await request.formData();
  const kindRaw = String(formData.get("kind") ?? "");
  const kind = kindRaw === "covers" || kindRaw === "files" ? kindRaw : null;
  const file = formData.get("file");

  if (!kind || !(file instanceof File)) {
    return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  }

  try {
    const saved = await saveUpload(file, kind, { imageOnly: kind === "covers" });
    if (!saved) {
      return NextResponse.json({ error: "The file was empty." }, { status: 400 });
    }
    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not upload file.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
