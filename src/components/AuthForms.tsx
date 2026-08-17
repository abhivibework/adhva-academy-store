"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  changePasswordAction,
  loginAction,
  registerAction,
  type AuthState,
  type ChangePasswordState,
} from "@/app/actions/auth";

function Field({
  label,
  name,
  type,
  autoComplete,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
}) {
  return (
    <label className="block">
      <span className="text-xs tracking-[0.16em] text-muted uppercase">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className="mt-2 w-full border border-line bg-paper px-3 py-2.5 outline-none focus:border-gold"
      />
    </label>
  );
}

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, null);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Field label="Password" name="password" type="password" autoComplete="current-password" />
      {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-foreground py-3 text-sm tracking-wide text-paper hover:bg-gold-dark disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="text-gold-dark hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    registerAction,
    null,
  );

  return (
    <form action={action} className="space-y-5">
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
      />
      {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-foreground py-3 text-sm tracking-wide text-paper hover:bg-gold-dark disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Register"}
      </button>
      <p className="text-center text-sm text-muted">
        Already registered?{" "}
        <Link href="/login" className="text-gold-dark hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<ChangePasswordState, FormData>(
    changePasswordAction,
    null,
  );

  return (
    <form action={action} className="max-w-xl space-y-5">
      <Field
        label="Current password"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
      />
      <Field
        label="New password"
        name="newPassword"
        type="password"
        autoComplete="new-password"
      />
      <Field
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
      />
      {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm text-gold-dark">Password updated.</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="bg-foreground px-6 py-3 text-sm tracking-wide text-paper hover:bg-gold-dark disabled:opacity-60"
      >
        {pending ? "Updating…" : "Change password"}
      </button>
    </form>
  );
}
