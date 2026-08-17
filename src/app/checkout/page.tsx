import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CartView } from "@/components/CartView";
import { CheckoutClient } from "@/components/CheckoutClient";
import { PageHeader, ShopContainer } from "@/components/ShopFrame";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { isDigitalCheckoutProduct } from "@/lib/products";
import { cartTotal, loadUserCart } from "@/lib/payments";
import { getEnabledGateways } from "@/lib/settings";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await requireUser();
  const [items, gateways, dbUser] = await Promise.all([
    loadUserCart(user.id).catch(() => []),
    getEnabledGateways(),
    prisma.user
      .findUnique({
        where: { id: user.id },
        select: { phone: true, email: true },
      })
      .catch(() => null),
  ]);

  if (items.length === 0) {
    redirect("/cart");
  }

  const digitalReady = items.every((item) => isDigitalCheckoutProduct(item.product));
  const amountInPaise = cartTotal(items);
  const { enabled, preferred } = gateways;

  return (
    <ShopContainer>
      <PageHeader
        eyebrow="Shop"
        title="Checkout"
        description="Pay in INR for digital titles. A download button appears on the order once payment is confirmed."
      />

      <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h2 className="mb-6 font-serif text-2xl">Order</h2>
          <CartView items={items} />
        </div>

        <aside className="border border-line bg-paper px-6 py-8">
          <h2 className="font-serif text-2xl">Payment</h2>
          <div className="mt-4 mb-8 h-px w-16 bg-gold" />

          {!digitalReady ? (
            <p className="text-sm text-muted">
              One or more items cannot be purchased. Please return to your cart.
            </p>
          ) : enabled.length === 0 || !preferred ? (
            <p className="text-sm text-muted">
              Payment is not configured yet. Please try again later.
            </p>
          ) : (
            <CheckoutClient
              amountInPaise={amountInPaise}
              email={dbUser?.email ?? user.email}
              phone={dbUser?.phone}
              enabled={enabled}
              preferred={preferred}
            />
          )}

          <p className="mt-8 text-sm text-muted">
            <Link href="/cart" className="hover:text-gold-dark">
              Return to cart
            </Link>
          </p>
        </aside>
      </div>
    </ShopContainer>
  );
}
