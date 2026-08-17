import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/AuthForms";
import { ShopContainer } from "@/components/ShopFrame";
import { auth } from "@/auth";
import { safeCallbackUrl } from "@/lib/storefront";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const callbackUrl = safeCallbackUrl((await searchParams).callbackUrl);
  const session = await auth();
  if (session?.user) redirect(callbackUrl);

  return (
    <ShopContainer narrow>
      <Image
        src="/crest.png"
        alt=""
        width={56}
        height={56}
        className="mb-8 h-12 w-12 object-contain"
      />
      <h1 className="font-serif text-4xl tracking-tight">Sign in</h1>
      <p className="mt-3 mb-8 text-muted">
        Use your email and password to continue.
      </p>
      <div className="mb-8 h-px w-16 bg-gold" />
      <LoginForm callbackUrl={callbackUrl} />
    </ShopContainer>
  );
}
