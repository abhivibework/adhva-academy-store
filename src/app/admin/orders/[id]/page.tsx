import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { OrderStatusBadge } from "@/components/admin/StatusBadge";
import { Price } from "@/components/Price";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Order",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { email: true } },
      items: {
        include: {
          product: { select: { slug: true, isDigital: true, fileName: true } },
        },
      },
    },
  });
  if (!order) notFound();

  return (
    <div>
      <p className="text-sm">
        <Link href="/admin/orders" className="text-muted hover:text-gold-dark">
          ← Orders
        </Link>
      </p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Order</h1>
          <p className="mt-2 font-mono text-sm text-muted">{order.id}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <dl className="mt-8 grid gap-4 border-y border-line py-6 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs tracking-[0.16em] text-muted uppercase">Customer</dt>
          <dd className="mt-1">{order.user.email}</dd>
        </div>
        <div>
          <dt className="text-xs tracking-[0.16em] text-muted uppercase">Placed</dt>
          <dd className="mt-1">
            {order.createdAt.toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </dd>
        </div>
        <div>
          <dt className="text-xs tracking-[0.16em] text-muted uppercase">Amount</dt>
          <dd className="mt-1">
            <Price paise={order.amountInPaise} />
          </dd>
        </div>
        <div>
          <dt className="text-xs tracking-[0.16em] text-muted uppercase">Gateway</dt>
          <dd className="mt-1">{order.paymentProvider ?? "Not started"}</dd>
        </div>
        {order.razorpayOrderId ? (
          <div>
            <dt className="text-xs tracking-[0.16em] text-muted uppercase">
              Razorpay order
            </dt>
            <dd className="mt-1 font-mono text-xs">{order.razorpayOrderId}</dd>
          </div>
        ) : null}
        {order.cashfreeOrderId ? (
          <div>
            <dt className="text-xs tracking-[0.16em] text-muted uppercase">
              Cashfree order
            </dt>
            <dd className="mt-1 font-mono text-xs">{order.cashfreeOrderId}</dd>
          </div>
        ) : null}
      </dl>

      <h2 className="mt-10 font-serif text-2xl">Items</h2>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {order.items.map((item) => (
          <li key={item.id} className="flex flex-wrap justify-between gap-3 py-4">
            <div>
              <p className="font-serif text-lg">{item.title}</p>
              <p className="mt-1 text-sm text-muted">
                Qty {item.qty}
                {item.product.isDigital
                  ? item.product.fileName
                    ? ` · ${item.product.fileName}`
                    : " · Digital"
                  : " · Hardcopy"}
              </p>
            </div>
            <Price paise={item.priceInPaise * item.qty} />
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <OrderStatusForm orderId={order.id} status={order.status} />
      </div>
    </div>
  );
}
