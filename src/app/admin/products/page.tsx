import type { Metadata } from "next";
import Link from "next/link";
import { ArchiveProductButton } from "@/components/admin/ArchiveProductButton";
import { listingLabel } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Price } from "@/components/Price";
import { prisma } from "@/lib/prisma";
import { productTypeLabel } from "@/lib/products";

export const metadata: Metadata = {
  title: "Products",
};

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Products</h1>
          <p className="mt-2 text-muted">
            Courses, digital books, and hardcopy titles. Hardcopy stays unlisted.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-foreground px-5 py-2.5 text-sm tracking-wide text-paper hover:bg-gold-dark"
        >
          New product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="No products yet"
            body="Create a course or digital book to start the catalogue. Nothing is seeded."
          />
        </div>
      ) : (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs tracking-[0.16em] text-muted uppercase">
                <th className="py-3 pr-4 font-normal">Product</th>
                <th className="py-3 pr-4 font-normal">Type</th>
                <th className="py-3 pr-4 font-normal">Price</th>
                <th className="py-3 pr-4 font-normal">Listing</th>
                <th className="py-3 pr-4 font-normal">File / stock</th>
                <th className="py-3 font-normal"> </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-line align-top">
                  <td className="py-4 pr-4">
                    <div className="flex gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden border border-line bg-[#f4f1ea]">
                        {product.coverPath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/media/cover/${product.id}`}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="font-serif text-lg hover:text-gold-dark"
                        >
                          {product.title}
                        </Link>
                        <p className="mt-1 text-xs text-muted">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 pr-4">{productTypeLabel(product.type)}</td>
                  <td className="py-4 pr-4">
                    <Price paise={product.priceInPaise} />
                  </td>
                  <td className="py-4 pr-4">{listingLabel(product)}</td>
                  <td className="py-4 pr-4 text-muted">
                    {product.isDigital
                      ? product.fileName || "No file attached"
                      : `${product.stockQty} in stock`}
                  </td>
                  <td className="py-4">
                    <div className="flex flex-col items-end gap-2">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-sm hover:text-gold-dark"
                      >
                        Edit
                      </Link>
                      <ArchiveProductButton
                        productId={product.id}
                        archived={Boolean(product.archivedAt)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
