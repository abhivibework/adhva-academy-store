"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/settings", label: "Settings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="border-b border-line bg-paper md:w-56 md:shrink-0 md:border-r md:border-b-0">
      <div className="px-6 py-5">
        <p className="text-xs tracking-[0.2em] text-gold-dark uppercase">Admin</p>
      </div>
      <nav className="flex gap-4 overflow-x-auto px-6 pb-4 md:flex-col md:gap-1 md:pb-8">
        {links.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap py-1.5 text-sm ${
                active ? "text-gold-dark" : "text-foreground/80 hover:text-gold-dark"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
