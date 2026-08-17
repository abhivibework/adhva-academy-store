import type { Prisma, ProductType } from "@prisma/client";

export const STOREFRONT_TYPES: ProductType[] = ["COURSE", "DIGITAL_BOOK"];

export const storefrontProductWhere: Prisma.ProductWhereInput = {
  isListed: true,
  isDigital: true,
  archivedAt: null,
  type: { in: STOREFRONT_TYPES },
};

export function isStorefrontProduct(product: {
  isListed: boolean;
  isDigital: boolean;
  archivedAt: Date | null;
  type: ProductType;
}) {
  return (
    product.isListed &&
    product.isDigital &&
    !product.archivedAt &&
    STOREFRONT_TYPES.includes(product.type)
  );
}

/** Listed digital titles with a download file — the only items checkout will sell. */
export function isDigitalCheckoutProduct(product: {
  isListed: boolean;
  isDigital: boolean;
  archivedAt: Date | null;
  type: ProductType;
  filePath: string | null;
}) {
  return isStorefrontProduct(product) && Boolean(product.filePath);
}

export function productTypeLabel(type: ProductType) {
  switch (type) {
    case "COURSE":
      return "Course";
    case "DIGITAL_BOOK":
      return "Digital book";
    case "PHYSICAL_BOOK":
      return "Hardcopy book";
  }
}

export function isDigitalType(type: ProductType) {
  return type === "COURSE" || type === "DIGITAL_BOOK";
}
