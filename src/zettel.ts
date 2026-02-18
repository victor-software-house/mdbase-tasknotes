/**
 * Generate a zettelkasten-style timestamp prefix for task filenames.
 * Format: YYYYMMDDHHmm (e.g., 202602181430)
 */
export function zettelPrefix(date?: Date): string {
  const d = date ?? new Date();
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const HH = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}${MM}${dd}${HH}${mm}`;
}

/**
 * Slugify a title for use in filenames.
 * Lowercase, replace spaces with hyphens, remove non-alphanumeric chars.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/**
 * Generate a zettel filename from a title.
 * Format: 202602181430-buy-groceries.md
 */
export function zettelFilename(title: string, date?: Date): string {
  const prefix = zettelPrefix(date);
  const slug = slugify(title);
  return slug ? `${prefix}-${slug}.md` : `${prefix}.md`;
}
