import { getChatGPTUser } from "../../chatgpt-auth";
import { ensureStudentProfile } from "../../../db/profiles";
import { getWishlistIds, toggleWishlist } from "../../../db/wishlist";

export const dynamic = "force-dynamic";

async function currentProfile() {
  const identity = await getChatGPTUser();
  return identity ? ensureStudentProfile(identity) : null;
}

export async function GET() {
  const profile = await currentProfile();
  if (!profile) return Response.json({ error: "Authentication required" }, { status: 401 });
  return Response.json({ listingIds: await getWishlistIds(profile.id) });
}

export async function POST(request: Request) {
  const profile = await currentProfile();
  if (!profile) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const payload = (await request.json()) as { listingId?: unknown };
    const listingId = Number(payload.listingId);
    if (!Number.isInteger(listingId) || listingId < 1) throw new Error("Invalid listing.");
    const saved = await toggleWishlist(profile.id, listingId);
    return Response.json({ saved });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update wishlist." }, { status: 400 });
  }
}
