import type { Product } from "@prisma/client";
import { EmptyState } from "@/components/EmptyState";
import { ProductCard } from "@/components/ProductCard";

export function ProductGrid({
  products,
  emptyTitle = "No titles yet",
  emptyBody = "New titles will appear here as they are published.",
}: {
  products: Product[];
  emptyTitle?: string;
  emptyBody?: string;
}) {
  if (products.length === 0) {
    return <EmptyState title={emptyTitle} body={emptyBody} />;
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
