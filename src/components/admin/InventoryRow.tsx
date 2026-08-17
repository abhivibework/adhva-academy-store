"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Product } from "@prisma/client";
import {
  updateInventoryAction,
  type InventoryState,
} from "@/app/actions/admin-inventory";
import { SubmitButton } from "@/components/admin/SubmitButton";

export function InventoryRow({ product }: { product: Product }) {
  const action = updateInventoryAction.bind(null, product.id);
  const [state, formAction] = useActionState<InventoryState, FormData>(action, null);
  const low = product.stockQty <= product.lowStockThreshold;

  return (
    <form
      action={formAction}
      className="grid gap-4 border-b border-line py-5 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_auto] md:items-end"
    >
      <div>
        <p className="font-serif text-lg">
          <Link href={`/admin/products/${product.id}`} className="hover:text-gold-dark">
            {product.title}
          </Link>
        </p>
        <p className="mt-1 text-sm text-muted">
          {product.archivedAt ? "Archived · " : ""}
          Unlisted hardcopy
          {low ? (product.stockQty <= 0 ? " · Out of stock" : " · Low stock") : ""}
        </p>
        {state?.error ? <p className="mt-2 text-sm text-red-700">{state.error}</p> : null}
      </div>
      <label className="block">
        <span className="text-xs tracking-[0.16em] text-muted uppercase">Stock</span>
        <input
          name="stockQty"
          type="number"
          min="0"
          defaultValue={product.stockQty}
          className="mt-2 w-full border border-line bg-paper px-3 py-2 outline-none focus:border-gold"
        />
      </label>
      <label className="block">
        <span className="text-xs tracking-[0.16em] text-muted uppercase">
          Low-stock at
        </span>
        <input
          name="lowStockThreshold"
          type="number"
          min="0"
          defaultValue={product.lowStockThreshold}
          className="mt-2 w-full border border-line bg-paper px-3 py-2 outline-none focus:border-gold"
        />
      </label>
      <p className="text-sm tabular-nums text-muted md:pb-2">
        {product.stockQty <= 0
          ? "Out of stock"
          : low
            ? "Low stock"
            : "In stock"}
      </p>
      <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
    </form>
  );
}
