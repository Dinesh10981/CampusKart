import type { ListingInput, ListingStatus } from "../../../db/listings";

const categories = new Set(["Books", "Electronics", "Cycles", "Essentials", "Other"]);
const conditions = new Set(["Like new", "Good", "Fair"]);
const statuses = new Set<ListingStatus>(["draft", "active", "reserved", "sold"]);

export function parseListingInput(form: FormData): ListingInput {
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const category = String(form.get("category") ?? "").trim();
  const condition = String(form.get("condition") ?? "").trim();
  const pickupLocation = String(form.get("pickupLocation") ?? "").trim();
  const status = String(form.get("status") ?? "active") as ListingStatus;
  const price = Number(form.get("price"));
  const originalRaw = String(form.get("originalPrice") ?? "").trim();
  const originalPrice = originalRaw ? Number(originalRaw) : null;

  if (title.length < 4 || title.length > 100) throw new Error("Title must contain 4–100 characters.");
  if (description.length < 10 || description.length > 1200) throw new Error("Description must contain 10–1200 characters.");
  if (!categories.has(category)) throw new Error("Select a valid category.");
  if (!conditions.has(condition)) throw new Error("Select a valid condition.");
  if (pickupLocation.length < 3 || pickupLocation.length > 100) throw new Error("Enter a valid pickup location.");
  if (!Number.isInteger(price) || price < 1 || price > 1000000) throw new Error("Enter a valid selling price.");
  if (originalPrice !== null && (!Number.isInteger(originalPrice) || originalPrice < price || originalPrice > 1000000)) throw new Error("Original price must be at least the selling price.");
  if (!statuses.has(status)) throw new Error("Select a valid listing status.");

  return { title, description, category, condition, pickupLocation, status, price, originalPrice };
}

export function parseImage(form: FormData, required: boolean) {
  const value = form.get("image");
  if (!(value instanceof File) || value.size === 0) {
    if (required) throw new Error("Add a product photo.");
    return null;
  }
  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowed.has(value.type)) throw new Error("Use a JPG, PNG or WebP image.");
  if (value.size > 5 * 1024 * 1024) throw new Error("Image must be 5 MB or smaller.");
  return value;
}
