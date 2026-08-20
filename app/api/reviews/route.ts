import { getChatGPTUser } from "../../chatgpt-auth";
import { ensureStudentProfile } from "../../../db/profiles";
import { createReview } from "../../../db/trades";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const identity = await getChatGPTUser();
  if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const profile = await ensureStudentProfile(identity);
    const payload = (await request.json()) as { handoffId?: unknown; rating?: unknown; comment?: unknown };
    const handoffId = Number(payload.handoffId);
    if (!Number.isInteger(handoffId) || handoffId < 1) throw new Error("Invalid handoff.");
    await createReview(handoffId, profile.id, Number(payload.rating), typeof payload.comment === "string" ? payload.comment : "");
    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save review." }, { status: 400 });
  }
}
