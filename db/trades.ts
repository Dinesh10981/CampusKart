import { and, avg, desc, eq } from "drizzle-orm";
import { getDb } from ".";
import { getConversationForUser } from "./chat";
import { conversations, handoffs, listings, messages, reports, reviews, users } from "./schema";
import { syncOrderForHandoff } from "./orders";

export type ReportReason = "misleading" | "prohibited" | "spam" | "unsafe" | "other";

export async function getHandoffForConversation(conversationId: number, userId: string) {
  const db = await getDb();
  const conversation = await getConversationForUser(conversationId, userId);
  if (!conversation) return null;
  const [handoff] = await db.select().from(handoffs).where(eq(handoffs.conversationId, conversationId)).limit(1);
  if (!handoff) return { conversation, handoff: null, review: null };
  const [review] = await db.select().from(reviews).where(and(eq(reviews.handoffId, handoff.id), eq(reviews.reviewerId, userId))).limit(1);
  return { conversation, handoff, review: review ?? null };
}

export async function proposeHandoff(conversationId: number, userId: string, location: string, meetupAt: string) {
  const db = await getDb();
  const result = await getHandoffForConversation(conversationId, userId);
  if (!result) throw new Error("Conversation not found.");
  if (result.conversation.listing.status !== "reserved") throw new Error("Accept an offer before scheduling the handoff.");
  const cleanLocation = location.trim();
  const meetupDate = new Date(meetupAt);
  if (cleanLocation.length < 3 || cleanLocation.length > 120) throw new Error("Enter a valid campus meetup point.");
  if (Number.isNaN(meetupDate.getTime()) || meetupDate.getTime() < Date.now() - 60_000) throw new Error("Choose a future meetup time.");
  if (result.handoff && result.handoff.status !== "cancelled") throw new Error("A handoff is already active for this conversation.");

  const values = { proposedBy: userId, location: cleanLocation, meetupAt: meetupDate.toISOString(), status: "proposed" as const, buyerCompletedAt: null, sellerCompletedAt: null, updatedAt: new Date().toISOString() };
  if (result.handoff) {
    await db.update(handoffs).set(values).where(eq(handoffs.id, result.handoff.id));
  } else {
    await db.insert(handoffs).values({ conversationId, ...values });
  }
  await addSystemMessage(db, conversationId, userId, `Meetup proposed at ${cleanLocation}.`);
}

export async function updateHandoff(conversationId: number, userId: string, action: "accept" | "cancel" | "complete") {
  const db = await getDb();
  const result = await getHandoffForConversation(conversationId, userId);
  if (!result?.handoff) throw new Error("Handoff not found.");
  const { handoff, conversation } = result;
  const now = new Date().toISOString();

  if (action === "accept") {
    if (handoff.status !== "proposed") throw new Error("This handoff can no longer be accepted.");
    if (handoff.proposedBy === userId) throw new Error("The other student must confirm the meetup.");
    await db.update(handoffs).set({ status: "confirmed", updatedAt: now }).where(eq(handoffs.id, handoff.id));
    await syncOrderForHandoff(conversationId,"meetup_scheduled");
    await addSystemMessage(db, conversationId, userId, "Campus meetup confirmed.");
    return;
  }

  if (action === "cancel") {
    if (handoff.status === "completed" || handoff.status === "cancelled") throw new Error("This handoff can no longer be cancelled.");
    await db.update(handoffs).set({ status: "cancelled", updatedAt: now }).where(eq(handoffs.id, handoff.id));
    await db.update(listings).set({ status: "active", updatedAt: now }).where(eq(listings.id, conversation.listingId));
    await syncOrderForHandoff(conversationId,"cancelled");
    await addSystemMessage(db, conversationId, userId, "Meetup cancelled. The listing is active again.");
    return;
  }

  if (handoff.status !== "confirmed") throw new Error("Confirm the meetup before completing the exchange.");
  const completion = conversation.isBuyer ? { buyerCompletedAt: now } : { sellerCompletedAt: now };
  await db.update(handoffs).set({ ...completion, updatedAt: now }).where(eq(handoffs.id, handoff.id));
  const [updated] = await db.select().from(handoffs).where(eq(handoffs.id, handoff.id)).limit(1);
  if (updated?.buyerCompletedAt && updated.sellerCompletedAt) {
    await db.update(handoffs).set({ status: "completed", updatedAt: now }).where(eq(handoffs.id, handoff.id));
    await db.update(listings).set({ status: "sold", updatedAt: now }).where(eq(listings.id, conversation.listingId));
    await syncOrderForHandoff(conversationId,"completed");
    await addSystemMessage(db, conversationId, userId, "Exchange completed by both students. The item is marked sold.");
  }
}

