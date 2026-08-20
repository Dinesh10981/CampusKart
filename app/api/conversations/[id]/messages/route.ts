import { getChatGPTUser } from "../../../../chatgpt-auth";
import { getMessagesForConversation, sendConversationMessage, sendOffer } from "../../../../../db/chat";
import { ensureStudentProfile } from "../../../../../db/profiles";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

async function getParticipant(context: RouteContext) {
  const identity = await getChatGPTUser();
  if (!identity) return { error: Response.json({ error: "Authentication required" }, { status: 401 }) };
  const profile = await ensureStudentProfile(identity);
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) return { error: Response.json({ error: "Invalid conversation." }, { status: 400 }) };
  return { id, profile };
}

export async function GET(_request: Request, context: RouteContext) {
  const participant = await getParticipant(context);
  if ("error" in participant) return participant.error;
  const result = await getMessagesForConversation(participant.id, participant.profile.id);
  if (!result) return Response.json({ error: "Conversation not found." }, { status: 404 });
  return Response.json({ messages: result.messages });
}

export async function POST(request: Request, context: RouteContext) {
  const participant = await getParticipant(context);
  if ("error" in participant) return participant.error;
  try {
    const payload = (await request.json()) as { type?: unknown; body?: unknown; amount?: unknown };
    const message = payload.type === "offer"
      ? await sendOffer(participant.id, participant.profile.id, Number(payload.amount))
      : await sendConversationMessage(participant.id, participant.profile.id, typeof payload.body === "string" ? payload.body : "");
    return Response.json({ message }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to send." }, { status: 400 });
  }
}
