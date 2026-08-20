import { desc, eq } from "drizzle-orm";
import { getDb } from ".";
import { users, verificationRequests } from "./schema";

export type VerificationDecision = "approved" | "rejected";

export async function getVerificationRequest(userId: string) {
  const db = await getDb();
  const [request] = await db.select().from(verificationRequests).where(eq(verificationRequests.userId, userId)).limit(1);
  return request ?? null;
}

export async function submitVerificationRequest(userId: string, collegeEmail: string, studentId: string) {
  const db = await getDb();
  const normalizedEmail = collegeEmail.trim().toLowerCase();
  const cleanStudentId = studentId.trim().toUpperCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 160) {
    throw new Error("Enter a valid college email address.");
  }
  if (!/^[A-Z0-9][A-Z0-9\-\/]{3,29}$/.test(cleanStudentId)) {
    throw new Error("Enter a valid student or register number.");
  }
  const [profile] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!profile) throw new Error("Student profile not found.");
  if (profile.verificationStatus === "verified") throw new Error("Your campus profile is already verified.");
  const now = new Date().toISOString();
  await db.insert(verificationRequests).values({ userId, collegeEmail: normalizedEmail, studentId: cleanStudentId })
    .onConflictDoUpdate({
      target: verificationRequests.userId,
      set: { collegeEmail: normalizedEmail, studentId: cleanStudentId, status: "pending", reviewNotes: "", reviewedBy: null, reviewedAt: null, submittedAt: now, updatedAt: now },
    });
  await db.update(users).set({ verificationStatus: "pending", updatedAt: now }).where(eq(users.id, userId));
  return getVerificationRequest(userId);
}

export async function getVerificationRequests() {
  const db = await getDb();
  return db.select({
    id: verificationRequests.id,
    userId: verificationRequests.userId,
    collegeEmail: verificationRequests.collegeEmail,
    studentId: verificationRequests.studentId,
    status: verificationRequests.status,
    reviewNotes: verificationRequests.reviewNotes,
    submittedAt: verificationRequests.submittedAt,
    reviewedAt: verificationRequests.reviewedAt,
    studentName: users.displayName,
    accountEmail: users.email,
    college: users.college,
    department: users.department,
    yearOfStudy: users.yearOfStudy,
  }).from(verificationRequests)
    .innerJoin(users, eq(verificationRequests.userId, users.id))
    .orderBy(desc(verificationRequests.submittedAt), desc(verificationRequests.id));
}

export async function reviewVerificationRequest(requestId: number, adminId: string, decision: VerificationDecision, reviewNotes: string) {
  const db = await getDb();
  const [request] = await db.select().from(verificationRequests).where(eq(verificationRequests.id, requestId)).limit(1);
  if (!request) throw new Error("Verification request not found.");
  const notes = reviewNotes.trim();
  if (notes.length > 300) throw new Error("Review notes must be 300 characters or fewer.");
  const now = new Date().toISOString();
  await db.update(verificationRequests).set({ status: decision, reviewNotes: notes, reviewedBy: adminId, reviewedAt: now, updatedAt: now }).where(eq(verificationRequests.id, requestId));
  await db.update(users).set({ verificationStatus: decision === "approved" ? "verified" : "rejected", updatedAt: now }).where(eq(users.id, request.userId));
}
