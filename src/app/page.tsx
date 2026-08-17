import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/components/ProductGrid";
import { ShopContainer } from "@/components/ShopFrame";
import { getSettings } from "@/lib/settings";
import { listStorefrontProducts } from "@/lib/storefront";

export default async function HomePage() {
  const [settings, products] = await Promise.all([
    getSettings(),
    listStorefrontProducts(),
  ]);

  return (
    <>
      <section className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
        <Image
          src="/crest.png"
          alt=""
          width={120}
          height={120}
          className="h-24 w-24 object-contain"
          priority
        />
        <p className="mt-10 text-xs tracking-[0.28em] text-gold-dark uppercase">
          {settings.tagline}
        </p>
        <h1 className="mt-4 font-serif text-5xl tracking-tight text-foreground">
          {settings.siteName}
        </h1>
        <div className="mt-8 h-px w-24 bg-gold" />
        <p className="mt-8 max-w-md text-muted leading-relaxed">
          Digital courses and books from the institute.
        </p>
        <Link
          href="/catalog"
          className="mt-10 border border-foreground px-6 py-3 text-sm tracking-wide hover:border-gold hover:text-gold-dark"
        >
          View catalogue
        </Link>
      </section>

      <ShopContainer>
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs tracking-[0.22em] text-gold-dark uppercase">Catalogue</p>
            <h2 className="mt-2 font-serif text-3xl">Latest titles</h2>
          </div>
          <Link href="/catalog" className="text-sm text-muted hover:text-gold-dark">
            Browse all
          </Link>
        </div>
        <ProductGrid products={products.slice(0, 6)} />
      </ShopContainer>
    </>
  );
}
