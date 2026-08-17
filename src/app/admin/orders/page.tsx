import type { Metadata } from "next";
import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { OrderStatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Price } from "@/components/Price";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Orders",
};

const filters: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "FAILED", label: "Failed" },
  { value: "FULFILLED", label: "Fulfilled" },
];

function isOrderStatus(value: string): value is OrderStatus {
  return ["PENDING", "PAID", "FAILED", "FULFILLED"].includes(value);
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const selected = status && isOrderStatus(status) ? status : undefined;

  const orders = await prisma.order.findMany({
    where: selected ? { status: selected } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true } },
      items: true,
    },
  });

  return (
    <div>
      <h1 className="font-serif text-4xl">Orders</h1>
      <p className="mt-2 text-muted">Paid, pending, failed, and fulfilled orders.</p>

      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        {filters.map((filter) => {
          const href = filter.value
            ? `/admin/orders?status=${filter.value}`
            : "/admin/orders";
          const active = (selected ?? "") === filter.value;
          return (
            <Link
              key={filter.label}
              href={href}
              className={active ? "text-gold-dark" : "text-muted hover:text-gold-dark"}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="No orders"
            body={
              selected
                ? "No orders with this status."
                : "Orders will appear here after checkout."
            }
          />
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs tracking-[0.16em] text-muted uppercase">
                <th className="py-3 pr-4 font-normal">Order</th>
                <th className="py-3 pr-4 font-normal">Customer</th>
                <th className="py-3 pr-4 font-normal">Amount</th>
                <th className="py-3 pr-4 font-normal">Status</th>
                <th className="py-3 pr-4 font-normal">Gateway</th>
                <th className="py-3 font-normal"> </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-line">
                  <td className="py-4 pr-4">
                    <p className="font-mono text-xs">{order.id.slice(-8)}</p>
                    <p className="mt-1 text-muted">
                      {order.createdAt.toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    <p className="mt-1 text-muted">
                      {order.items.length} item{order.items.length === 1 ? "" : "s"}
                    </p>
                  </td>
                  <td className="py-4 pr-4">{order.user.email}</td>
                  <td className="py-4 pr-4">
                    <Price paise={order.amountInPaise} />
                  </td>
                  <td className="py-4 pr-4">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="py-4 pr-4 text-muted">
                    {order.paymentProvider ?? "—"}
                  </td>
                  <td className="py-4 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="hover:text-gold-dark"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
