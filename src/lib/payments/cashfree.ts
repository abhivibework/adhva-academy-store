import { paiseToCashfreeAmount } from "@/lib/money";
import { hmacSha256Base64, timingSafeEqual } from "@/lib/payments/crypto";
import { appUrl } from "@/lib/settings";

/** Current Cashfree PG Orders API (payment session / checkout). */
const API_VERSION = "2026-01-01";

export function cashfreeOrderIdFor(orderId: string) {
  return `adhva_${orderId}`;
}

export function cashfreeMode(): "sandbox" | "production" {
  return process.env.CASHFREE_ENV === "production" ? "production" : "sandbox";
}

function cashfreeBaseUrl() {
  return cashfreeMode() === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

function cashfreeHeaders() {
  const appId = process.env.CASHFREE_APP_ID;
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!appId || !secret) {
    throw new Error("Cashfree is not configured.");
  }
  return {
    "Content-Type": "application/json",
    "x-client-id": appId,
    "x-client-secret": secret,
    "x-api-version": API_VERSION,
  };
}

function cashfreeMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;
  const body = data as {
    message?: unknown;
    error?: { message?: unknown };
  };
  if (typeof body.message === "string" && body.message) return body.message;
  if (typeof body.error?.message === "string" && body.error.message) {
    return body.error.message;
  }
  return fallback;
}

export type CashfreeOrder = {
  order_id: string;
  payment_session_id?: string;
  order_status?: string;
  cf_order_id?: string | number;
};

export type CashfreePayment = {
  cf_payment_id?: string | number;
  payment_status?: string;
};

export async function createCashfreeOrder(input: {
  orderId: string;
  amountInPaise: number;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
}) {
  const response = await fetch(`${cashfreeBaseUrl()}/orders`, {
    method: "POST",
    headers: cashfreeHeaders(),
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: paiseToCashfreeAmount(input.amountInPaise),
      order_currency: "INR",
      customer_details: {
        customer_id: input.customerId,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone,
      },
      order_meta: {
        return_url: `${appUrl()}/api/checkout/return?order_id={order_id}`,
        notify_url: `${appUrl()}/api/webhooks/cashfree`,
      },
    }),
  });

  const data = (await response.json()) as CashfreeOrder;
  const paymentSessionId = data.payment_session_id;
  if (!response.ok || !paymentSessionId) {
    throw new Error(cashfreeMessage(data, "Could not create Cashfree order."));
  }
  return { ...data, payment_session_id: paymentSessionId };
}

export async function fetchCashfreeOrder(orderId: string) {
  const response = await fetch(
    `${cashfreeBaseUrl()}/orders/${encodeURIComponent(orderId)}`,
    { headers: cashfreeHeaders() },
  );
  const data = (await response.json()) as CashfreeOrder;
  if (!response.ok) {
    throw new Error(cashfreeMessage(data, "Could not fetch Cashfree order."));
  }
  return data;
}

export async function fetchCashfreeSuccessfulPayment(orderId: string) {
  const response = await fetch(
    `${cashfreeBaseUrl()}/orders/${encodeURIComponent(orderId)}/payments`,
    { headers: cashfreeHeaders() },
  );
  const data = (await response.json()) as CashfreePayment[] | { message?: string };
  if (!response.ok || !Array.isArray(data)) {
    return null;
  }
  return (
    data.find((payment) => payment.payment_status === "SUCCESS") ?? null
  );
}

export function verifyCashfreeWebhookSignature(
  rawBody: string,
  signature: string,
  timestamp: string,
) {
  if (!signature || !timestamp) return false;
  const secrets = [
    process.env.CASHFREE_WEBHOOK_SECRET,
    process.env.CASHFREE_SECRET_KEY,
  ].filter((value, index, list): value is string => {
    return Boolean(value) && list.indexOf(value) === index;
  });
  if (secrets.length === 0) return false;

  const payload = timestamp + rawBody;
  return secrets.some((secret) =>
    timingSafeEqual(hmacSha256Base64(secret, payload), signature),
  );
}
