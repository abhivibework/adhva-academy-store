import { archiveProductAction } from "@/app/actions/admin-products";
import { SubmitButton } from "@/components/admin/SubmitButton";

export function ArchiveProductButton({
  productId,
  archived,
}: {
  productId: string;
  archived: boolean;
}) {
  return (
    <form action={archiveProductAction.bind(null, productId)}>
      <SubmitButton pendingLabel={archived ? "Restoring…" : "Archiving…"}>
        {archived ? "Restore" : "Archive"}
      </SubmitButton>
    </form>
  );
}
