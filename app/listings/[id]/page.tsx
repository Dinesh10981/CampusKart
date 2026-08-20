import Link from "next/link";
import { notFound } from "next/navigation";
import { getListingDetails } from "../../../db/listings";
import ChatSellerButton from "./ChatSellerButton";
import ReportListingButton from "./ReportListingButton";
import { getUserRating } from "../../../db/trades";
import BuyNowButton from "./BuyNowButton";

export const dynamic = "force-dynamic";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) notFound();
  const listing = await getListingDetails(id);
  if (!listing) notFound();
  const rating = await getUserRating(listing.sellerId);

  return (
    <main className="detail-page">
      <nav className="nav-shell detail-nav"><Link className="brand" href="/"><span className="brand-mark">C</span><span>Campus<span>Kart</span></span></Link><Link className="back-market" href="/">← Back to marketplace</Link></nav>
      <section className="detail-shell">
        <div className="detail-image" style={listing.imageKey ? { backgroundImage:`url(/api/listing-image?key=${encodeURIComponent(listing.imageKey)})` } : undefined}>{!listing.imageKey && <span>📦</span>}<em className={`listing-status ${listing.status}`}>{listing.status}</em></div>
        <div className="detail-copy">
          <span className="section-kicker">{listing.category} · {listing.condition}</span>
          <h1>{listing.title}</h1>
          <div className="detail-price"><strong>₹{listing.price.toLocaleString("en-IN")}</strong>{listing.originalPrice && listing.originalPrice > listing.price && <s>₹{listing.originalPrice.toLocaleString("en-IN")}</s>}</div>
          <p className="detail-description">{listing.description}</p>
          <div className="pickup-card"><span>⌖</span><div><small>SAFE CAMPUS PICKUP</small><strong>{listing.pickupLocation}</strong></div></div>
          <div className="detail-seller"><span>{listing.sellerName.charAt(0).toUpperCase()}</span><div><small>LISTED BY</small><strong>{listing.sellerName} {listing.sellerVerified === "verified" && <i>✓</i>}</strong><p>{listing.sellerDepartment || "CampusKart student"}{rating.average && <> · ★ {rating.average.toFixed(1)} ({rating.count})</>}</p></div></div>
          <div className="purchase-actions"><BuyNowButton listingId={listing.id} disabled={listing.status !== "active"}/><ChatSellerButton listingId={listing.id} disabled={listing.status === "sold"} /></div>
          <small className="detail-note">Never pay before inspecting the item at a safe campus meetup point.</small>
          <ReportListingButton listingId={listing.id} />
        </div>
      </section>
    </main>
  );
}
