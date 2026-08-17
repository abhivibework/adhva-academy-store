import type { Metadata } from "next";
import Link from "next/link";
import { CartView } from "@/components/CartView";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader, ShopContainer } from "@/components/ShopFrame";
import { requireUser } from "@/lib/auth-guard";
import { loadUserCart } from "@/lib/payments";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const user = await requireUser();
  const items = await loadUserCart(user.id).catch(() => []);

  return (
    <ShopContainer>
      <PageHeader
        eyebrow="Shop"
        title="Cart"
        description="Review your titles, then continue to checkout."
      />

      {items.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          body="Browse the catalogue to add titles to your cart."
        />
      ) : (
        <>
          <CartView items={items} />
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
            <Link href="/catalog" className="text-sm text-muted hover:text-gold-dark">
              Continue browsing
            </Link>
            <Link
              href="/checkout"
              className="bg-foreground px-6 py-3 text-sm tracking-wide text-paper hover:bg-gold-dark"
            >
              Checkout
            </Link>
          </div>
        </>
      )}
    </ShopContainer>
  );
}
