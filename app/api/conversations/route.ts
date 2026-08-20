import { getChatGPTUser } from "../../chatgpt-auth";
import { getOrCreateConversation } from "../../../db/chat";
import { ensureStudentProfile } from "../../../db/profiles";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const identity = await getChatGPTUser();
  if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const payload = (await request.json()) as { listingId?: unknown };
    const listingId = Number(payload.listingId);
    if (!Number.isInteger(listingId) || listingId < 1) throw new Error("Invalid listing.");
    const profile = await ensureStudentProfile(identity);
    const conversation = await getOrCreateConversation(listingId, profile.id);
    return Response.json({ conversation });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to start conversation." }, { status: 400 });
  }
}
