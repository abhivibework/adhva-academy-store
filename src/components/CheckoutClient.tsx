"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PaymentProvider } from "@prisma/client";
import { formatInr } from "@/lib/money";

type Props = {
  amountInPaise: number;
  email?: string | null;
  phone?: string | null;
  enabled: PaymentProvider[];
  preferred: PaymentProvider;
};

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load payment script."));
    document.body.appendChild(script);
  });
}

export function CheckoutClient({
  amountInPaise,
  email,
  phone,
  enabled,
  preferred,
}: Props) {
  const router = useRouter();
  const [provider, setProvider] = useState<PaymentProvider>(preferred);
  const [contact, setContact] = useState(phone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const showChooser = enabled.length > 1;

  async function pay() {
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, phone: contact }),
      });
      const data = (await response.json()) as {
        error?: string;
        orderId?: string;
        razorpay?: { keyId: string; orderId: string };
        cashfree?: { paymentSessionId: string; mode: "sandbox" | "production" };
      };
      if (!response.ok || !data.orderId) {
        throw new Error(data.error || "Could not start checkout.");
      }

      if (provider === "RAZORPAY" && data.razorpay) {
        await loadScript("https://checkout.razorpay.com/v1/checkout.js");
        await new Promise<void>((resolve, reject) => {
          let completed = false;
          const checkout = new window.Razorpay({
            key: data.razorpay!.keyId,
            amount: amountInPaise,
            currency: "INR",
            name: "Adhva Academy",
            description: "Digital order",
            order_id: data.razorpay!.orderId,
            prefill: { email: email ?? undefined, contact: contact || undefined },
            theme: { color: "#9c8754" },
            modal: {
              ondismiss: () => {
                if (!completed) reject(new Error("Payment cancelled."));
              },
            },
            handler: async (result) => {
              completed = true;
              try {
                const verify = await fetch("/api/checkout/verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    provider: "RAZORPAY",
                    orderId: data.orderId,
                    razorpayOrderId: result.razorpay_order_id,
                    razorpayPaymentId: result.razorpay_payment_id,
                    razorpaySignature: result.razorpay_signature,
                  }),
                });
                if (!verify.ok) {
                  const body = (await verify.json()) as { error?: string };
                  throw new Error(body.error || "Could not confirm payment.");
                }
                router.push(`/orders/${data.orderId}`);
                resolve();
              } catch (err) {
                reject(err);
              }
            },
          });
          checkout.on("payment.failed", (response) => {
            if (!completed) {
              reject(new Error(response.error?.description || "Payment failed."));
            }
          });
          checkout.open();
        });
        return;
      }

      if (provider === "CASHFREE" && data.cashfree) {
        await loadScript("https://sdk.cashfree.com/js/v3/cashfree.js");
        const cashfree = window.Cashfree({ mode: data.cashfree.mode });
        const result = await cashfree.checkout({
          paymentSessionId: data.cashfree.paymentSessionId,
          redirectTarget: "_modal",
        });
        if (result.error?.message) {
          throw new Error(result.error.message);
        }
        const verify = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: "CASHFREE", orderId: data.orderId }),
        });
        if (verify.ok) {
          router.push(`/orders/${data.orderId}`);
          return;
        }
        window.location.assign(`/api/checkout/return?order_id=adhva_${data.orderId}`);
        return;
      }

      throw new Error("Payment method is unavailable.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      {showChooser ? (
        <fieldset className="space-y-3">
          <legend className="text-xs tracking-[0.16em] text-muted uppercase">
            Pay with
          </legend>
          {enabled.map((option) => (
            <label key={option} className="flex cursor-pointer items-center gap-3 border border-line px-4 py-3">
              <input
                type="radio"
                name="provider"
                checked={provider === option}
                onChange={() => setProvider(option)}
              />
              <span>{option === "RAZORPAY" ? "Razorpay" : "Cashfree"}</span>
            </label>
          ))}
        </fieldset>
      ) : (
        <p className="text-sm text-muted">
          Paying with {preferred === "RAZORPAY" ? "Razorpay" : "Cashfree"}.
        </p>
      )}

      {provider === "CASHFREE" ? (
        <label className="block">
          <span className="text-xs tracking-[0.16em] text-muted uppercase">
            Mobile number
          </span>
          <input
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            inputMode="tel"
            placeholder="10-digit Indian mobile"
            className="mt-2 w-full border border-line bg-paper px-3 py-2.5 outline-none focus:border-gold"
          />
        </label>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="button"
        onClick={pay}
        disabled={pending}
        className="w-full bg-foreground py-3 text-sm tracking-wide text-paper hover:bg-gold-dark disabled:opacity-60"
      >
        {pending ? "Opening checkout…" : `Pay ${formatInr(amountInPaise)}`}
      </button>
    </div>
  );
}
