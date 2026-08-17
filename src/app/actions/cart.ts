"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { isDigitalCheckoutProduct } from "@/lib/products";

export async function addToCart(productId: string) {
  const user = await requireUser();
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product || !isDigitalCheckoutProduct(product)) {
    throw new Error("This title is not available.");
  }

  await prisma.cartItem.upsert({
    where: { userId_productId: { userId: user.id, productId } },
    update: { qty: 1 },
    create: { userId: user.id, productId, qty: 1 },
  });

  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/");
  redirect("/cart");
}

export async function removeFromCart(productId: string) {
  const user = await requireUser();
  await prisma.cartItem.deleteMany({
    where: { userId: user.id, productId },
  });
  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/");
}
