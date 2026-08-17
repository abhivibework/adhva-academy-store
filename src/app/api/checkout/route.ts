import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  assertDigitalCheckout,
  cartTotal,
  cashfreeMode,
  cashfreeOrderIdFor,
  indianMobile,
  loadUserCart,
  resolveCheckoutGateway,
} from "@/lib/payments";
import { createCashfreeOrder } from "@/lib/payments/cashfree";
import { getRazorpay } from "@/lib/payments/razorpay";
import { getEnabledGateways } from "@/lib/settings";

const bodySchema = z.object({
  provider: z.enum(["RAZORPAY", "CASHFREE"]).optional(),
  phone: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to checkout." }, { status: 401 });
  }

  const { enabled, preferred } = await getEnabledGateways();
  return NextResponse.json({ enabled, preferred });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Sign in to checkout." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });
  }

  try {
    const provider = await resolveCheckoutGateway(parsed.data.provider);
    const items = await loadUserCart(session.user.id);
    assertDigitalCheckout(items);
    const amountInPaise = cartTotal(items);

    if (amountInPaise < 100) {
      return NextResponse.json(
        { error: "Order total must be at least ₹1." },
        { status: 400 },
      );
    }

    let phone: string | null = null;
    if (provider === "CASHFREE") {
      phone = indianMobile(parsed.data.phone);
      if (!phone) {
        return NextResponse.json(
          { error: "Cashfree requires a 10-digit Indian mobile number." },
          { status: 400 },
        );
      }
      await prisma.user.update({
        where: { id: session.user.id },
        data: { phone },
      });
    }

    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: "PENDING",
        amountInPaise,
        paymentProvider: provider,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            title: item.product.title,
            priceInPaise: item.product.priceInPaise,
            qty: item.qty,
          })),
        },
      },
    });

    try {
      if (provider === "RAZORPAY") {
        const razorpay = getRazorpay();
        const razorpayOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: order.id.slice(0, 40),
          notes: { orderId: order.id },
        });

        await prisma.order.update({
          where: { id: order.id },
          data: { razorpayOrderId: String(razorpayOrder.id) },
        });

        return NextResponse.json({
          orderId: order.id,
          provider,
          amountInPaise,
          razorpay: {
            keyId: process.env.RAZORPAY_KEY_ID,
            orderId: razorpayOrder.id,
          },
        });
      }

      const cashfreeOrderId = cashfreeOrderIdFor(order.id);
      const cashfree = await createCashfreeOrder({
        orderId: cashfreeOrderId,
        amountInPaise,
        customerId: session.user.id,
        customerEmail: session.user.email,
        customerPhone: phone!,
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { cashfreeOrderId },
      });

      return NextResponse.json({
        orderId: order.id,
        provider,
        amountInPaise,
        cashfree: {
          paymentSessionId: cashfree.payment_session_id,
          mode: cashfreeMode(),
        },
      });
    } catch (error) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "FAILED" },
      });
      throw error;
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed." },
      { status: 400 },
    );
  }
}
