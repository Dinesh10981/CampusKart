import { and, asc, desc, eq, isNull, ne, or } from "drizzle-orm";
import { getDb } from ".";
import { conversations, listings, messages, users } from "./schema";

export async function getOrCreateConversation(listingId: number, buyerId: string) {
  const db = await getDb();
  const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!listing) throw new Error("Listing not found.");
  if (listing.sellerId === buyerId) throw new Error("You cannot start a conversation on your own listing.");
  if (listing.status === "sold" || listing.status === "draft") throw new Error("This listing is not available for new conversations.");

  await db.insert(conversations).values({ listingId, buyerId, sellerId: listing.sellerId }).onConflictDoNothing();
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.listingId, listingId), eq(conversations.buyerId, buyerId)))
    .limit(1);
  if (!conversation) throw new Error("Unable to start conversation.");
  return conversation;
}

export async function getConversationForUser(id: number, userId: string) {
  const db = await getDb();
  const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  if (!conversation || (conversation.buyerId !== userId && conversation.sellerId !== userId)) return null;
  const [listing] = await db.select().from(listings).where(eq(listings.id, conversation.listingId)).limit(1);
  if (!listing) return null;
  const otherId = conversation.buyerId === userId ? conversation.sellerId : conversation.buyerId;
  const [otherUser] = await db.select().from(users).where(eq(users.id, otherId)).limit(1);
  return { ...conversation, listing, otherUser, currentUserId: userId, isBuyer: conversation.buyerId === userId };
}

export async function getConversationSummaries(userId: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(conversations)
    .where(or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId)))
    .orderBy(desc(conversations.updatedAt), desc(conversations.id));

  return Promise.all(rows.map(async (conversation) => {
    const [listing] = await db.select().from(listings).where(eq(listings.id, conversation.listingId)).limit(1);
    const otherId = conversation.buyerId === userId ? conversation.sellerId : conversation.buyerId;
    const [otherUser] = await db.select().from(users).where(eq(users.id, otherId)).limit(1);
    const [lastMessage] = await db.select().from(messages).where(eq(messages.conversationId, conversation.id)).orderBy(desc(messages.createdAt), desc(messages.id)).limit(1);
    const unread = await db
      .select({ id: messages.id })
      .from(messages)
      .where(and(eq(messages.conversationId, conversation.id), ne(messages.senderId, userId), isNull(messages.readAt)));
    return { ...conversation, listing, otherUser, lastMessage: lastMessage ?? null, unreadCount: unread.length };
  }));
}

export async function getMessagesForConversation(conversationId: number, userId: string) {
  const db = await getDb();
  const conversation = await getConversationForUser(conversationId, userId);
  if (!conversation) return null;
  await db
    .update(messages)
    .set({ readAt: new Date().toISOString() })
    .where(and(eq(messages.conversationId, conversationId), ne(messages.senderId, userId), isNull(messages.readAt)));
  const rows = await db
    .select({
      id: messages.id, conversationId: messages.conversationId, senderId: messages.senderId,
      senderName: users.displayName, body: messages.body, kind: messages.kind,
      offerAmount: messages.offerAmount, offerStatus: messages.offerStatus,
      createdAt: messages.createdAt, readAt: messages.readAt,
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt), asc(messages.id));
  return { conversation, messages: rows };
}

export async function sendConversationMessage(conversationId: number, userId: string, body: string) {
  const db = await getDb();
  const conversation = await getConversationForUser(conversationId, userId);
  if (!conversation) throw new Error("Conversation not found.");
  const text = body.trim();
  if (text.length < 1 || text.length > 1000) throw new Error("Message must contain 1–1000 characters.");
  const [message] = await db.insert(messages).values({ conversationId, senderId: userId, body: text }).returning();
  await db.update(conversations).set({ updatedAt: new Date().toISOString() }).where(eq(conversations.id, conversationId));
  return message;
}

export async function sendOffer(conversationId: number, userId: string, amount: number) {
  const db = await getDb();
  const conversation = await getConversationForUser(conversationId, userId);
  if (!conversation) throw new Error("Conversation not found.");
  if (!Number.isInteger(amount) || amount < 1 || amount > 1000000) throw new Error("Enter a valid offer amount.");
  if (conversation.listing.status === "sold") throw new Error("This item is already sold.");
  const [message] = await db.insert(messages).values({
    conversationId, senderId: userId, body: "Price offer", kind: "offer", offerAmount: amount, offerStatus: "pending",
  }).returning();
  await db.update(conversations).set({ updatedAt: new Date().toISOString() }).where(eq(conversations.id, conversationId));
  return message;
}

export async function actOnOffer(
  offerId: number,
  userId: string,
  action: "accept" | "reject" | "withdraw" | "counter",
  counterAmount?: number,
) {
  const db = await getDb();
  const [offer] = await db.select().from(messages).where(eq(messages.id, offerId)).limit(1);
  if (!offer || offer.kind !== "offer" || offer.offerStatus !== "pending") throw new Error("This offer is no longer available.");
  const conversation = await getConversationForUser(offer.conversationId, userId);
  if (!conversation) throw new Error("Conversation not found.");
  const isProposer = offer.senderId === userId;
  if (isProposer && action !== "withdraw") throw new Error("Only the recipient can respond to this offer.");
  if (!isProposer && action === "withdraw") throw new Error("Only the proposer can withdraw this offer.");
  if (action === "counter" && (!Number.isInteger(counterAmount) || !counterAmount || counterAmount < 1 || counterAmount > 1000000)) {
    throw new Error("Enter a valid counteroffer.");
  }

  const nextStatus = action === "accept" ? "accepted" : action === "reject" ? "rejected" : action === "withdraw" ? "withdrawn" : "countered";
  await db.update(messages).set({ offerStatus: nextStatus }).where(eq(messages.id, offerId));

  if (action === "accept") {
    await db.update(listings).set({ status: "reserved", updatedAt: new Date().toISOString() }).where(eq(listings.id, conversation.listingId));
    if (offer.offerAmount) {
      const { createOfferOrder } = await import("./orders");
      await createOfferOrder(conversation.id, offer.offerAmount);
    }
  }
  if (action === "counter") {
    await db.insert(messages).values({
      conversationId: conversation.id, senderId: userId, body: "Counteroffer", kind: "offer",
      offerAmount: counterAmount, offerStatus: "pending",
    });
  }
  await db.update(conversations).set({ updatedAt: new Date().toISOString() }).where(eq(conversations.id, conversation.id));
  return { success: true };
}
