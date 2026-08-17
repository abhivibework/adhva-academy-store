import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/AuthForms";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { prisma } from "@/lib/prisma";
import { cashfreeConfigured, razorpayConfigured } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function AdminSettingsPage() {
  const settings = await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  const razorpayKeys = razorpayConfigured();
  const cashfreeKeys = cashfreeConfigured();

  return (
    <div>
      <h1 className="font-serif text-4xl">Settings</h1>
      <p className="mt-3 mb-8 max-w-xl text-muted">
        Institute contact and footer copy, plus independent Razorpay and Cashfree
        switches. The default gateway is used at checkout when more than one is on.
      </p>
      <ul className="mb-10 max-w-xl space-y-1 text-sm text-muted">
        <li>
          Razorpay keys: {razorpayKeys ? "present in env" : "missing — enable will not take effect until keys are set"}
        </li>
        <li>
          Cashfree keys: {cashfreeKeys ? "present in env" : "missing — enable will not take effect until keys are set"}
        </li>
      </ul>
      <SettingsForm settings={settings} />

      <section className="mt-16 max-w-xl border-t border-line pt-10">
        <h2 className="font-serif text-2xl">Your password</h2>
        <p className="mt-2 mb-6 text-sm text-muted">
          Change the password you use to sign in to admin.
        </p>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
