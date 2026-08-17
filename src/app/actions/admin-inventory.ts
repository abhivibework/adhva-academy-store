"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

const inventorySchema = z.object({
  stockQty: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0),
});

export type InventoryState = { error?: string } | null;

export async function updateInventoryAction(
  productId: string,
  _prev: InventoryState,
  formData: FormData,
): Promise<InventoryState> {
  await requireAdmin();

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { error: "Product not found." };
  if (product.isDigital || product.type !== "PHYSICAL_BOOK") {
    return { error: "Digital products do not use stock." };
  }

  const parsed = inventorySchema.safeParse({
    stockQty: formData.get("stockQty"),
    lowStockThreshold: formData.get("lowStockThreshold"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check stock values." };
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      stockQty: parsed.data.stockQty,
      lowStockThreshold: parsed.data.lowStockThreshold,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  return null;
}
