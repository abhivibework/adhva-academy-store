import type { Metadata } from "next";
import { CatalogFilters } from "@/components/CatalogFilters";
import { ProductGrid } from "@/components/ProductGrid";
import { PageHeader, ShopContainer } from "@/components/ShopFrame";
import { listStorefrontProducts, parseStorefrontType } from "@/lib/storefront";

export const metadata: Metadata = {
  title: "Catalogue",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const params = await searchParams;
  const type = parseStorefrontType(params.type);
  const products = await listStorefrontProducts(type);
  const emptyTitle =
    type === "DIGITAL_BOOK"
      ? "No digital books yet"
      : type === "COURSE"
        ? "No courses yet"
        : "No titles yet";

  return (
    <ShopContainer>
      <PageHeader
        eyebrow="Shop"
        title="Catalogue"
        description="Digital courses and books from the institute."
      />
      <CatalogFilters active={type} />
      <ProductGrid products={products} emptyTitle={emptyTitle} />
    </ShopContainer>
  );
}
