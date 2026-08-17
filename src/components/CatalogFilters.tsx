import Link from "next/link";
import type { ProductType } from "@prisma/client";

const tabs: { href: string; label: string; type?: ProductType }[] = [
  { href: "/catalog", label: "All" },
  { href: "/catalog?type=COURSE", label: "Courses", type: "COURSE" },
  { href: "/catalog?type=DIGITAL_BOOK", label: "Digital books", type: "DIGITAL_BOOK" },
];

export function CatalogFilters({ active }: { active?: ProductType }) {
  return (
    <nav className="mb-10 flex flex-wrap gap-x-8 gap-y-2 text-sm tracking-wide">
      {tabs.map((tab) => {
        const selected = tab.type === active;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              selected
                ? "border-b border-gold pb-1 text-gold-dark"
                : "border-b border-transparent pb-1 text-muted hover:text-foreground"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
