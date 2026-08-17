import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isStorefrontProduct } from "@/lib/products";
import { isBlobUrl } from "@/lib/storage";
import { absoluteUploadPath } from "@/lib/uploads";

export async function GET(
  _request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  const { productId } = await context.params;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product?.coverPath) {
    return NextResponse.json({ error: "No cover." }, { status: 404 });
  }

  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  if (!isStorefrontProduct(product) && !isAdmin) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (isBlobUrl(product.coverPath)) {
    return NextResponse.redirect(product.coverPath);
  }

  const filePath = absoluteUploadPath(product.coverPath);
  const info = await stat(filePath).catch(() => null);
  if (!info) {
    return NextResponse.json({ error: "Cover missing." }, { status: 404 });
  }

  const stream = Readable.toWeb(
    createReadStream(filePath),
  ) as ReadableStream<Uint8Array>;
  const ext = product.coverPath.split(".").pop()?.toLowerCase();
  const type =
    ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : ext === "gif"
          ? "image/gif"
          : "image/jpeg";

  return new NextResponse(stream, {
    headers: {
      "Content-Type": type,
      "Content-Length": String(info.size),
      "Cache-Control": "public, max-age=86400",
    },
  });
}
