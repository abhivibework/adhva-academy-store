import type { PaymentProvider, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDigitalCheckoutProduct } from "@/lib/products";
import { getEnabledGateways } from "@/lib/settings";

export type CartLine = Prisma.CartItemGetPayload<{
  include: { product: true };
}>;

export { cashfreeMode, cashfreeOrderIdFor } from "@/lib/payments/cashfree";
export {
  DOWNLOAD_TTL_MS,
  downloadUrl,
  fulfillPaidOrder,
  issueDownloadToken,
  markOrderFailed,
} from "@/lib/payments/fulfillment";

export function indianMobile(value: string | null | undefined) {
  const digits = (value || "").replace(/\D/g, "");
  const ten = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}

export function assertDigitalCheckout(items: CartLine[]) {
  if (items.length === 0) {
    throw new Error("Your cart is empty.");
  }

  for (const item of items) {
    if (!isDigitalCheckoutProduct(item.product)) {
      throw new Error(
        `${item.product.title} is not available for digital checkout.`,
      );
    }
  }
}

export function cartTotal(items: CartLine[]) {
  return items.reduce(
    (sum, item) => sum + item.product.priceInPaise * item.qty,
    0,
  );
}

export async function resolveCheckoutGateway(requested?: string | null) {
  const { enabled, preferred } = await getEnabledGateways();
  if (enabled.length === 0 || !preferred) {
    throw new Error("No payment gateway is configured.");
  }

  if (requested) {
    const provider = requested.toUpperCase() as PaymentProvider;
    if (enabled.includes(provider)) return provider;
    throw new Error("That payment method is not available.");
  }

  return preferred;
}

export async function loadUserCart(userId: string) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { id: "asc" },
  });

  const staleIds = items
    .filter((item) => !isDigitalCheckoutProduct(item.product))
    .map((item) => item.id);

  if (staleIds.length > 0) {
    await prisma.cartItem.deleteMany({ where: { id: { in: staleIds } } });
  }

  return items.filter((item) => isDigitalCheckoutProduct(item.product));
}
