import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user?.id) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  return user;
}

export async function getAdminUser() {
  const user = await getSessionUser();
  if (!user?.id || user.role !== "ADMIN") return null;
  return user;
}
