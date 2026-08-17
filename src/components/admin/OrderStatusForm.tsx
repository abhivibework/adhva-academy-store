import { OrderStatus } from "@prisma/client";
import { updateOrderStatusAction } from "@/app/actions/admin-orders";
import { SubmitButton } from "@/components/admin/SubmitButton";

const statuses: { value: OrderStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "FAILED", label: "Failed" },
  { value: "FULFILLED", label: "Fulfilled" },
];

export function OrderStatusForm({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  return (
    <form
      action={updateOrderStatusAction.bind(null, orderId)}
      className="flex flex-wrap items-end gap-3"
    >
      <label className="block">
        <span className="text-xs tracking-[0.16em] text-muted uppercase">Status</span>
        <select
          name="status"
          defaultValue={status}
          className="mt-2 block border border-line bg-paper px-3 py-2"
        >
          {statuses.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <SubmitButton pendingLabel="Updating…">Update status</SubmitButton>
    </form>
  );
}
