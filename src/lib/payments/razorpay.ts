import Razorpay from "razorpay";
import { hmacSha256Hex, timingSafeEqual } from "@/lib/payments/crypto";

export function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay is not configured.");
  }
  return new Razorpay({ key_id, key_secret });
}

export function verifyRazorpayPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = hmacSha256Hex(secret, `${input.orderId}|${input.paymentId}`);
  return timingSafeEqual(expected, input.signature);
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = hmacSha256Hex(secret, rawBody);
  return timingSafeEqual(expected, signature);
}
