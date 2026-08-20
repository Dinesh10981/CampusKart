import { getChatGPTUser } from "../../chatgpt-auth";
import { ensureStudentProfile } from "../../../db/profiles";
import { createListingReport, type ReportReason } from "../../../db/trades";

export const dynamic = "force-dynamic";
const reasons = new Set<ReportReason>(["misleading", "prohibited", "spam", "unsafe", "other"]);

export async function POST(request: Request) {
  const identity = await getChatGPTUser();
  if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const profile = await ensureStudentProfile(identity);
    const payload = (await request.json()) as { listingId?: unknown; reason?: unknown; details?: unknown };
    const listingId = Number(payload.listingId);
    if (!Number.isInteger(listingId) || listingId < 1) throw new Error("Invalid listing.");
    if (typeof payload.reason !== "string" || !reasons.has(payload.reason as ReportReason)) throw new Error("Choose a report reason.");
    await createListingReport(listingId, profile.id, payload.reason as ReportReason, typeof payload.details === "string" ? payload.details : "");
    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to submit report." }, { status: 400 });
  }
}
