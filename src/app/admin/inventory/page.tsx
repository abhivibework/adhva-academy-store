import type { Metadata } from "next";
import Link from "next/link";
import { InventoryRow } from "@/components/admin/InventoryRow";
import { EmptyState } from "@/components/EmptyState";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Inventory",
};

export default async function AdminInventoryPage() {
  const [physical, digital] = await Promise.all([
    prisma.product.findMany({
      where: { type: "PHYSICAL_BOOK" },
      orderBy: { title: "asc" },
    }),
    prisma.product.findMany({
      where: { isDigital: true, archivedAt: null },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="font-serif text-4xl">Inventory</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Stock is tracked only for hardcopy books. Digital courses and books are
        not decremented after a sale.
      </p>

      <h2 className="mt-10 font-serif text-2xl">Hardcopy</h2>
      {physical.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No hardcopy titles"
            body="Add a book (hardcopy) from Products. It will stay unlisted until physical sales are enabled."
          />
        </div>
      ) : (
        <div className="mt-4 border-t border-line">
          {physical.map((product) => (
            <InventoryRow
              key={`${product.id}-${product.updatedAt.toISOString()}`}
              product={product}
            />
          ))}
        </div>
      )}

      <h2 className="mt-12 font-serif text-2xl">Digital</h2>
      {digital.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No digital products yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {digital.map((product) => (
            <li
              key={product.id}
              className="flex flex-wrap items-baseline justify-between gap-3 py-4"
            >
              <div>
                <Link
                  href={`/admin/products/${product.id}`}
                  className="font-serif text-lg hover:text-gold-dark"
                >
                  {product.title}
                </Link>
                <p className="mt-1 text-sm text-muted">
                  {product.fileName ? `File: ${product.fileName}` : "No file attached"}
                </p>
              </div>
              <p className="text-sm text-muted">No stock decrement</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
