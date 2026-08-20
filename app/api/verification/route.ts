import { getChatGPTUser } from "../../chatgpt-auth";
import { ensureStudentProfile } from "../../../db/profiles";
import { getVerificationRequest, submitVerificationRequest } from "../../../db/verification";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getChatGPTUser();
  if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });
  const profile = await ensureStudentProfile(identity);
  return Response.json({ request: await getVerificationRequest(profile.id), verificationStatus: profile.verificationStatus });
}

export async function POST(request: Request) {
  const identity = await getChatGPTUser();
  if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const profile = await ensureStudentProfile(identity);
    const payload = (await request.json()) as { collegeEmail?: unknown; studentId?: unknown };
    const verification = await submitVerificationRequest(
      profile.id,
      typeof payload.collegeEmail === "string" ? payload.collegeEmail : "",
      typeof payload.studentId === "string" ? payload.studentId : "",
    );
    return Response.json({ request: verification }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to submit verification." }, { status: 400 });
  }
}
