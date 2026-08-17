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
import {
  CHUNK_SIZE_BYTES,
  COVER_MAX_BYTES,
  FILE_MAX_BYTES,
  formatMaxSize,
} from "@/lib/upload-limits";

const types: { value: ProductType; label: string }[] = [
  { value: "COURSE", label: "Course (digital)" },
  { value: "DIGITAL_BOOK", label: "Book (digital)" },
  { value: "PHYSICAL_BOOK", label: "Book (hardcopy)" },
];

function newUploadId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function postChunk(
  file: File,
  kind: "covers" | "files",
  uploadId: string,
  chunkIndex: number,
  chunkCount: number,
  blob: Blob,
) {
  const params = new URLSearchParams({
    kind,
    uploadId,
    chunkIndex: String(chunkIndex),
    chunkCount: String(chunkCount),
    fileName: file.name,
    fileType: file.type,
    totalSize: String(file.size),
  });

  let lastError = "Could not upload file.";
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`/api/admin/uploads?${params}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/octet-stream" },
      body: blob,
    });
    const payload = (await response.json().catch(() => null)) as
      | { relative?: string; originalName?: string; error?: string; done?: boolean }
      | null;
    if (response.ok) return payload;
    lastError = payload?.error ?? lastError;
  }
  throw new Error(lastError);
}

async function uploadAdminFile(
  file: File,
  kind: "covers" | "files",
  onProgress: (label: string) => void,
) {
  const uploadId = newUploadId();
  const chunkCount = Math.max(1, Math.ceil(file.size / CHUNK_SIZE_BYTES));
  const label = kind === "covers" ? "cover" : "file";
  let saved: { relative?: string; originalName?: string } | null = null;

  for (let index = 0; index < chunkCount; index += 1) {
    onProgress(
      chunkCount === 1
        ? `Uploading ${label}…`
        : `Uploading ${label} ${index + 1}/${chunkCount}…`,
    );
    const blob = file.slice(index * CHUNK_SIZE_BYTES, Math.min(file.size, (index + 1) * CHUNK_SIZE_BYTES));
    saved = await postChunk(file, kind, uploadId, index, chunkCount, blob);
  }

  if (!saved?.relative) {
    throw new Error("Upload did not finish. Try again.");
  }
  return { relative: saved.relative, originalName: saved.originalName ?? file.name };
}

export function ProductForm({ product }: { product?: Product }) {
  const action = product
    ? updateProductAction.bind(null, product.id)
    : createProductAction;
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(
    action,
    null,
  );
  const [type, setType] = useState<ProductType>(product?.type ?? "COURSE");
  const [uploading, setUploading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState("Uploading files…");
  const [clientError, setClientError] = useState<string | null>(null);
  const digital = useMemo(() => isDigitalType(type), [type]);
  const busy = pending || uploading;

  async function submitWithUploads(formData: FormData) {
    setClientError(null);
    const cover = formData.get("cover");
    const file = formData.get("file");

    if (cover instanceof File && cover.size > COVER_MAX_BYTES) {
      setClientError(`Cover images must be ${formatMaxSize(COVER_MAX_BYTES)} or smaller.`);
      return;
    }
    if (file instanceof File && file.size > FILE_MAX_BYTES) {
      setClientError(`Digital files must be ${formatMaxSize(FILE_MAX_BYTES)} or smaller.`);
      return;
    }

    setUploading(true);
    setUploadLabel("Uploading files…");
    try {
      if (cover instanceof File && cover.size > 0) {
        const saved = await uploadAdminFile(cover, "covers", setUploadLabel);
        formData.set("uploadedCover", saved.relative);
      }
      if (file instanceof File && file.size > 0) {
        const saved = await uploadAdminFile(file, "files", setUploadLabel);
        formData.set("uploadedFile", saved.relative);
        formData.set("uploadedFileName", saved.originalName);
      }
      formData.delete("cover");
      formData.delete("file");
    } catch (error) {
      setClientError(error instanceof Error ? error.message : "Could not upload files.");
      setUploading(false);
      return;
    }
    setUploading(false);
    formAction(formData);
  }

  return (
    <form action={submitWithUploads} className="max-w-2xl space-y-6">
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
            PDF, JPG, ZIP, and other course files. Maximum{" "}
            {formatMaxSize(FILE_MAX_BYTES)}. Large files upload in small pieces so
            the site stays up.
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
        <p className="mt-1 text-sm text-muted">
          JPEG, PNG, WebP, or GIF. Maximum {formatMaxSize(COVER_MAX_BYTES)}.
        </p>
        {product?.coverPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/media/cover/${product.id}`}
            alt=""
            className="mt-3 h-28 w-28 object-cover"
          />
        ) : null}
      </label>

      {clientError || state?.error ? (
        <p className="text-sm text-red-700">{clientError ?? state?.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="bg-foreground px-6 py-3 text-sm tracking-wide text-paper hover:bg-gold-dark disabled:opacity-60"
      >
        {uploading ? uploadLabel : pending ? "Saving…" : product ? "Save changes" : "Create product"}
      </button>
    </form>
  );
}
