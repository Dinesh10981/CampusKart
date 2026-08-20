import { and, desc, eq, inArray, isNull, ne, or } from "drizzle-orm";
import { getDb } from ".";
import { conversations, listings, messages, users } from "./schema";

export async function getActivityFeed(userId: string) {
  const db = await getDb();
  return db
    .select({
      id: messages.id,
      conversationId: messages.conversationId,
      body: messages.body,
      kind: messages.kind,
      offerAmount: messages.offerAmount,
      offerStatus: messages.offerStatus,
      createdAt: messages.createdAt,
      readAt: messages.readAt,
      senderName: users.displayName,
      listingTitle: listings.title,
    })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .innerJoin(listings, eq(conversations.listingId, listings.id))
    .innerJoin(users, eq(messages.senderId, users.id))
    .where(and(or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId)), ne(messages.senderId, userId)))
    .orderBy(desc(messages.createdAt), desc(messages.id))
    .limit(50);
}

export async function markAllActivityRead(userId: string) {
  const db = await getDb();
  const rows = await db.select({ id: conversations.id }).from(conversations)
    .where(or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId)));
  if (!rows.length) return 0;
  const result = await db.update(messages).set({ readAt: new Date().toISOString() })
    .where(and(inArray(messages.conversationId, rows.map((row) => row.id)), ne(messages.senderId, userId), isNull(messages.readAt)));
  return result.meta.changes;
}
