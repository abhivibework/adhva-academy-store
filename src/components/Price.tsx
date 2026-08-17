import { formatInr } from "@/lib/money";

export function Price({ paise }: { paise: number }) {
  return <span className="tabular-nums">{formatInr(paise)}</span>;
}
