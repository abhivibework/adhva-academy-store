import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { issueDownloadToken } from "@/lib/payments/fulfillment";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderItemId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", appUrl()));
  }

  const { orderItemId } = await context.params;
  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: { order: true, product: true },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  const isOwner = item.order.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  if (item.order.status !== "PAID" && item.order.status !== "FULFILLED") {
    return NextResponse.json({ error: "Order is not paid." }, { status: 403 });
  }

  if (!item.product.isDigital || !item.product.filePath) {
    return NextResponse.json({ error: "No digital file for this item." }, { status: 400 });
  }

  const token = await issueDownloadToken(item.id);
  return NextResponse.redirect(new URL(`/api/download/${token.token}`, appUrl()));
}
