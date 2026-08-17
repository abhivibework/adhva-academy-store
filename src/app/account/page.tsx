import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/AuthForms";
import { PageHeader, ShopContainer } from "@/components/ShopFrame";
import { requireUser } from "@/lib/auth-guard";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <ShopContainer narrow>
      <PageHeader
        eyebrow="Account"
        title="Sign-in details"
        description="Update the password for this account. You will keep using the same email."
      />
      <p className="mb-8 text-sm text-muted">{user.email}</p>
      <ChangePasswordForm />
    </ShopContainer>
  );
}
