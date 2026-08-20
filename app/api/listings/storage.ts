export async function uploadListingImage(file: File) {
  const { env } = await import("cloudflare:workers");
  if (!env.BUCKET) throw new Error("Product image storage is unavailable.");
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const key = `listings/${crypto.randomUUID()}.${extension}`;
  await env.BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
  });
  return { key, contentType: file.type };
}

export async function deleteListingImage(key: string | null) {
  if (!key) return;
  const { env } = await import("cloudflare:workers");
  if (env.BUCKET) await env.BUCKET.delete(key);
}
