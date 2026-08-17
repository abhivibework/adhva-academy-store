import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderDownloads } from "@/components/OrderDownloads";
import { OrderStatusLabel } from "@/components/OrderStatusLabel";
import { Price } from "@/components/Price";
import { PageHeader, ShopContainer } from "@/components/ShopFrame";
import { requireUser } from "@/lib/auth-guard";
import { formatOrderDate, getUserOrder } from "@/lib/storefront";

export const metadata: Metadata = { title: "Order" };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const order = await getUserOrder(user.id, id);

  if (!order) notFound();

  return (
    <ShopContainer>
      <p className="mb-8 text-sm text-muted">
        <Link href="/orders" className="hover:text-gold-dark">
          My orders
        </Link>
        <span className="mx-2">/</span>
        <span>{order.id.slice(-8).toUpperCase()}</span>
      </p>

      <PageHeader
        eyebrow="Receipt"
        title={`Order ${order.id.slice(-8).toUpperCase()}`}
        description={`${formatOrderDate(order.createdAt)}. Downloads stay available after payment, with a fresh signed link each time you press the button.`}
      />

      <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-y border-line py-6">
        <OrderStatusLabel status={order.status} />
        <p className="font-serif text-2xl">
          <Price paise={order.amountInPaise} />
        </p>
      </div>

      <h2 className="font-serif text-2xl">Items</h2>
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-baseline justify-between gap-4 py-5">
            <div>
              <p className="font-serif text-xl">{item.title}</p>
              <p className="mt-1 text-sm text-muted">Qty {item.qty}</p>
            </div>
            <Price paise={item.priceInPaise * item.qty} />
          </li>
        ))}
      </ul>

      <section className="mt-12">
        <h2 className="font-serif text-2xl">Downloads</h2>
        <div className="mt-4 mb-6 h-px w-16 bg-gold" />
        <OrderDownloads status={order.status} items={order.items} />
      </section>
    </ShopContainer>
  );
}
