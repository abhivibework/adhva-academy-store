import type { PaymentProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const defaults = {
  id: "default" as const,
  siteName: "Adhva Academy",
  tagline: "The Learning Path",
  contactEmail: "",
  footerText: "Adhva Academy — The Learning Path",
  razorpayEnabled: true,
  cashfreeEnabled: false,
  defaultGateway: "RAZORPAY" as PaymentProvider,
};

export async function getSettings() {
  try {
    const row = await prisma.settings.findUnique({ where: { id: "default" } });
    return row ?? defaults;
  } catch {
    return defaults;
  }
}

export function appUrl() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function razorpayConfigured() {
  return Boolean(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET,
  );
}

export function cashfreeConfigured() {
  return Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);
}

export async function getEnabledGateways() {
  const settings = await getSettings();
  const razorpay = settings.razorpayEnabled && razorpayConfigured();
  const cashfree = settings.cashfreeEnabled && cashfreeConfigured();
  const enabled: PaymentProvider[] = [];
  if (razorpay) enabled.push("RAZORPAY");
  if (cashfree) enabled.push("CASHFREE");

  const preferred = enabled.includes(settings.defaultGateway)
    ? settings.defaultGateway
    : (enabled[0] ?? null);

  return { razorpay, cashfree, enabled, preferred, settings };
}