export async function createReview(handoffId: number, userId: string, rating: number, comment: string) {
  const db = await getDb();
  const [handoff] = await db.select().from(handoffs).where(eq(handoffs.id, handoffId)).limit(1);
  if (!handoff || handoff.status !== "completed") throw new Error("Complete the exchange before leaving a review.");
  const conversation = await getConversationForUser(handoff.conversationId, userId);
  if (!conversation) throw new Error("Handoff not found.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("Choose a rating from 1 to 5.");
  const cleanComment = comment.trim();
  if (cleanComment.length > 500) throw new Error("Review must be 500 characters or fewer.");
  const revieweeId = conversation.buyerId === userId ? conversation.sellerId : conversation.buyerId;
  await db.insert(reviews).values({ handoffId, reviewerId: userId, revieweeId, rating, comment: cleanComment }).onConflictDoNothing();
}

export async function getUserRating(userId: string) {
  const db = await getDb();
  const [summary] = await db.select({ average: avg(reviews.rating) }).from(reviews).where(eq(reviews.revieweeId, userId));
  const rows = await db.select({ id: reviews.id }).from(reviews).where(eq(reviews.revieweeId, userId));
  return { average: summary?.average ? Number(summary.average) : null, count: rows.length };
}

export async function createListingReport(listingId: number, reporterId: string, reason: ReportReason, details: string) {
  const db = await getDb();
  const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!listing) throw new Error("Listing not found.");
  if (listing.sellerId === reporterId) throw new Error("You cannot report your own listing.");
  const cleanDetails = details.trim();
  if (cleanDetails.length > 500) throw new Error("Report details must be 500 characters or fewer.");
  await db.insert(reports).values({ listingId, reporterId, reason, details: cleanDetails }).onConflictDoNothing();
}

export async function getOpenReports() {
  const db = await getDb();
  return db
    .select({ id: reports.id, reason: reports.reason, details: reports.details, status: reports.status, createdAt: reports.createdAt, listingId: listings.id, listingTitle: listings.title, reporterName: users.displayName })
    .from(reports)
    .innerJoin(listings, eq(reports.listingId, listings.id))
    .innerJoin(users, eq(reports.reporterId, users.id))
    .orderBy(desc(reports.createdAt), desc(reports.id));
}

export async function moderateReport(reportId: number, status: "resolved" | "dismissed", hideListing: boolean) {
  const db = await getDb();
  const [report] = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
  if (!report) throw new Error("Report not found.");
  await db.update(reports).set({ status, updatedAt: new Date().toISOString() }).where(eq(reports.id, reportId));
  if (hideListing) await db.update(listings).set({ status: "draft", updatedAt: new Date().toISOString() }).where(eq(listings.id, report.listingId));
}

async function addSystemMessage(db: Awaited<ReturnType<typeof getDb>>, conversationId: number, senderId: string, body: string) {
  await db.insert(messages).values({ conversationId, senderId, body, kind: "system" });
  await db.update(conversations).set({ updatedAt: new Date().toISOString() }).where(eq(conversations.id, conversationId));
}
