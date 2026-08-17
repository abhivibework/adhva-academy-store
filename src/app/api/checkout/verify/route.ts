import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  fetchCashfreeOrder,
  fetchCashfreeSuccessfulPayment,
} from "@/lib/payments/cashfree";
import { fulfillPaidOrder } from "@/lib/payments/fulfillment";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayPaymentSignature } from "@/lib/payments/razorpay";

const razorpaySchema = z.object({
  provider: z.literal("RAZORPAY"),
  orderId: z.string(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

const cashfreeSchema = z.object({
  provider: z.literal("CASHFREE"),
  orderId: z.string(),
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const razorpay = razorpaySchema.safeParse(body);
  const cashfree = cashfreeSchema.safeParse(body);

  if (razorpay.success) {
    const order = await prisma.order.findFirst({
      where: {
        id: razorpay.data.orderId,
        userId: session.user.id,
        razorpayOrderId: razorpay.data.razorpayOrderId,
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const valid = verifyRazorpayPaymentSignature({
      orderId: razorpay.data.razorpayOrderId,
      paymentId: razorpay.data.razorpayPaymentId,
      signature: razorpay.data.razorpaySignature,
    });
    if (!valid) {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }

    await fulfillPaidOrder({
      orderId: order.id,
      provider: "RAZORPAY",
      paymentId: razorpay.data.razorpayPaymentId,
    });
    return NextResponse.json({ ok: true, orderId: order.id });
  }

  if (cashfree.success) {
    const order = await prisma.order.findFirst({
      where: { id: cashfree.data.orderId, userId: session.user.id },
    });
    if (!order?.cashfreeOrderId) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const remote = await fetchCashfreeOrder(order.cashfreeOrderId);
    if (remote.order_status !== "PAID") {
      return NextResponse.json(
        { error: "Payment is not confirmed yet.", status: remote.order_status },
        { status: 409 },
      );
    }

    const payment = await fetchCashfreeSuccessfulPayment(order.cashfreeOrderId);
    await fulfillPaidOrder({
      orderId: order.id,
      provider: "CASHFREE",
      paymentId: String(payment?.cf_payment_id ?? remote.cf_order_id ?? order.cashfreeOrderId),
    });
    return NextResponse.json({ ok: true, orderId: order.id });
  }

  return NextResponse.json({ error: "Invalid verification payload." }, { status: 400 });
}
