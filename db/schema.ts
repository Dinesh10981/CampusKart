import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: text("role", { enum: ["student", "admin"] }).notNull().default("student"),
  verificationStatus: text("verification_status", {
    enum: ["pending", "verified", "rejected"],
  }).notNull().default("pending"),
  college: text("college").notNull().default("Kongu Engineering College"),
  department: text("department"),
  yearOfStudy: integer("year_of_study"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const verificationRequests = sqliteTable(
  "verification_requests",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull().references(() => users.id),
    collegeEmail: text("college_email").notNull(),
    studentId: text("student_id").notNull(),
    status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
    reviewNotes: text("review_notes").notNull().default(""),
    reviewedBy: text("reviewed_by").references(() => users.id),
    submittedAt: text("submitted_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    reviewedAt: text("reviewed_at"),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("verification_requests_user_unique").on(table.userId),
    index("verification_requests_status_idx").on(table.status),
  ],
);

export const listings = sqliteTable(
  "listings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sellerId: text("seller_id").notNull().references(() => users.id),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    category: text("category").notNull(),
    price: integer("price").notNull(),
    originalPrice: integer("original_price"),
    condition: text("condition").notNull(),
    pickupLocation: text("pickup_location").notNull(),
    imageKey: text("image_key"),
    imageContentType: text("image_content_type"),
    status: text("status", { enum: ["draft", "active", "reserved", "sold"] }).notNull().default("active"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("listings_seller_idx").on(table.sellerId), index("listings_status_idx").on(table.status)],
);

export const wishlists = sqliteTable(
  "wishlists",
  {
    userId: text("user_id").notNull().references(() => users.id),
    listingId: integer("listing_id").notNull().references(() => listings.id),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.userId, table.listingId] })],
);

export const conversations = sqliteTable(
  "conversations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    listingId: integer("listing_id").notNull().references(() => listings.id),
    buyerId: text("buyer_id").notNull().references(() => users.id),
    sellerId: text("seller_id").notNull().references(() => users.id),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("conversations_listing_buyer_unique").on(table.listingId, table.buyerId),
    index("conversations_buyer_idx").on(table.buyerId),
    index("conversations_seller_idx").on(table.sellerId),
  ],
);

export const messages = sqliteTable(
  "messages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    conversationId: integer("conversation_id").notNull().references(() => conversations.id),
    senderId: text("sender_id").notNull().references(() => users.id),
    body: text("body").notNull().default(""),
    kind: text("kind", { enum: ["message", "offer", "system"] }).notNull().default("message"),
    offerAmount: integer("offer_amount"),
    offerStatus: text("offer_status", {
      enum: ["pending", "accepted", "rejected", "countered", "withdrawn"],
    }),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    readAt: text("read_at"),
  },
  (table) => [
    index("messages_conversation_idx").on(table.conversationId),
    index("messages_created_idx").on(table.createdAt),
  ],
);

export const handoffs = sqliteTable(
  "handoffs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    conversationId: integer("conversation_id").notNull().references(() => conversations.id),
    proposedBy: text("proposed_by").notNull().references(() => users.id),
    location: text("location").notNull(),
    meetupAt: text("meetup_at").notNull(),
    status: text("status", {
      enum: ["proposed", "confirmed", "completed", "cancelled"],
    }).notNull().default("proposed"),
    buyerCompletedAt: text("buyer_completed_at"),
    sellerCompletedAt: text("seller_completed_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("handoffs_conversation_unique").on(table.conversationId),
    index("handoffs_status_idx").on(table.status),
  ],
);

export const reviews = sqliteTable(
  "reviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    handoffId: integer("handoff_id").notNull().references(() => handoffs.id),
    reviewerId: text("reviewer_id").notNull().references(() => users.id),
    revieweeId: text("reviewee_id").notNull().references(() => users.id),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("reviews_handoff_reviewer_unique").on(table.handoffId, table.reviewerId),
    index("reviews_reviewee_idx").on(table.revieweeId),
  ],
);

export const reports = sqliteTable(
  "reports",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    listingId: integer("listing_id").notNull().references(() => listings.id),
    reporterId: text("reporter_id").notNull().references(() => users.id),
    reason: text("reason", {
      enum: ["misleading", "prohibited", "spam", "unsafe", "other"],
    }).notNull(),
    details: text("details").notNull().default(""),
    status: text("status", { enum: ["open", "resolved", "dismissed"] }).notNull().default("open"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("reports_listing_reporter_unique").on(table.listingId, table.reporterId),
    index("reports_status_idx").on(table.status),
  ],
);

export const orders = sqliteTable(
  "orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderNumber: text("order_number").notNull().unique(),
    listingId: integer("listing_id").notNull().references(() => listings.id),
    conversationId: integer("conversation_id").notNull().references(() => conversations.id),
    buyerId: text("buyer_id").notNull().references(() => users.id),
    sellerId: text("seller_id").notNull().references(() => users.id),
    amount: integer("amount").notNull(),
    source: text("source", { enum: ["buy_now", "offer"] }).notNull(),
    status: text("status", {
      enum: ["pending", "confirmed", "meetup_scheduled", "completed", "cancelled"],
    }).notNull().default("pending"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("orders_conversation_unique").on(table.conversationId),
    index("orders_buyer_idx").on(table.buyerId),
    index("orders_seller_idx").on(table.sellerId),
    index("orders_status_idx").on(table.status),
  ],
);
