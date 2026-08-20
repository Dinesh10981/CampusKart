import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from ".";
import { listings, users, wishlists } from "./schema";

export async function getWishlistIds(userId: string) {
  const db = await getDb();
  const rows = await db.select({ listingId: wishlists.listingId }).from(wishlists).where(eq(wishlists.userId, userId));
  return rows.map((row) => row.listingId);
}

export async function getWishlistListings(userId: string) {
  const db = await getDb();
  const ids = await getWishlistIds(userId);
  if (!ids.length) return [];
  return db
    .select({
      id: listings.id,
      title: listings.title,
      category: listings.category,
      price: listings.price,
      condition: listings.condition,
      pickupLocation: listings.pickupLocation,
      imageKey: listings.imageKey,
      status: listings.status,
      sellerName: users.displayName,
    })
    .from(listings)
    .innerJoin(users, eq(listings.sellerId, users.id))
    .where(inArray(listings.id, ids))
    .orderBy(desc(listings.updatedAt), desc(listings.id));
}

export async function toggleWishlist(userId: string, listingId: number) {
  const db = await getDb();
  const [listing] = await db.select({ id: listings.id, sellerId: listings.sellerId }).from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!listing) throw new Error("Listing not found.");
  if (listing.sellerId === userId) throw new Error("You cannot save your own listing.");
  const [saved] = await db
    .select()
    .from(wishlists)
    .where(and(eq(wishlists.userId, userId), eq(wishlists.listingId, listingId)))
    .limit(1);
  if (saved) {
    await db.delete(wishlists).where(and(eq(wishlists.userId, userId), eq(wishlists.listingId, listingId)));
    return false;
  }
  await db.insert(wishlists).values({ userId, listingId });
  return true;
}
