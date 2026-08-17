import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArchiveProductButton } from "@/components/admin/ArchiveProductButton";
import { ProductForm } from "@/components/admin/ProductForm";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Edit product",
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  return (
    <div>
      <p className="text-sm">
        <Link href="/admin/products" className="text-muted hover:text-gold-dark">
          ← Products
        </Link>
      </p>
      <div className="mt-4 mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Edit product</h1>
          <p className="mt-2 text-muted">{product.slug}</p>
        </div>
        <ArchiveProductButton
          productId={product.id}
          archived={Boolean(product.archivedAt)}
        />
      </div>
      <ProductForm product={product} />
    </div>
  );
}
