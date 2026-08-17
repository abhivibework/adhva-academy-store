import Link from "next/link";
import { ShopContainer } from "@/components/ShopFrame";

export default function NotFound() {
  return (
    <ShopContainer narrow>
      <p className="text-xs tracking-[0.22em] text-gold-dark uppercase">404</p>
      <h1 className="mt-3 font-serif text-4xl">Page not found</h1>
      <div className="mt-8 h-px w-16 bg-gold" />
      <p className="mt-6 text-muted">That page is not in the Adhva Academy shop.</p>
      <Link
        href="/catalog"
        className="mt-10 inline-flex border border-foreground px-6 py-3 text-sm tracking-wide hover:border-gold hover:text-gold-dark"
      >
        View catalogue
      </Link>
    </ShopContainer>
  );
}
