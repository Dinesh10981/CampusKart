"use client";

import { useState } from "react";

type Listing = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  originalPrice: number | null;
  condition: string;
  pickupLocation: string;
  imageKey: string | null;
  status: "draft" | "active" | "reserved" | "sold";
};

const emptyListing: Omit<Listing, "id"> = {
  title: "", description: "", category: "Books", price: 0, originalPrice: null,
  condition: "Good", pickupLocation: "", imageKey: null, status: "active",
};

export default function ListingsManager({ initialListings }: { initialListings: Listing[] }) {
  const [listings, setListings] = useState(initialListings);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const formListing = editing ?? (creating ? emptyListing : null);

  async function saveListing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(editing ? `/api/listings/${editing.id}` : "/api/listings", {
        method: editing ? "PATCH" : "POST",
        body: form,
      });
      const data = (await response.json()) as { listing?: Listing; error?: string };
      if (!response.ok || !data.listing) throw new Error(data.error || "Unable to save listing.");
      setListings((current) => editing ? current.map((item) => item.id === data.listing!.id ? data.listing! : item) : [data.listing!, ...current]);
      setEditing(null);
      setCreating(false);
      setMessage(editing ? "Listing updated." : "Listing published.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save listing.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteListing(listing: Listing) {
    if (!window.confirm(`Delete “${listing.title}”? This cannot be undone.`)) return;
    setMessage("");
    const response = await fetch(`/api/listings/${listing.id}`, { method: "DELETE" });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(data.error || "Unable to delete listing.");
      return;
    }
    setListings((current) => current.filter((item) => item.id !== listing.id));
    setMessage("Listing deleted.");
  }

  return (
    <section className="dashboard-panel listings-panel" id="listings">
      <div className="listings-heading">
        <div><span className="dashboard-kicker">MY LISTINGS</span><h2>{listings.length ? "Your marketplace inventory" : "Your selling space is ready."}</h2><p>{listings.length ? "Edit prices, update availability or remove items you no longer want to sell." : "Create your first listing to start selling within the campus community."}</p></div>
        <button className="primary-small" onClick={() => { setEditing(null); setCreating(true); setMessage(""); }}>＋ Add item</button>
      </div>

      {message && <p className="listing-message">{message}</p>}

      {listings.length > 0 && (
        <div className="my-listings-grid">
          {listings.map((listing) => (
            <article className="my-listing-card" key={listing.id}>
              <div className="my-listing-image" style={listing.imageKey ? { backgroundImage: `url(/api/listing-image?key=${encodeURIComponent(listing.imageKey)})` } : undefined}>{!listing.imageKey && <span>📦</span>}<em className={`listing-status ${listing.status}`}>{listing.status}</em></div>
              <div className="my-listing-body"><small>{listing.category} · {listing.condition}</small><h3>{listing.title}</h3><strong>₹{listing.price.toLocaleString("en-IN")}</strong><p>{listing.pickupLocation}</p><div><button onClick={() => { setCreating(false); setEditing(listing); setMessage(""); }}>Edit</button><button className="danger" onClick={() => deleteListing(listing)}>Delete</button></div></div>
            </article>
          ))}
        </div>
      )}

      {formListing && (
        <div className="listing-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) { setCreating(false); setEditing(null); } }}>
          <div className="listing-modal" role="dialog" aria-modal="true" aria-labelledby="listing-form-title">
            <div className="modal-heading"><div><span className="dashboard-kicker">{editing ? "UPDATE PRODUCT" : "NEW PRODUCT"}</span><h2 id="listing-form-title">{editing ? "Edit your listing" : "List an item on campus"}</h2></div><button aria-label="Close listing form" onClick={() => { setCreating(false); setEditing(null); }} disabled={saving}>×</button></div>
            <form className="listing-form" onSubmit={saveListing}>
              <label className="field-wide">Product photo {editing && <small>Leave empty to keep the current photo</small>}<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required={!editing} /></label>
              <label className="field-wide">Title<input name="title" defaultValue={formListing.title} minLength={4} maxLength={100} required placeholder="e.g. Casio FX-991ES Plus Calculator" /></label>
              <label className="field-wide">Description<textarea name="description" defaultValue={formListing.description} minLength={10} maxLength={1200} required placeholder="Mention age, included accessories and any defects." /></label>
              <label>Category<select name="category" defaultValue={formListing.category}><option>Books</option><option>Electronics</option><option>Cycles</option><option>Essentials</option><option>Other</option></select></label>
              <label>Condition<select name="condition" defaultValue={formListing.condition}><option>Like new</option><option>Good</option><option>Fair</option></select></label>
              <label>Selling price (₹)<input name="price" type="number" min="1" max="1000000" defaultValue={formListing.price || ""} required /></label>
              <label>Original price (₹)<input name="originalPrice" type="number" min="1" max="1000000" defaultValue={formListing.originalPrice ?? ""} /></label>
              <label className="field-wide">Campus pickup location<input name="pickupLocation" defaultValue={formListing.pickupLocation} minLength={3} maxLength={100} required placeholder="e.g. Main Block entrance" /></label>
              <label>Status<select name="status" defaultValue={formListing.status}><option value="draft">Draft</option><option value="active">Active</option><option value="reserved">Reserved</option><option value="sold">Sold</option></select></label>
              <div className="modal-actions field-wide"><button type="button" onClick={() => { setCreating(false); setEditing(null); }} disabled={saving}>Cancel</button><button className="save-listing" type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Publish listing"}</button></div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
