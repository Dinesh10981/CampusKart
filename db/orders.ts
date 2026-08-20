import { and, desc, eq, or } from "drizzle-orm";
import { getDb } from ".";
import { getConversationForUser, getOrCreateConversation } from "./chat";
import { conversations, listings, messages, orders, users } from "./schema";

function newOrderNumber() {
  const date = new Date().toISOString().slice(2,10).replaceAll("-","");
  return `CK-${date}-${crypto.randomUUID().slice(0,6).toUpperCase()}`;
}

export async function createBuyNowOrder(listingId:number,buyerId:string) {
  const db = await getDb();
  const conversation = await getOrCreateConversation(listingId,buyerId);
  const [listing] = await db.select().from(listings).where(eq(listings.id,listingId)).limit(1);
  if (!listing || listing.status !== "active") throw new Error("This item is not available to order.");
  const [existing] = await db.select().from(orders).where(eq(orders.conversationId,conversation.id)).limit(1);
  if (existing && existing.status !== "cancelled") return existing;
  if (existing) {
    const [order] = await db.update(orders).set({ orderNumber:newOrderNumber(),amount:listing.price,source:"buy_now",status:"pending",updatedAt:new Date().toISOString() }).where(eq(orders.id,existing.id)).returning();
    await addOrderMessage(db,conversation.id,buyerId,"A new Buy Now order was placed. Waiting for seller confirmation.");
    return order;
  }
  const [order] = await db.insert(orders).values({ orderNumber:newOrderNumber(),listingId,buyerId,sellerId:listing.sellerId,conversationId:conversation.id,amount:listing.price,source:"buy_now",status:"pending" }).returning();
  await addOrderMessage(db,conversation.id,buyerId,"A Buy Now order was placed. Waiting for seller confirmation.");
  return order;
}

export async function createOfferOrder(conversationId:number,amount:number) {
  const db = await getDb();
  const [conversation] = await db.select().from(conversations).where(eq(conversations.id,conversationId)).limit(1);
  if (!conversation) throw new Error("Conversation not found.");
  const [existing] = await db.select().from(orders).where(eq(orders.conversationId,conversationId)).limit(1);
  if (existing) {
    const [order] = await db.update(orders).set({ amount,source:"offer",status:"confirmed",updatedAt:new Date().toISOString() }).where(eq(orders.id,existing.id)).returning();
    return order;
  }
  const [order] = await db.insert(orders).values({ orderNumber:newOrderNumber(),listingId:conversation.listingId,conversationId,buyerId:conversation.buyerId,sellerId:conversation.sellerId,amount,source:"offer",status:"confirmed" }).returning();
  return order;
}

export async function getOrdersForUser(userId:string) {
  const db = await getDb();
  const rows = await db
    .select({ id:orders.id,orderNumber:orders.orderNumber,listingId:orders.listingId,conversationId:orders.conversationId,buyerId:orders.buyerId,sellerId:orders.sellerId,amount:orders.amount,source:orders.source,status:orders.status,createdAt:orders.createdAt,updatedAt:orders.updatedAt,title:listings.title,imageKey:listings.imageKey,pickupLocation:listings.pickupLocation })
    .from(orders)
    .innerJoin(listings,eq(orders.listingId,listings.id))
    .where(or(eq(orders.buyerId,userId),eq(orders.sellerId,userId)))
    .orderBy(desc(orders.updatedAt),desc(orders.id));
  return Promise.all(rows.map(async (order) => {
    const otherId = order.buyerId === userId ? order.sellerId : order.buyerId;
    const [other] = await db.select({ displayName:users.displayName }).from(users).where(eq(users.id,otherId)).limit(1);
    return {...order,isBuyer:order.buyerId===userId,otherName:other?.displayName || "CampusKart student"};
  }));
}

export async function updateOrder(orderId:number,userId:string,action:"confirm"|"cancel") {
  const db = await getDb();
  const [order] = await db.select().from(orders).where(and(eq(orders.id,orderId),or(eq(orders.buyerId,userId),eq(orders.sellerId,userId)))).limit(1);
  if (!order) throw new Error("Order not found.");
  const now = new Date().toISOString();
  if (action === "confirm") {
    if (order.sellerId !== userId) throw new Error("Only the seller can confirm this order.");
    if (order.status !== "pending") throw new Error("This order can no longer be confirmed.");
    await db.update(orders).set({status:"confirmed",updatedAt:now}).where(eq(orders.id,orderId));
    await db.update(listings).set({status:"reserved",updatedAt:now}).where(eq(listings.id,order.listingId));
    await addOrderMessage(db,order.conversationId,userId,"Order confirmed by the seller. You can now schedule the campus handoff.");
    return;
  }
  if (order.status === "completed" || order.status === "cancelled") throw new Error("This order can no longer be cancelled.");
  await db.update(orders).set({status:"cancelled",updatedAt:now}).where(eq(orders.id,orderId));
  await db.update(listings).set({status:"active",updatedAt:now}).where(eq(listings.id,order.listingId));
  await addOrderMessage(db,order.conversationId,userId,"Order cancelled. The listing is active again.");
}

export async function getOrderForConversation(conversationId:number,userId:string) {
  const db = await getDb();
  const conversation = await getConversationForUser(conversationId,userId);
  if (!conversation) return null;
  const [order] = await db.select().from(orders).where(eq(orders.conversationId,conversationId)).limit(1);
  return order ?? null;
}

export async function syncOrderForHandoff(conversationId:number,status:"meetup_scheduled"|"completed"|"cancelled") {
  const db = await getDb();
  await db.update(orders).set({status,updatedAt:new Date().toISOString()}).where(eq(orders.conversationId,conversationId));
}

async function addOrderMessage(db:Awaited<ReturnType<typeof getDb>>,conversationId:number,senderId:string,body:string){await db.insert(messages).values({conversationId,senderId,body,kind:"system"});await db.update(conversations).set({updatedAt:new Date().toISOString()}).where(eq(conversations.id,conversationId));}
