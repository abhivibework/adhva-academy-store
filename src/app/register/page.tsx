import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/AuthForms";
import { ShopContainer } from "@/components/ShopFrame";
import { auth } from "@/auth";

export const metadata: Metadata = { title: "Register" };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <ShopContainer narrow>
      <Image
        src="/crest.png"
        alt=""
        width={56}
        height={56}
        className="mb-8 h-12 w-12 object-contain"
      />
      <h1 className="font-serif text-4xl tracking-tight">Create an account</h1>
      <p className="mt-3 mb-8 text-muted">
        Register to save a cart and access paid downloads.
      </p>
      <div className="mb-8 h-px w-16 bg-gold" />
      <RegisterForm />
    </ShopContainer>
  );
}
