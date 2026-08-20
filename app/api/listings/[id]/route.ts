import { getChatGPTUser } from "../../../chatgpt-auth";
import { deleteOwnedListing, getOwnedListing, updateOwnedListing } from "../../../../db/listings";
import { ensureStudentProfile } from "../../../../db/profiles";
import { parseImage, parseListingInput } from "../listing-input";
import { deleteListingImage, uploadListingImage } from "../storage";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

async function authenticatedListing(context: RouteContext) {
  const identity = await getChatGPTUser();
  if (!identity) return { error: Response.json({ error: "Authentication required" }, { status: 401 }) };
  const profile = await ensureStudentProfile(identity);
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) return { error: Response.json({ error: "Invalid listing." }, { status: 400 }) };
  const listing = await getOwnedListing(id, profile.id);
  if (!listing) return { error: Response.json({ error: "Listing not found." }, { status: 404 }) };
  return { id, listing };
}

export async function PATCH(request: Request, context: RouteContext) {
  const authenticated = await authenticatedListing(context);
  if ("error" in authenticated) return authenticated.error;

  let uploadedKey: string | null = null;
  try {
    const form = await request.formData();
    const input = parseListingInput(form);
    const image = parseImage(form, false);
    const uploaded = image ? await uploadListingImage(image) : null;
    uploadedKey = uploaded?.key ?? null;
    const listing = await updateOwnedListing(authenticated.id, authenticated.listing.sellerId, {
      ...input,
      imageKey: uploaded?.key ?? authenticated.listing.imageKey,
      imageContentType: uploaded?.contentType ?? authenticated.listing.imageContentType,
    });
    if (!listing) throw new Error("Listing not found.");
    if (uploaded) await deleteListingImage(authenticated.listing.imageKey);
    return Response.json({ listing });
  } catch (error) {
    await deleteListingImage(uploadedKey);
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update listing." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authenticated = await authenticatedListing(context);
  if ("error" in authenticated) return authenticated.error;

  try {
    const deleted = await deleteOwnedListing(authenticated.id, authenticated.listing.sellerId);
    if (!deleted) return Response.json({ error: "Listing not found." }, { status: 404 });
    await deleteListingImage(deleted.imageKey);
    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to delete listing." }, { status: 400 });
  }
}
