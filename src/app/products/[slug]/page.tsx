import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/AddToCartButton";
import { Price } from "@/components/Price";
import { ShopContainer } from "@/components/ShopFrame";
import { getSessionUser } from "@/lib/auth-guard";
import { productTypeLabel } from "@/lib/products";
import { getStorefrontProduct } from "@/lib/storefront";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStorefrontProduct(slug);
  if (!product) return { title: "Not found" };
  return {
    title: product.title,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, user] = await Promise.all([
    getStorefrontProduct(slug),
    getSessionUser(),
  ]);

  if (!product) notFound();

  const readyToSell = Boolean(product.filePath);

  return (
    <ShopContainer>
      <p className="mb-10 text-sm text-muted">
        <Link href="/catalog" className="hover:text-gold-dark">
          Catalogue
        </Link>
        <span className="mx-2">/</span>
        <span>{product.title}</span>
      </p>

      <article className="grid gap-12 lg:grid-cols-2">
        <div className="aspect-[4/3] overflow-hidden border border-line bg-[#f4f1ea]">
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

        <div>
          <p className="text-xs tracking-[0.2em] text-gold-dark uppercase">
            {productTypeLabel(product.type)}
          </p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight">{product.title}</h1>
          <div className="mt-6 h-px w-16 bg-gold" />
          <p className="mt-6 font-serif text-2xl">
            <Price paise={product.priceInPaise} />
          </p>
          <p className="mt-3 text-sm text-muted">Digital download · INR</p>

          <div className="mt-8">
            {!readyToSell ? (
              <p className="text-sm text-muted">
                This title is currently unavailable.
              </p>
            ) : user ? (
              <AddToCartButton productId={product.id} />
            ) : (
              <Link
                href={`/login?callbackUrl=/products/${product.slug}`}
                className="inline-flex bg-foreground px-6 py-3 text-sm tracking-wide text-paper hover:bg-gold-dark"
              >
                Sign in to purchase
              </Link>
            )}
          </div>
        </div>
      </article>

      <section className="mx-auto mt-16 max-w-3xl">
        <h2 className="font-serif text-2xl">About this title</h2>
        <div className="mt-4 h-px w-16 bg-gold" />
        <p className="mt-6 whitespace-pre-wrap leading-relaxed text-muted">
          {product.description || "No description yet."}
        </p>
      </section>
    </ShopContainer>
  );
}
