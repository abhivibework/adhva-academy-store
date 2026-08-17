"use client";

import { useActionState } from "react";
import type { Settings } from "@prisma/client";
import {
  updateSettingsAction,
  type SettingsState,
} from "@/app/actions/admin-settings";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    updateSettingsAction,
    null,
  );

  return (
    <form action={action} className="max-w-2xl space-y-6">
      <label className="block">
        <span className="text-xs tracking-[0.16em] text-muted uppercase">Site name</span>
        <input
          name="siteName"
          defaultValue={settings.siteName}
          required
          className="mt-2 w-full border border-line bg-paper px-3 py-2.5 outline-none focus:border-gold"
        />
      </label>
      <label className="block">
        <span className="text-xs tracking-[0.16em] text-muted uppercase">Tagline</span>
        <input
          name="tagline"
          defaultValue={settings.tagline}
          className="mt-2 w-full border border-line bg-paper px-3 py-2.5 outline-none focus:border-gold"
        />
      </label>
      <label className="block">
        <span className="text-xs tracking-[0.16em] text-muted uppercase">
          Contact email
        </span>
        <input
          name="contactEmail"
          type="email"
          defaultValue={settings.contactEmail}
          className="mt-2 w-full border border-line bg-paper px-3 py-2.5 outline-none focus:border-gold"
        />
      </label>
      <label className="block">
        <span className="text-xs tracking-[0.16em] text-muted uppercase">
          Footer text
        </span>
        <textarea
          name="footerText"
          rows={3}
          defaultValue={settings.footerText}
          className="mt-2 w-full border border-line bg-paper px-3 py-2.5 outline-none focus:border-gold"
        />
      </label>

      <fieldset className="space-y-3 border border-line px-4 py-4">
        <legend className="px-1 text-xs tracking-[0.16em] text-muted uppercase">
          Payment gateways
        </legend>
        <label className="flex items-center gap-3">
          <input
            name="razorpayEnabled"
            type="checkbox"
            defaultChecked={settings.razorpayEnabled}
          />
          Enable Razorpay
        </label>
        <label className="flex items-center gap-3">
          <input
            name="cashfreeEnabled"
            type="checkbox"
            defaultChecked={settings.cashfreeEnabled}
          />
          Enable Cashfree
        </label>
        <label className="block pt-2">
          <span className="text-xs tracking-[0.16em] text-muted uppercase">
            Default gateway
          </span>
          <select
            name="defaultGateway"
            defaultValue={settings.defaultGateway}
            className="mt-2 w-full border border-line bg-paper px-3 py-2.5"
          >
            <option value="RAZORPAY">Razorpay</option>
            <option value="CASHFREE">Cashfree</option>
          </select>
        </label>
      </fieldset>

      {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm text-gold-dark">Settings saved.</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="bg-foreground px-6 py-3 text-sm tracking-wide text-paper hover:bg-gold-dark disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
