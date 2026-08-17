"use client";

import { useFormStatus } from "react-dom";
import { addToCart } from "@/app/actions/cart";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-foreground px-6 py-3 text-sm tracking-wide text-paper hover:bg-gold-dark disabled:opacity-60"
    >
      {pending ? "Adding…" : "Add to cart"}
    </button>
  );
}

export function AddToCartButton({ productId }: { productId: string }) {
  return (
    <form action={addToCart.bind(null, productId)}>
      <Submit />
    </form>
  );
}
