import { getChatGPTUser } from "../../../../chatgpt-auth";
import { ensureStudentProfile } from "../../../../../db/profiles";
import { moderateReport } from "../../../../../db/trades";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const identity = await getChatGPTUser();
  if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const profile = await ensureStudentProfile(identity);
    if (profile.role !== "admin") return Response.json({ error: "Admin access required" }, { status: 403 });
    const { id: rawId } = await context.params;
    const reportId = Number(rawId);
    const payload = (await request.json()) as { status?: unknown; hideListing?: unknown };
    if (!Number.isInteger(reportId) || reportId < 1) throw new Error("Invalid report.");
    if (payload.status !== "resolved" && payload.status !== "dismissed") throw new Error("Invalid moderation action.");
    await moderateReport(reportId, payload.status, payload.hideListing === true);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update report." }, { status: 400 });
  }
}
