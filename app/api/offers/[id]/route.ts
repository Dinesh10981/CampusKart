import { getChatGPTUser } from "../../../chatgpt-auth";
import { actOnOffer } from "../../../../db/chat";
import { ensureStudentProfile } from "../../../../db/profiles";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const identity = await getChatGPTUser();
  if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const profile = await ensureStudentProfile(identity);
    const { id: rawId } = await context.params;
    const offerId = Number(rawId);
    if (!Number.isInteger(offerId) || offerId < 1) throw new Error("Invalid offer.");
    const payload = (await request.json()) as { action?: unknown; amount?: unknown };
    const action = payload.action;
    if (action !== "accept" && action !== "reject" && action !== "withdraw" && action !== "counter") throw new Error("Invalid offer action.");
    await actOnOffer(offerId, profile.id, action, Number(payload.amount));
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update offer." }, { status: 400 });
  }
}
