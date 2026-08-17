"use server";

import { PaymentProvider } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

const settingsSchema = z.object({
  siteName: z.string().trim().min(1, "Site name is required."),
  tagline: z.string().trim().max(120),
  contactEmail: z.string().trim(),
  footerText: z.string().trim(),
  razorpayEnabled: z.boolean(),
  cashfreeEnabled: z.boolean(),
  defaultGateway: z.enum(PaymentProvider),
});

export type SettingsState = { error?: string; ok?: boolean } | null;

export async function updateSettingsAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  await requireAdmin();

  const parsed = settingsSchema.safeParse({
    siteName: formData.get("siteName"),
    tagline: formData.get("tagline") ?? "",
    contactEmail: formData.get("contactEmail") ?? "",
    footerText: formData.get("footerText") ?? "",
    razorpayEnabled: formData.get("razorpayEnabled") === "on",
    cashfreeEnabled: formData.get("cashfreeEnabled") === "on",
    defaultGateway: formData.get("defaultGateway"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  if (parsed.data.contactEmail && !z.string().email().safeParse(parsed.data.contactEmail).success) {
    return { error: "Enter a valid contact email, or leave it blank." };
  }

  const enabled: PaymentProvider[] = [];
  if (parsed.data.razorpayEnabled) enabled.push("RAZORPAY");
  if (parsed.data.cashfreeEnabled) enabled.push("CASHFREE");

  if (enabled.length > 0 && !enabled.includes(parsed.data.defaultGateway)) {
    return { error: "Default gateway must be an enabled provider." };
  }

  await prisma.settings.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/checkout");
  return { ok: true };
}
