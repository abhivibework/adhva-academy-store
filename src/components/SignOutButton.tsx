"use client";

import { signOutAction } from "@/app/actions/auth";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button type="submit" className="text-foreground/80 hover:text-gold-dark">
        Sign out
      </button>
    </form>
  );
}
