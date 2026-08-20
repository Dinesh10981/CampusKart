import { getChatGPTUser } from "../../../chatgpt-auth";
import { ensureStudentProfile } from "../../../../db/profiles";
import { updateOrder } from "../../../../db/orders";

export const dynamic = "force-dynamic";
type RouteContext={params:Promise<{id:string}>};

export async function PATCH(request:Request,context:RouteContext) {
  const identity = await getChatGPTUser();
  if (!identity) return Response.json({error:"Authentication required"},{status:401});
  try {
    const profile = await ensureStudentProfile(identity);
    const {id:rawId}=await context.params;
    const orderId=Number(rawId);
    const payload=(await request.json()) as {action?:unknown};
    if (!Number.isInteger(orderId)||orderId<1) throw new Error("Invalid order.");
    if (payload.action!=="confirm"&&payload.action!=="cancel") throw new Error("Invalid order action.");
    await updateOrder(orderId,profile.id,payload.action);
    return Response.json({success:true});
  } catch(error) {
    return Response.json({error:error instanceof Error?error.message:"Unable to update order."},{status:400});
  }
}
