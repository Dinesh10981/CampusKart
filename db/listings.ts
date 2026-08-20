import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from ".";
import { conversations, handoffs, listings, messages, orders, reports, reviews, users, wishlists } from "./schema";

export type ListingStatus = "draft" | "active" | "reserved" | "sold";
export type ListingInput = {
  title: string;
  description: string;
  category: string;
  price: number;
  originalPrice: number | null;
  condition: string;
  pickupLocation: string;
  status: ListingStatus;
  imageKey?: string | null;
  imageContentType?: string | null;
};

export async function getPublicListings() {
  const db = await getDb();
  return db
    .select({
      id: listings.id,
      title: listings.title,
      description: listings.description,
      category: listings.category,
      price: listings.price,
      originalPrice: listings.originalPrice,
      condition: listings.condition,
      pickupLocation: listings.pickupLocation,
      imageKey: listings.imageKey,
      imageContentType: listings.imageContentType,
      status: listings.status,
      createdAt: listings.createdAt,
      sellerName: users.displayName,
      sellerVerified: users.verificationStatus,
    })
    .from(listings)
    .innerJoin(users, eq(listings.sellerId, users.id))
    .where(eq(listings.status, "active"))
    .orderBy(desc(listings.createdAt), desc(listings.id))
    .limit(30);
}

export async function getListingDetails(id: number) {
  const db = await getDb();
  const [listing] = await db
    .select({
      id: listings.id, title: listings.title, description: listings.description,
      category: listings.category, price: listings.price, originalPrice: listings.originalPrice,
      condition: listings.condition, pickupLocation: listings.pickupLocation,
      imageKey: listings.imageKey, status: listings.status, createdAt: listings.createdAt,
      sellerId: listings.sellerId,
      sellerName: users.displayName, sellerVerified: users.verificationStatus,
      sellerDepartment: users.department,
    })
    .from(listings)
    .innerJoin(users, eq(listings.sellerId, users.id))
    .where(eq(listings.id, id))
    .limit(1);
  return listing ?? null;
}

export async function getListingsForSeller(sellerId: string) {
  const db = await getDb();
  return db.select().from(listings).where(eq(listings.sellerId, sellerId)).orderBy(desc(listings.createdAt), desc(listings.id));
}

export async function getOwnedListing(id: number, sellerId: string) {
  const db = await getDb();
  const [listing] = await db.select().from(listings).where(and(eq(listings.id, id), eq(listings.sellerId, sellerId))).limit(1);
  return listing ?? null;
}

export async function createListing(sellerId: string, input: ListingInput) {
  const db = await getDb();
  const [listing] = await db.insert(listings).values({ sellerId, ...input }).returning();
  return listing;
}

export async function updateOwnedListing(id: number, sellerId: string, input: ListingInput) {
  const db = await getDb();
  const [listing] = await db
    .update(listings)
    .set({ ...input, updatedAt: new Date().toISOString() })
    .where(and(eq(listings.id, id), eq(listings.sellerId, sellerId)))
    .returning();
  return listing ?? null;
}

export async function deleteOwnedListing(id: number, sellerId: string) {
  const db = await getDb();
  const owned = await getOwnedListing(id, sellerId);
  if (!owned) return null;
  const relatedConversations = await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.listingId, id));
  if (relatedConversations.length) {
    const relatedHandoffs = await db.select({ id: handoffs.id }).from(handoffs).where(inArray(handoffs.conversationId, relatedConversations.map((row) => row.id)));
    if (relatedHandoffs.length) {
      await db.delete(reviews).where(inArray(reviews.handoffId, relatedHandoffs.map((row) => row.id)));
      await db.delete(handoffs).where(inArray(handoffs.id, relatedHandoffs.map((row) => row.id)));
    }
    await db.delete(orders).where(inArray(orders.conversationId, relatedConversations.map((row) => row.id)));
    await db.delete(messages).where(inArray(messages.conversationId, relatedConversations.map((row) => row.id)));
    await db.delete(conversations).where(eq(conversations.listingId, id));
  }
  await db.delete(reports).where(eq(reports.listingId, id));
  await db.delete(wishlists).where(eq(wishlists.listingId, id));
  const [listing] = await db
    .delete(listings)
    .where(and(eq(listings.id, id), eq(listings.sellerId, sellerId)))
    .returning();
  return listing ?? null;
}
