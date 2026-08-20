import { getChatGPTUser } from "../../chatgpt-auth";
import { createListing, getPublicListings } from "../../../db/listings";
import { ensureStudentProfile } from "../../../db/profiles";
import { parseImage, parseListingInput } from "./listing-input";
import { deleteListingImage, uploadListingImage } from "./storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ listings: await getPublicListings() });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load listings." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const identity = await getChatGPTUser();
  if (!identity) return Response.json({ error: "Authentication required" }, { status: 401 });

  let uploadedKey: string | null = null;
  try {
    const profile = await ensureStudentProfile(identity);
    const form = await request.formData();
    const input = parseListingInput(form);
    const image = parseImage(form, true);
    const uploaded = image ? await uploadListingImage(image) : null;
    uploadedKey = uploaded?.key ?? null;
    const listing = await createListing(profile.id, {
      ...input,
      imageKey: uploaded?.key ?? null,
      imageContentType: uploaded?.contentType ?? null,
    });
    return Response.json({ listing }, { status: 201 });
  } catch (error) {
    await deleteListingImage(uploadedKey);
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create listing." }, { status: 400 });
  }
}
