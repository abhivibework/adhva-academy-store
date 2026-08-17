"use server";

import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

function revalidateOrder(orderId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function updateOrderStatusAction(orderId: string, formData: FormData) {
  await requireAdmin();
  const parsed = z.enum(OrderStatus).safeParse(formData.get("status"));
  if (!parsed.success) return;

  const existing = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existing) return;

  await prisma.order.update({
    where: { id: orderId },
    data: { status: parsed.data },
  });
  revalidateOrder(orderId);
}

export async function markOrderFulfilled(orderId: string) {
  await requireAdmin();
  await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.FULFILLED },
  });
  revalidateOrder(orderId);
}
