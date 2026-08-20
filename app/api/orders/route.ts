import { getChatGPTUser } from "../../chatgpt-auth";
import { ensureStudentProfile } from "../../../db/profiles";
import { createBuyNowOrder, getOrdersForUser } from "../../../db/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getChatGPTUser();
  if (!identity) return Response.json({error:"Authentication required"},{status:401});
  const profile = await ensureStudentProfile(identity);
  return Response.json({orders:await getOrdersForUser(profile.id)});
}

export async function POST(request:Request) {
  const identity = await getChatGPTUser();
  if (!identity) return Response.json({error:"Authentication required"},{status:401});
  try {
    const profile = await ensureStudentProfile(identity);
    const payload = (await request.json()) as {listingId?:unknown};
    const listingId = Number(payload.listingId);
    if (!Number.isInteger(listingId)||listingId<1) throw new Error("Invalid listing.");
    const order = await createBuyNowOrder(listingId,profile.id);
    return Response.json({order},{status:201});
  } catch (error) {
    return Response.json({error:error instanceof Error?error.message:"Unable to place order."},{status:400});
  }
}
