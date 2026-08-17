import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/SignOutButton";
import { prisma } from "@/lib/prisma";
import { storefrontProductWhere } from "@/lib/products";
import { getSettings } from "@/lib/settings";

export async function Header() {
  const [session, settings] = await Promise.all([auth(), getSettings()]);
  let cartCount = 0;
  if (session?.user?.id) {
    try {
      cartCount = await prisma.cartItem.count({
        where: {
          userId: session.user.id,
          product: { ...storefrontProductWhere, filePath: { not: null } },
        },
      });
    } catch {
      cartCount = 0;
    }
  }

  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="shrink-0">
          <Image
            src="/logo.png"
            alt={settings.siteName}
            width={280}
            height={72}
            className="hidden h-14 w-auto object-contain sm:block"
            priority
          />
          <Image
            src="/crest.png"
            alt={settings.siteName}
            width={56}
            height={56}
            className="h-12 w-12 object-contain sm:hidden"
            priority
          />
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 text-sm tracking-wide">
          <Link href="/catalog" className="text-foreground/80 hover:text-gold-dark">
            Catalogue
          </Link>
          <Link href="/cart" className="text-foreground/80 hover:text-gold-dark">
            Cart{cartCount > 0 ? ` (${cartCount})` : ""}
          </Link>
          {session?.user ? (
            <>
              <Link href="/account" className="text-foreground/80 hover:text-gold-dark">
                Account
              </Link>
              <Link href="/orders" className="text-foreground/80 hover:text-gold-dark">
                My orders
              </Link>
              {session.user.role === "ADMIN" ? (
                <Link href="/admin" className="text-gold-dark hover:text-foreground">
                  Admin
                </Link>
              ) : null}
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-foreground/80 hover:text-gold-dark">
                Sign in
              </Link>
              <Link
                href="/register"
                className="border border-foreground px-3 py-1.5 text-foreground hover:border-gold hover:text-gold-dark"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
