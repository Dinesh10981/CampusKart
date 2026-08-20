import { getChatGPTUser } from "../../../../chatgpt-auth";
import { ensureStudentProfile } from "../../../../../db/profiles";
import { reviewVerificationRequest } from "../../../../../db/verification";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const identity = await getChatGPTUser();
  if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const profile = await ensureStudentProfile(identity);
    if (profile.role !== "admin") return Response.json({ error: "Admin access required" }, { status: 403 });
    const { id: rawId } = await context.params;
    const requestId = Number(rawId);
    const payload = (await request.json()) as { decision?: unknown; reviewNotes?: unknown };
    if (!Number.isInteger(requestId) || requestId < 1) throw new Error("Invalid verification request.");
    if (payload.decision !== "approved" && payload.decision !== "rejected") throw new Error("Invalid verification decision.");
    await reviewVerificationRequest(requestId, profile.id, payload.decision, typeof payload.reviewNotes === "string" ? payload.reviewNotes : "");
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to review verification." }, { status: 400 });
  }
}
