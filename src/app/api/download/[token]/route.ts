import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isBlobUrl, signedBlobDownloadUrl } from "@/lib/storage";
import { absoluteUploadPath } from "@/lib/uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function contentDisposition(filename: string) {
  const safe = filename.replace(/["\r\n]/g, "");
  const encoded = encodeURIComponent(safe);
  return `attachment; filename="${safe}"; filename*=UTF-8''${encoded}`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const record = await prisma.downloadToken.findUnique({
    where: { token },
    include: {
      orderItem: {
        include: { order: true, product: true },
      },
    },
  });

  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "This download link has expired." }, { status: 410 });
  }

  const { order, product } = record.orderItem;
  if (order.status !== "PAID" && order.status !== "FULFILLED") {
    return NextResponse.json({ error: "Order is not paid." }, { status: 403 });
  }
  if (!product.filePath) {
    return NextResponse.json({ error: "File is not available." }, { status: 404 });
  }

  if (isBlobUrl(product.filePath)) {
    const url = await signedBlobDownloadUrl(product.filePath, "private");
    return NextResponse.redirect(url);
  }

  const filePath = absoluteUploadPath(product.filePath);
  const info = await stat(filePath).catch(() => null);
  if (!info) {
    return NextResponse.json({ error: "File is missing." }, { status: 404 });
  }

  const filename = product.fileName || product.title;
  const stream = Readable.toWeb(
    createReadStream(filePath),
  ) as ReadableStream<Uint8Array>;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(info.size),
      "Content-Disposition": contentDisposition(filename),
      "Cache-Control": "no-store",
    },
  });
}
