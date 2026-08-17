import Link from "next/link";
import type { Product } from "@prisma/client";
import { Price } from "@/components/Price";
import { productTypeLabel } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col border border-line bg-paper transition-colors hover:border-gold"
    >
      <div className="aspect-[4/3] overflow-hidden border-b border-line bg-[#f4f1ea]">
        {product.coverPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/media/cover/${product.id}`}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs tracking-[0.2em] text-muted uppercase">
            {productTypeLabel(product.type)}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 py-5">
        <p className="text-xs tracking-[0.18em] text-gold-dark uppercase">
          {productTypeLabel(product.type)}
        </p>
        <h2 className="font-serif text-xl leading-snug group-hover:text-gold-dark">
          {product.title}
        </h2>
        <p className="mt-auto pt-3 text-sm">
          <Price paise={product.priceInPaise} />
        </p>
      </div>
    </Link>
  );
}
