import { getChatGPTUser } from "../../../../chatgpt-auth";
import { ensureStudentProfile } from "../../../../../db/profiles";
import { getHandoffForConversation, proposeHandoff, updateHandoff } from "../../../../../db/trades";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

async function participant(context: RouteContext) {
  const identity = await getChatGPTUser();
  if (!identity) return { error: Response.json({ error: "Authentication required" }, { status: 401 }) };
  const profile = await ensureStudentProfile(identity);
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) return { error: Response.json({ error: "Invalid conversation." }, { status: 400 }) };
  return { id, profile };
}

export async function GET(_request: Request, context: RouteContext) {
  const current = await participant(context);
  if ("error" in current) return current.error;
  const result = await getHandoffForConversation(current.id, current.profile.id);
  if (!result) return Response.json({ error: "Conversation not found." }, { status: 404 });
  return Response.json({ handoff: result.handoff, review: result.review, listingStatus: result.conversation.listing.status });
}

export async function POST(request: Request, context: RouteContext) {
  const current = await participant(context);
  if ("error" in current) return current.error;
  try {
    const payload = (await request.json()) as { location?: unknown; meetupAt?: unknown };
    await proposeHandoff(current.id, current.profile.id, typeof payload.location === "string" ? payload.location : "", typeof payload.meetupAt === "string" ? payload.meetupAt : "");
    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to schedule handoff." }, { status: 400 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const current = await participant(context);
  if ("error" in current) return current.error;
  try {
    const payload = (await request.json()) as { action?: unknown };
    if (payload.action !== "accept" && payload.action !== "cancel" && payload.action !== "complete") throw new Error("Invalid handoff action.");
    await updateHandoff(current.id, current.profile.id, payload.action);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update handoff." }, { status: 400 });
  }
}
