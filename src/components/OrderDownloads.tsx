import type { OrderItem, Product } from "@prisma/client";
import { DownloadButton } from "@/components/DownloadButton";
import { isPaidOrder } from "@/lib/storefront";
import type { OrderStatus } from "@prisma/client";

type Item = OrderItem & { product: Pick<Product, "isDigital" | "filePath" | "fileName"> };

export function OrderDownloads({
  status,
  items,
}: {
  status: OrderStatus;
  items: Item[];
}) {
  if (!isPaidOrder(status)) {
    return (
      <p className="text-sm text-muted">
        Downloads appear here after payment is confirmed.
      </p>
    );
  }

  const digital = items.filter((item) => item.product.isDigital);

  if (digital.length === 0) {
    return <p className="text-sm text-muted">No digital files on this order.</p>;
  }

  return (
    <ul className="space-y-3">
      {digital.map((item) => (
        <li key={item.id} className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">{item.title}</p>
          {item.product.filePath ? (
            <DownloadButton
              orderItemId={item.id}
              label={item.product.fileName ? `Download ${item.product.fileName}` : "Download"}
            />
          ) : (
            <span className="text-sm text-muted">Download is currently unavailable</span>
          )}
        </li>
      ))}
    </ul>
  );
}
