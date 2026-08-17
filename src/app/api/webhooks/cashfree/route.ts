import { NextResponse } from "next/server";
import { verifyCashfreeWebhookSignature } from "@/lib/payments/cashfree";
import { fulfillPaidOrder, markOrderFailed } from "@/lib/payments/fulfillment";
import { prisma } from "@/lib/prisma";

type CashfreeWebhook = {
  type?: string;
  data?: {
    order?: { order_id?: string; order_status?: string };
    payment?: { cf_payment_id?: string | number; payment_status?: string };
  };
};

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature") ?? "";
  const timestamp = request.headers.get("x-webhook-timestamp") ?? "";

  if (!verifyCashfreeWebhookSignature(rawBody, signature, timestamp)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as CashfreeWebhook;
  const cashfreeOrderId = event.data?.order?.order_id;
  if (!cashfreeOrderId) {
    return NextResponse.json({ ok: true });
  }

  const order = await prisma.order.findUnique({
    where: { cashfreeOrderId },
  });
  if (!order) {
    return NextResponse.json({ ok: true });
  }

  const type = event.type ?? "";
  const paymentStatus = event.data?.payment?.payment_status;
  const paid =
    type === "PAYMENT_SUCCESS_WEBHOOK" ||
    type === "ORDER_PAID" ||
    event.data?.order?.order_status === "PAID" ||
    paymentStatus === "SUCCESS";

  if (paid) {
    const paymentId = String(
      event.data?.payment?.cf_payment_id ?? cashfreeOrderId,
    );
    await fulfillPaidOrder({
      orderId: order.id,
      provider: "CASHFREE",
      paymentId,
    });
  }

  if (
    type === "PAYMENT_FAILED_WEBHOOK" ||
    paymentStatus === "FAILED" ||
    event.data?.order?.order_status === "EXPIRED"
  ) {
    await markOrderFailed(order.id);
  }

  return NextResponse.json({ ok: true });
}
