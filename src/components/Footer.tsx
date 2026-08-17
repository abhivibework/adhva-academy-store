import Link from "next/link";
import { getSettings } from "@/lib/settings";

export async function Footer() {
  const settings = await getSettings();

  return (
    <footer className="mt-16 border-t border-line bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{settings.footerText || `${settings.siteName} — ${settings.tagline}`}</p>
        <div className="flex gap-6">
          {settings.contactEmail ? (
            <a href={`mailto:${settings.contactEmail}`} className="hover:text-gold-dark">
              {settings.contactEmail}
            </a>
          ) : null}
          <Link href="/catalog" className="hover:text-gold-dark">
            Catalogue
          </Link>
        </div>
      </div>
    </footer>
  );
}
