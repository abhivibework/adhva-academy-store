export function formatInr(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

export function rupeesToPaise(value: string | number) {
  const amount = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Enter a valid price in rupees.");
  }
  return Math.round(amount * 100);
}

export function paiseToRupeeInput(paise: number) {
  return (paise / 100).toFixed(2);
}

export function paiseToCashfreeAmount(paise: number) {
  return Number((paise / 100).toFixed(2));
}
