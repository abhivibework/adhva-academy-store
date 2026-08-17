import type { Metadata } from "next";
import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { blobConfigured } from "@/lib/storage";

export const metadata: Metadata = {
  title: "New product",
};

export default function NewProductPage() {
  return (
    <div>
      <p className="text-sm">
        <Link href="/admin/products" className="text-muted hover:text-gold-dark">
          ← Products
        </Link>
      </p>
      <h1 className="mt-4 font-serif text-4xl">New product</h1>
      <p className="mt-2 mb-10 max-w-xl text-muted">
        Hardcopy books are saved unlisted and cannot be sold on the storefront yet.
      </p>
      <ProductForm useBlob={blobConfigured()} />
    </div>
  );
}
