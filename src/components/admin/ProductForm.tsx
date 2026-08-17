"use client";

import { useActionState, useMemo, useState } from "react";
import type { Product, ProductType } from "@prisma/client";
import {
  createProductAction,
  updateProductAction,
  type ProductFormState,
} from "@/app/actions/admin-products";
import { paiseToRupeeInput } from "@/lib/money";
import { isDigitalType } from "@/lib/products";

const types: { value: ProductType; label: string }[] = [
  { value: "COURSE", label: "Course (digital)" },
  { value: "DIGITAL_BOOK", label: "Book (digital)" },
  { value: "PHYSICAL_BOOK", label: "Book (hardcopy)" },
];

export function ProductForm({ product }: { product?: Product }) {
  const action = product
    ? updateProductAction.bind(null, product.id)
    : createProductAction;
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(
    action,
    null,
  );
  const [type, setType] = useState<ProductType>(product?.type ?? "COURSE");
  const digital = useMemo(() => isDigitalType(type), [type]);

  return (
    <form action={formAction} encType="multipart/form-data" className="max-w-2xl space-y-6">
      <label className="block">
        <span className="text-xs tracking-[0.16em] text-muted uppercase">Type</span>
        <select
          name="type"
          value={type}
          onChange={(event) => setType(event.target.value as ProductType)}
          className="mt-2 w-full border border-line bg-paper px-3 py-2.5"
        >
          {types.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {!digital ? (
        <p className="border border-line bg-[#f7f4ec] px-4 py-3 text-sm text-muted">
          Hardcopy books can be stored here, but they stay off the storefront and
          cannot be sold at checkout yet.
        </p>
      ) : null}

      <label className="block">
        <span className="text-xs tracking-[0.16em] text-muted uppercase">Title</span>
        <input
          name="title"
          required
          defaultValue={product?.title}
          className="mt-2 w-full border border-line bg-paper px-3 py-2.5 outline-none focus:border-gold"
        />
      </label>

      <label className="block">
        <span className="text-xs tracking-[0.16em] text-muted uppercase">Slug</span>
        <input
          name="slug"
          defaultValue={product?.slug}
          placeholder="Generated from title if blank"
          className="mt-2 w-full border border-line bg-paper px-3 py-2.5 outline-none focus:border-gold"
        />
      </label>

      <label className="block">
        <span className="text-xs tracking-[0.16em] text-muted uppercase">
          Description
        </span>
        <textarea
          name="description"
          required
          rows={8}
          defaultValue={product?.description}
          className="mt-2 w-full border border-line bg-paper px-3 py-2.5 outline-none focus:border-gold"
        />
      </label>

      <label className="block">
        <span className="text-xs tracking-[0.16em] text-muted uppercase">
          Price (INR)
        </span>
        <input
          name="priceRupees"
          type="number"
          min="0"
          step="0.01"
          required
          defaultValue={product ? paiseToRupeeInput(product.priceInPaise) : ""}
          className="mt-2 w-full border border-line bg-paper px-3 py-2.5 outline-none focus:border-gold"
        />
      </label>

      {digital ? (
        <label className="flex items-center gap-3">
          <input name="isListed" type="checkbox" defaultChecked={product?.isListed} />
          <span>List on storefront</span>
        </label>
      ) : (
        <p className="text-sm text-muted">Physical titles remain unlisted.</p>
      )}

      {digital ? (
        <label className="block">
          <span className="text-xs tracking-[0.16em] text-muted uppercase">
            Digital file
          </span>
          <input name="file" type="file" className="mt-2 w-full text-sm" />
          <p className="mt-1 text-sm text-muted">
            Buyers receive a signed download after payment. Digital stock is not
            decremented.
          </p>
          {product?.fileName ? (
            <p className="mt-1 text-sm text-muted">Current: {product.fileName}</p>
          ) : null}
        </label>
      ) : (
        <>
          <label className="block">
            <span className="text-xs tracking-[0.16em] text-muted uppercase">
              Stock quantity
            </span>
            <input
              name="stockQty"
              type="number"
              min="0"
              defaultValue={product?.stockQty ?? 0}
              className="mt-2 w-full border border-line bg-paper px-3 py-2.5"
            />
          </label>
          <label className="block">
            <span className="text-xs tracking-[0.16em] text-muted uppercase">
              Low-stock threshold
            </span>
            <input
              name="lowStockThreshold"
              type="number"
              min="0"
              defaultValue={product?.lowStockThreshold ?? 5}
              className="mt-2 w-full border border-line bg-paper px-3 py-2.5"
            />
          </label>
        </>
      )}

      <label className="block">
        <span className="text-xs tracking-[0.16em] text-muted uppercase">Cover image</span>
        <input name="cover" type="file" accept="image/*" className="mt-2 w-full text-sm" />
        {product?.coverPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/media/cover/${product.id}`}
            alt=""
            className="mt-3 h-28 w-28 object-cover"
          />
        ) : null}
      </label>

      {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="bg-foreground px-6 py-3 text-sm tracking-wide text-paper hover:bg-gold-dark disabled:opacity-60"
      >
        {pending ? "Saving…" : product ? "Save changes" : "Create product"}
      </button>
    </form>
  );
}
