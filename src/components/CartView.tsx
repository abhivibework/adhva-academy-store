"use client";

import Link from "next/link";
import { removeFromCart } from "@/app/actions/cart";
import { Price } from "@/components/Price";
import type { CartLine } from "@/lib/payments";

export function CartView({ items }: { items: CartLine[] }) {
  const total = items.reduce(
    (sum, item) => sum + item.product.priceInPaise * item.qty,
    0,
  );

  return (
    <div className="space-y-8">
      <ul className="divide-y divide-line border-y border-line">
        {items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-6 py-6">
            <div>
              <Link href={`/products/${item.product.slug}`} className="font-serif text-xl hover:text-gold-dark">
                {item.product.title}
              </Link>
              <p className="mt-1 text-sm text-muted">Digital download · Qty {item.qty}</p>
            </div>
            <div className="text-right">
              <Price paise={item.product.priceInPaise * item.qty} />
              <form action={removeFromCart.bind(null, item.productId)} className="mt-2">
                <button type="submit" className="text-sm text-muted hover:text-foreground">
                  Remove
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between">
        <p className="text-sm tracking-[0.16em] text-muted uppercase">Total</p>
        <p className="font-serif text-2xl">
          <Price paise={total} />
        </p>
      </div>
    </div>
  );
}
