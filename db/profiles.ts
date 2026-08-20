import { count, eq } from "drizzle-orm";
import type { ChatGPTUser } from "../app/chatgpt-auth";
import { getDb } from ".";
import { listings, users, wishlists } from "./schema";

export type StudentProfile = typeof users.$inferSelect;

export async function ensureStudentProfile(identity: ChatGPTUser) {
  const db = await getDb();
  const normalizedEmail = identity.email.trim().toLowerCase();
  const displayName = identity.fullName?.trim() || identity.displayName || normalizedEmail;
  const { env } = await import("cloudflare:workers");
  const configuredAdmins = String(env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const isConfiguredAdmin = configuredAdmins.includes(normalizedEmail);

  await db
    .insert(users)
    .values({ id: crypto.randomUUID(), email: normalizedEmail, displayName, role: isConfiguredAdmin ? "admin" : "student" })
    .onConflictDoUpdate({
      target: users.email,
      set: { displayName, ...(isConfiguredAdmin ? { role: "admin" as const } : {}), updatedAt: new Date().toISOString() },
    });

  const [profile] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
  if (!profile) throw new Error("Unable to create the student profile.");
  return profile;
}

export async function updateStudentProfile(
  email: string,
  details: { department: string | null; yearOfStudy: number | null },
) {
  const db = await getDb();
  const [profile] = await db
    .update(users)
    .set({ ...details, updatedAt: new Date().toISOString() })
    .where(eq(users.email, email.trim().toLowerCase()))
    .returning();
  return profile ?? null;
}

export async function getStudentStats(userId: string) {
  const db = await getDb();
  const [listingTotal] = await db.select({ value: count() }).from(listings).where(eq(listings.sellerId, userId));
  const [wishlistTotal] = await db.select({ value: count() }).from(wishlists).where(eq(wishlists.userId, userId));
  return { listings: listingTotal?.value ?? 0, wishlist: wishlistTotal?.value ?? 0 };
}
