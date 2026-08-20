import { getChatGPTUser } from "../../chatgpt-auth";
import { ensureStudentProfile, updateStudentProfile } from "../../../db/profiles";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getChatGPTUser();
  if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });

  const profile = await ensureStudentProfile(identity);
  return Response.json({ profile });
}

export async function PATCH(request: Request) {
  const identity = await getChatGPTUser();
  if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });

  const payload = (await request.json()) as { department?: unknown; yearOfStudy?: unknown };
  const department = typeof payload.department === "string" ? payload.department.trim() : "";
  const yearOfStudy = Number(payload.yearOfStudy);

  if (department.length < 2 || department.length > 80) {
    return Response.json({ error: "Enter a valid department." }, { status: 400 });
  }
  if (!Number.isInteger(yearOfStudy) || yearOfStudy < 1 || yearOfStudy > 5) {
    return Response.json({ error: "Select a valid year of study." }, { status: 400 });
  }

  await ensureStudentProfile(identity);
  const profile = await updateStudentProfile(identity.email, { department, yearOfStudy });
  return Response.json({ profile });
}
