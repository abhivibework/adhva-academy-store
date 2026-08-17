import type { OrderStatus } from "@prisma/client";
import { orderStatusLabel } from "@/lib/storefront";

export function OrderStatusLabel({ status }: { status: OrderStatus }) {
  return (
    <span className="text-xs tracking-[0.16em] text-gold-dark uppercase">
      {orderStatusLabel(status)}
    </span>
  );
}
