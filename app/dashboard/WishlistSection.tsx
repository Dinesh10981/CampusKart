import Link from "next/link";

type SavedListing = {
  id: number;
  title: string;
  category: string;
  price: number;
  condition: string;
  pickupLocation: string;
  imageKey: string | null;
  status: "draft" | "active" | "reserved" | "sold";
  sellerName: string;
};

export default function WishlistSection({ listings }: { listings: SavedListing[] }) {
  return <section className="dashboard-panel wishlist-panel" id="wishlist">
    <div className="listings-heading"><div><span className="dashboard-kicker">SAVED ITEMS</span><h2>Your wishlist</h2><p>Keep an eye on campus finds and return when you are ready to message the seller.</p></div><Link className="primary-small" href="/">Browse items</Link></div>
    {listings.length ? <div className="wishlist-grid">{listings.map((listing) => <Link href={`/listings/${listing.id}`} className="wishlist-card" key={listing.id}><div style={listing.imageKey ? { backgroundImage:`url(/api/listing-image?key=${encodeURIComponent(listing.imageKey)})` } : undefined}>{!listing.imageKey && <span>📦</span>}</div><section><small>{listing.category} · {listing.condition}</small><h3>{listing.title}</h3><strong>₹{listing.price.toLocaleString("en-IN")}</strong><p>{listing.sellerName} · {listing.pickupLocation}</p></section><em className={`listing-status-inline ${listing.status}`}>{listing.status}</em></Link>)}</div> : <div className="empty-listings"><span>♥</span><div><h3>No saved items yet</h3><p>Select the heart on a marketplace listing to save it here.</p></div></div>}
  </section>;
}
