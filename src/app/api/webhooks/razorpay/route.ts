import { NextResponse } from "next/server";
import { fulfillPaidOrder, markOrderFailed } from "@/lib/payments/fulfillment";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayWebhookSignature } from "@/lib/payments/razorpay";

type RazorpayPaymentEntity = {
  id?: string;
  order_id?: string;
  status?: string;
};

type RazorpayWebhook = {
  event?: string;
  payload?: {
    payment?: { entity?: RazorpayPaymentEntity };
  };
};

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as RazorpayWebhook;
  const payment = event.payload?.payment?.entity;
  const razorpayOrderId = payment?.order_id;
  if (!razorpayOrderId) {
    return NextResponse.json({ ok: true });
  }

  const order = await prisma.order.findUnique({
    where: { razorpayOrderId },
  });
  if (!order) {
    return NextResponse.json({ ok: true });
  }

  if (event.event === "payment.captured" && payment?.id) {
    await fulfillPaidOrder({
      orderId: order.id,
      provider: "RAZORPAY",
      paymentId: payment.id,
    });
  }

  if (event.event === "payment.failed") {
    await markOrderFailed(order.id);
  }

  return NextResponse.json({ ok: true });
}
