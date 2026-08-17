export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || "item";
}

export async function uniqueSlug(
  base: string,
  isTaken: (slug: string) => Promise<boolean>,
) {
  let slug = slugify(base);
  let n = 2;
  while (await isTaken(slug)) {
    slug = `${slugify(base)}-${n}`;
    n += 1;
  }
  return slug;
}
