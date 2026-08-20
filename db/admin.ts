import { count, eq } from "drizzle-orm";
import { getDb } from ".";
import { listings, orders, reports, users, verificationRequests } from "./schema";

export async function getAdminStats() {
  const db = await getDb();
  const [[studentTotal], [listingTotal], [orderTotal], [openReportTotal], [pendingVerificationTotal]] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(listings),
    db.select({ value: count() }).from(orders),
    db.select({ value: count() }).from(reports).where(eq(reports.status, "open")),
    db.select({ value: count() }).from(verificationRequests).where(eq(verificationRequests.status, "pending")),
  ]);
  return {
    students: studentTotal?.value ?? 0,
    listings: listingTotal?.value ?? 0,
    orders: orderTotal?.value ?? 0,
    openReports: openReportTotal?.value ?? 0,
    pendingVerifications: pendingVerificationTotal?.value ?? 0,
  };
}
