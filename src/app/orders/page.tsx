import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { OrderDownloads } from "@/components/OrderDownloads";
import { OrderStatusLabel } from "@/components/OrderStatusLabel";
import { Price } from "@/components/Price";
import { PageHeader, ShopContainer } from "@/components/ShopFrame";
import { requireUser } from "@/lib/auth-guard";
import { formatOrderDate, listUserOrders } from "@/lib/storefront";

export const metadata: Metadata = { title: "My orders" };

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await listUserOrders(user.id);

  return (
    <ShopContainer>
      <PageHeader
        eyebrow="Account"
        title="My orders"
        description="Paid digital orders include a time-limited download button for each file."
      />

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          body="When you complete checkout, receipts and downloads will appear here."
        />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {orders.map((order) => (
            <li key={order.id} className="py-8">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <Link href={`/orders/${order.id}`} className="font-serif text-2xl hover:text-gold-dark">
                  Order {order.id.slice(-8).toUpperCase()}
                </Link>
                <OrderStatusLabel status={order.status} />
              </div>
              <p className="mt-2 text-sm text-muted">
                {formatOrderDate(order.createdAt)} · <Price paise={order.amountInPaise} />
              </p>
              <div className="mt-6">
                <OrderDownloads status={order.status} items={order.items} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </ShopContainer>
  );
}
