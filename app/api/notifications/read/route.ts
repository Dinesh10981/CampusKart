import { getChatGPTUser } from "../../../chatgpt-auth";
import { markAllActivityRead } from "../../../../db/activity";
import { ensureStudentProfile } from "../../../../db/profiles";

export const dynamic = "force-dynamic";

export async function POST() {
  const identity = await getChatGPTUser();
  if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });
  const profile = await ensureStudentProfile(identity);
  const updated = await markAllActivityRead(profile.id);
  return Response.json({ updated });
}
