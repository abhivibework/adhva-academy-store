export {};

declare global {
  interface Window {
    Razorpay: new (options: {
      key: string;
      amount: number;
      currency: string;
      name: string;
      description?: string;
      order_id: string;
      prefill?: { email?: string; contact?: string };
      theme?: { color?: string };
      modal?: { ondismiss?: () => void };
      handler: (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => void;
    }) => {
      open: () => void;
      on: (
        event: "payment.failed",
        handler: (response: { error?: { description?: string } }) => void,
      ) => void;
    };
    Cashfree: (config: { mode: "sandbox" | "production" }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: "_modal" | "_self" | "_blank";
      }) => Promise<{
        error?: { message?: string };
        redirect?: boolean;
        paymentDetails?: unknown;
      }>;
    };
  }
}
