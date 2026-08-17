import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Overview",
};

export default async function AdminOverviewPage() {
  const [
    productCount,
    listedCount,
    physicalCount,
    lowStockCount,
    pendingOrders,
    paidOrders,
    settings,
  ] = await Promise.all([
    prisma.product.count({ where: { archivedAt: null } }),
    prisma.product.count({
      where: { archivedAt: null, isListed: true, isDigital: true },
    }),
    prisma.product.count({
      where: { archivedAt: null, type: "PHYSICAL_BOOK" },
    }),
    prisma.product
      .findMany({
        where: { archivedAt: null, type: "PHYSICAL_BOOK" },
        select: { stockQty: true, lowStockThreshold: true },
      })
      .then((rows) => rows.filter((item) => item.stockQty <= item.lowStockThreshold).length),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "PAID" } }),
    getSettings(),
  ]);

  const cards = [
    { href: "/admin/products", label: "Products", value: productCount, note: `${listedCount} listed digitally` },
    { href: "/admin/inventory", label: "Hardcopy titles", value: physicalCount, note: `${lowStockCount} at or below threshold` },
    { href: "/admin/orders", label: "Open orders", value: pendingOrders, note: `${paidOrders} paid` },
    {
      href: "/admin/settings",
      label: "Gateways",
      value: [settings.razorpayEnabled && "Razorpay", settings.cashfreeEnabled && "Cashfree"]
        .filter(Boolean)
        .join(" · ") || "None enabled",
      note: `Default: ${settings.defaultGateway === "CASHFREE" ? "Cashfree" : "Razorpay"}`,
    },
  ];

  return (
    <div>
      <h1 className="font-serif text-4xl">Admin</h1>
      <p className="mt-3 max-w-xl text-muted">
        Catalogue, inventory, and orders. The storefront stays empty until you add
        and list a digital product.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="border border-line bg-paper px-5 py-6 hover:border-gold"
          >
            <p className="text-xs tracking-[0.18em] text-gold-dark uppercase">
              {card.label}
            </p>
            <p className="mt-3 font-serif text-3xl">{card.value}</p>
            <p className="mt-2 text-sm text-muted">{card.note}</p>
          </Link>
        ))}
      </div>

      <Link
        href="/admin/products/new"
        className="mt-10 inline-block bg-foreground px-6 py-3 text-sm tracking-wide text-paper hover:bg-gold-dark"
      >
        New product
      </Link>
    </div>
  );
}
