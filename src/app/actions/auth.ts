"use server";

import { compare, hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { safeCallbackUrl } from "@/lib/storefront";

const registerSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export type AuthState = { error?: string } | null;

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = safeCallbackUrl(String(formData.get("callbackUrl") || "/"));

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
  return null;
}

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  await prisma.user.create({
    data: {
      email,
      passwordHash: await hash(parsed.data.password, 12),
      role: "CUSTOMER",
    },
  });

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created. Please sign in." };
    }
    throw error;
  }
  return null;
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm the new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  });

export type ChangePasswordState = { error?: string; ok?: boolean } | null;

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const sessionUser = await requireUser();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) {
    return { error: "Account not found." };
  }

  const valid = await compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return { error: "Current password is incorrect." };
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return { error: "Choose a password that is different from the current one." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hash(parsed.data.newPassword, 12) },
  });

  return { ok: true };
}
