import { randomBytes } from "crypto";
import type { PaymentProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const DOWNLOAD_TTL_MS = 24 * 60 * 60 * 1000;

export async function fulfillPaidOrder(input: {
  orderId: string;
  provider: PaymentProvider;
  paymentId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.status === "PAID" || order.status === "FULFILLED") {
      if (input.provider === "RAZORPAY" && !order.razorpayPaymentId) {
        return tx.order.update({
          where: { id: order.id },
          data: { razorpayPaymentId: input.paymentId, paymentProvider: "RAZORPAY" },
        });
      }
      if (input.provider === "CASHFREE" && !order.cashfreePaymentId) {
        return tx.order.update({
          where: { id: order.id },
          data: { cashfreePaymentId: input.paymentId, paymentProvider: "CASHFREE" },
        });
      }
      return order;
    }

    const claimed = await tx.order.updateMany({
      where: { id: order.id, status: { in: ["PENDING", "FAILED"] } },
      data: {
        status: "PAID",
        paymentProvider: input.provider,
        razorpayPaymentId:
          input.provider === "RAZORPAY" ? input.paymentId : order.razorpayPaymentId,
        cashfreePaymentId:
          input.provider === "CASHFREE" ? input.paymentId : order.cashfreePaymentId,
      },
    });

    if (claimed.count === 0) {
      return tx.order.findUniqueOrThrow({ where: { id: order.id } });
    }

    for (const item of order.items) {
      if (!item.product.isDigital || !item.product.filePath) continue;
      const existing = await tx.downloadToken.findFirst({
        where: { orderItemId: item.id, expiresAt: { gt: new Date() } },
      });
      if (existing) continue;
      await tx.downloadToken.create({
        data: {
          orderItemId: item.id,
          token: randomBytes(32).toString("hex"),
          expiresAt: new Date(Date.now() + DOWNLOAD_TTL_MS),
        },
      });
    }

    await tx.cartItem.deleteMany({ where: { userId: order.userId } });
    return tx.order.findUniqueOrThrow({ where: { id: order.id } });
  });
}

export async function issueDownloadToken(orderItemId: string) {
  const existing = await prisma.downloadToken.findFirst({
    where: {
      orderItemId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) return existing;

  return prisma.downloadToken.create({
    data: {
      orderItemId,
      token: randomBytes(32).toString("hex"),
      expiresAt: new Date(Date.now() + DOWNLOAD_TTL_MS),
    },
  });
}

export function markOrderFailed(orderId: string) {
  return prisma.order.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: { status: "FAILED" },
  });
}

export function downloadUrl(token: string) {
  return `/api/download/${token}`;
}
