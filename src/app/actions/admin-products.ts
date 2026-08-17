"use server";

import { ProductType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guard";
import { rupeesToPaise } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { isDigitalType } from "@/lib/products";
import { access } from "fs/promises";
import { uniqueSlug } from "@/lib/slug";
import { isBlobUrl, isStoredUpload, removeStoredUpload } from "@/lib/storage";
import { absoluteUploadPath } from "@/lib/uploads";

const productSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  slug: z.string().trim().optional(),
  description: z.string().trim().min(1, "Description is required."),
  type: z.enum(ProductType),
  priceRupees: z.string().min(1, "Price is required."),
  isListed: z.boolean(),
  stockQty: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
});

export type ProductFormState = { error?: string } | null;

function listedValue(type: ProductType, requested: boolean) {
  if (!isDigitalType(type)) return false;
  return requested;
}

async function parseProductForm(formData: FormData) {
  const parsed = productSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description"),
    type: formData.get("type"),
    priceRupees: formData.get("priceRupees"),
    isListed: formData.get("isListed") === "on",
    stockQty: formData.get("stockQty") || 0,
    lowStockThreshold: formData.get("lowStockThreshold") || 5,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Check the form.");
  }

  const priceInPaise = rupeesToPaise(parsed.data.priceRupees);
  const isDigital = isDigitalType(parsed.data.type);
  return {
    ...parsed.data,
    priceInPaise,
    isDigital,
    isListed: listedValue(parsed.data.type, parsed.data.isListed),
    stockQty: isDigital ? 0 : parsed.data.stockQty,
  };
}

function readUploadedPath(formData: FormData, field: string, kind: "covers" | "files") {
  const value = String(formData.get(field) ?? "").trim();
  if (!value) return null;
  if (!isStoredUpload(value, kind)) {
    throw new Error("Invalid upload.");
  }
  return value;
}

async function requireUploadedPath(formData: FormData, field: string, kind: "covers" | "files") {
  const relative = readUploadedPath(formData, field, kind);
  if (!relative) return null;
  if (isBlobUrl(relative)) return relative;
  try {
    await access(absoluteUploadPath(relative));
  } catch {
    throw new Error("Uploaded file is missing. Try again.");
  }
  return relative;
}

function readUploadedFileName(formData: FormData) {
  const value = String(formData.get("uploadedFileName") ?? "")
    .replace(/[\r\n]/g, "")
    .trim();
  return value.slice(0, 180) || null;
}

export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  try {
    const data = await parseProductForm(formData);
    const coverPath = await requireUploadedPath(formData, "uploadedCover", "covers");
    const filePath = data.isDigital
      ? await requireUploadedPath(formData, "uploadedFile", "files")
      : null;
    const fileName = filePath ? readUploadedFileName(formData) : null;

    const slug = await uniqueSlug(data.slug || data.title, async (candidate) => {
      const found = await prisma.product.findUnique({ where: { slug: candidate } });
      return Boolean(found);
    });

    await prisma.product.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        type: data.type,
        priceInPaise: data.priceInPaise,
        isListed: data.isListed,
        isDigital: data.isDigital,
        stockQty: data.stockQty,
        lowStockThreshold: data.lowStockThreshold,
        coverPath,
        filePath,
        fileName,
      },
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save product." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/catalog");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function updateProductAction(
  productId: string,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();
  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) return { error: "Product not found." };

  try {
    const data = await parseProductForm(formData);
    const coverPath = await requireUploadedPath(formData, "uploadedCover", "covers");
    const filePath = data.isDigital
      ? await requireUploadedPath(formData, "uploadedFile", "files")
      : null;
    const fileName = filePath ? readUploadedFileName(formData) : null;

    const requestedSlug = (data.slug || data.title).trim();
    let slug = existing.slug;
    if (requestedSlug && requestedSlug !== existing.slug) {
      slug = await uniqueSlug(requestedSlug, async (candidate) => {
        const found = await prisma.product.findUnique({ where: { slug: candidate } });
        return Boolean(found && found.id !== productId);
      });
    }

    await prisma.product.update({
      where: { id: productId },
      data: {
        title: data.title,
        slug,
        description: data.description,
        type: data.type,
        priceInPaise: data.priceInPaise,
        isListed: data.isListed,
        isDigital: data.isDigital,
        stockQty: data.stockQty,
        lowStockThreshold: data.lowStockThreshold,
        coverPath: coverPath ?? existing.coverPath,
        filePath: data.isDigital ? (filePath ?? existing.filePath) : null,
        fileName: data.isDigital ? (fileName ?? existing.fileName) : null,
      },
    });

    if (coverPath && existing.coverPath) await removeStoredUpload(existing.coverPath);
    if (filePath && existing.filePath) await removeStoredUpload(existing.filePath);
    if (!data.isDigital && existing.filePath) await removeStoredUpload(existing.filePath);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update product." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/catalog");
  revalidatePath("/");
  revalidatePath(`/admin/products/${productId}`);
  redirect("/admin/products");
}

export async function archiveProductAction(productId: string) {
  await requireAdmin();
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return;
  await prisma.product.update({
    where: { id: productId },
    data: {
      archivedAt: product.archivedAt ? null : new Date(),
      isListed: product.archivedAt ? product.isListed : false,
    },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/catalog");
  revalidatePath("/");
}
