import type { OrderStatus, ProductType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  STOREFRONT_TYPES,
  isStorefrontProduct,
  storefrontProductWhere,
} from "@/lib/products";

export async function listStorefrontProducts(type?: ProductType) {
  try {
    return await prisma.product.findMany({
      where: {
        ...storefrontProductWhere,
        ...(type && STOREFRONT_TYPES.includes(type) ? { type } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export async function getStorefrontProduct(slug: string) {
  try {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product || !isStorefrontProduct(product)) return null;
    return product;
  } catch {
    return null;
  }
}

export function parseStorefrontType(value?: string | string[]) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "COURSE" || raw === "DIGITAL_BOOK") return raw;
  return undefined;
}

export function firstQueryValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export function formatOrderDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function orderStatusLabel(status: OrderStatus) {
  switch (status) {
    case "PENDING":
      return "Payment pending";
    case "PAID":
      return "Paid";
    case "FAILED":
      return "Failed";
    case "FULFILLED":
      return "Fulfilled";
  }
}

export function isPaidOrder(status: OrderStatus) {
  return status === "PAID" || status === "FULFILLED";
}

export function parseCheckoutOrderId(raw?: string | null) {
  if (!raw) return null;
  return raw.startsWith("adhva_") ? raw.slice("adhva_".length) : raw;
}

export function safeCallbackUrl(value?: string | string[]) {
  const raw = firstQueryValue(value);
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

const orderInclude = {
  items: {
    include: {
      product: {
        select: { isDigital: true, filePath: true, fileName: true, slug: true },
      },
    },
  },
} as const;

export async function listUserOrders(userId: string) {
  try {
    return await prisma.order.findMany({
      where: { userId },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export async function getUserOrder(userId: string, orderId: string) {
  try {
    return await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: orderInclude,
    });
  } catch {
    return null;
  }
}
