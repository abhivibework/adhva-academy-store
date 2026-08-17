import type { OrderStatus, ProductType } from "@prisma/client";

const orderStyles: Record<OrderStatus, string> = {
  PENDING: "text-muted",
  PAID: "text-gold-dark",
  FAILED: "text-red-700",
  FULFILLED: "text-foreground",
};

export function orderStatusLabel(status: OrderStatus) {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "PAID":
      return "Paid";
    case "FAILED":
      return "Failed";
    case "FULFILLED":
      return "Fulfilled";
  }
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`text-sm tracking-wide ${orderStyles[status]}`}>
      {orderStatusLabel(status)}
    </span>
  );
}

export function listingLabel(product: {
  type: ProductType;
  isListed: boolean;
  isDigital: boolean;
  archivedAt: Date | null;
}) {
  if (product.archivedAt) return "Archived";
  if (!product.isDigital || product.type === "PHYSICAL_BOOK") return "Unlisted";
  return product.isListed ? "Listed" : "Unlisted";
}
