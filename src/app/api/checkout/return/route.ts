import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  fetchCashfreeOrder,
  fetchCashfreeSuccessfulPayment,
} from "@/lib/payments/cashfree";
import { fulfillPaidOrder } from "@/lib/payments/fulfillment";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/settings";
import { parseCheckoutOrderId } from "@/lib/storefront";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawOrderId = url.searchParams.get("order_id");
  const login = new URL("/login", appUrl());
  login.searchParams.set("callbackUrl", `${url.pathname}${url.search}`);

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(login);
  }

  if (!rawOrderId) {
    return NextResponse.redirect(new URL("/checkout", appUrl()));
  }

  const internalId = parseCheckoutOrderId(rawOrderId);
  const order =
    (await prisma.order.findUnique({ where: { cashfreeOrderId: rawOrderId } })) ??
    (internalId
      ? await prisma.order.findUnique({ where: { id: internalId } })
      : null);
  if (!order || order.userId !== session.user.id) {
    return NextResponse.redirect(new URL("/orders", appUrl()));
  }

  try {
    const cashfreeOrderId = order.cashfreeOrderId ?? rawOrderId;
    const remote = await fetchCashfreeOrder(cashfreeOrderId);
    if (remote.order_status === "PAID") {
      const payment = await fetchCashfreeSuccessfulPayment(cashfreeOrderId);
      await fulfillPaidOrder({
        orderId: order.id,
        provider: "CASHFREE",
        paymentId: String(
          payment?.cf_payment_id ?? remote.cf_order_id ?? cashfreeOrderId,
        ),
      });
    }
  } catch {
    // Fall through to the order page; webhook may still confirm payment.
  }

  return NextResponse.redirect(new URL(`/orders/${order.id}`, appUrl()));
}
