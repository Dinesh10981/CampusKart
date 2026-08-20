"use client";

import { useEffect, useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  seller: string;
  year: string;
  location: string;
  age: string;
  emoji: string;
  tone: string;
  verified?: boolean;
  imageKey?: string | null;
  isReal?: boolean;
};

const products: Product[] = [
  { id: 1, name: "Engineering Mathematics Vol. II", category: "Books", price: 320, originalPrice: 680, seller: "Demo Student 1", year: "CSE · 3rd year", location: "Campus Pickup Zone A", age: "12 min ago", emoji: "📘", tone: "blue", verified: true },
  { id: 2, name: "Casio FX-991ES Plus Calculator", category: "Electronics", price: 720, originalPrice: 1295, seller: "Demo Student 2", year: "ECE · 2nd year", location: "Campus Pickup Zone B", age: "28 min ago", emoji: "🧮", tone: "mint", verified: true },
  { id: 3, name: "Decathlon Rockrider Cycle", category: "Cycles", price: 4800, originalPrice: 8999, seller: "Demo Student 3", year: "AIML · 4th year", location: "Campus Pickup Zone C", age: "1 hr ago", emoji: "🚲", tone: "amber", verified: true },
  { id: 4, name: "White Lab Coat — Size M", category: "Essentials", price: 180, originalPrice: 450, seller: "Demo Student 4", year: "Biotech · 3rd year", location: "Campus Pickup Zone D", age: "2 hrs ago", emoji: "🥼", tone: "lilac" },
  { id: 5, name: "Cosmic Byte Gaming Keyboard", category: "Electronics", price: 950, originalPrice: 1599, seller: "Demo Student 5", year: "IT · 2nd year", location: "Campus Pickup Zone E", age: "3 hrs ago", emoji: "⌨️", tone: "rose", verified: true },
  { id: 6, name: "A3 Drawing Board with Clips", category: "Essentials", price: 400, originalPrice: 850, seller: "Demo Student 6", year: "Mechanical · 1st year", location: "Campus Pickup Zone F", age: "Yesterday", emoji: "📐", tone: "sand" },
];

const categories = ["All", "Books", "Electronics", "Cycles", "Essentials"];

export default function Home() {
  const [marketProducts, setMarketProducts] = useState(products);
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [wishlisted, setWishlisted] = useState<number[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/listings")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: { listings?: Array<{ id:number; title:string; category:string; price:number; originalPrice:number|null; condition:string; pickupLocation:string; imageKey:string|null; sellerName:string; sellerVerified:string }> }) => {
        if (!active || !data.listings?.length) return;
        const toneByCategory: Record<string, string> = { Books:"blue", Electronics:"mint", Cycles:"amber", Essentials:"lilac", Other:"sand" };
        const emojiByCategory: Record<string, string> = { Books:"📘", Electronics:"⌨️", Cycles:"🚲", Essentials:"📦", Other:"🏷️" };
        setMarketProducts(data.listings.map((listing) => ({
          id:listing.id, name:listing.title, category:listing.category, price:listing.price,
          originalPrice:listing.originalPrice ?? listing.price, seller:listing.sellerName,
          year:listing.condition, location:listing.pickupLocation, age:"New listing",
          emoji:emojiByCategory[listing.category] ?? "🏷️", tone:toneByCategory[listing.category] ?? "sand",
          verified:listing.sellerVerified === "verified", imageKey:listing.imageKey, isReal:true,
        })));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    fetch("/api/wishlist", { cache:"no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: { listingIds?: number[] }) => setWishlisted(data.listingIds ?? []))
      .catch(() => undefined);
  }, []);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matching = marketProducts.filter((product) => {
      const categoryMatches = activeCategory === "All" || product.category === activeCategory;
      const queryMatches = !normalized || product.name.toLowerCase().includes(normalized) || product.category.toLowerCase().includes(normalized) || product.location.toLowerCase().includes(normalized);
      return categoryMatches && queryMatches;
    });
    return [...matching].sort((a,b) => sort === "price-low" ? a.price - b.price : sort === "price-high" ? b.price - a.price : b.id - a.id);
  }, [activeCategory, query, marketProducts, sort]);

  const toggleWishlist = async (product: Product) => {
    if (!product.isReal) return;
    const response = await fetch("/api/wishlist", { method:"POST", headers:{ "content-type":"application/json" }, body:JSON.stringify({ listingId:product.id }) });
    if (response.status === 401) {
      window.location.assign("/signin-with-chatgpt?return_to=%2F%23marketplace");
      return;
    }
    if (!response.ok) return;
    const data = (await response.json()) as { saved?: boolean };
    setWishlisted((current) => data.saved ? [...new Set([...current, product.id])] : current.filter((id) => id !== product.id));
  };

  return (
    <main>
      <nav className="nav-shell" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="CampusKart home"><span className="brand-mark">C</span><span>Campus<span>Kart</span></span></a>
        <div className="nav-links"><a className="active" href="#marketplace">Marketplace</a><a href="#how-it-works">How it works</a><a href="#safety">Safety</a></div>
        <div className="nav-actions"><a className="icon-button" href="/notifications" aria-label="Notifications">●</a><a className="sign-in" href="/signin-with-chatgpt?return_to=%2Fdashboard">Sign in</a><a className="sell-button" href="/dashboard"><span>＋</span> Sell an item</a></div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span>✓</span> Exclusive to verified college students</div>
          <h1>Your campus.<br/><em>Your marketplace.</em></h1>
          <p>Buy, sell and exchange everything you need for college—safely, locally and without the awkward WhatsApp group messages.</p>
          <div className="hero-search"><span aria-hidden="true">⌕</span><input aria-label="Search CampusKart" placeholder="Search books, calculators, cycles..." value={query} onChange={(event) => setQuery(event.target.value)} /><a href="#marketplace">Search</a></div>
          <div className="trust-row"><div className="avatar-stack"><i>A</i><i>R</i><i>N</i><i>V</i></div><p><strong>2,400+ students</strong><br/>already buying smarter</p></div>
        </div>

        <div className="hero-visual" aria-label="CampusKart marketplace preview">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="floating-card book-card"><span>📚</span><div><b>Textbooks</b><small>Up to 60% off</small></div></div>
          <div className="floating-card cycle-card"><span>🚲</span><div><b>Cycles</b><small>42 listed nearby</small></div></div>
          <div className="floating-card tech-card"><span>🎧</span><div><b>Tech & gear</b><small>Student prices</small></div></div>
          <div className="deal-card"><span className="deal-badge">JUST SOLD</span><span className="deal-emoji">🧮</span><b>Scientific Calculator</b><strong>₹680 <s>₹1,295</s></strong><small>Saved ₹615 · 2 min ago</small></div>
        </div>
      </section>

      <section className="marketplace" id="marketplace">
        <div className="section-heading"><div><span className="section-kicker">FRESH ON CAMPUS</span><h2>Good finds, right nearby.</h2></div><a href="#marketplace">View all listings <span>→</span></a></div>
        <div className="market-controls"><div className="category-row" aria-label="Product categories">
          {categories.map((category) => <button key={category} className={activeCategory === category ? "selected" : ""} onClick={() => setActiveCategory(category)}>{category}</button>)}
        </div><label>Sort by<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label></div>
        {filteredProducts.length ? (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <div className={`product-image ${product.tone} ${product.imageKey ? "uploaded-product-image" : ""}`} style={product.imageKey ? { backgroundImage:`url(/api/listing-image?key=${encodeURIComponent(product.imageKey)})` } : undefined}>{!product.imageKey && <span>{product.emoji}</span>}<button className={wishlisted.includes(product.id) ? "heart saved" : "heart"} onClick={() => toggleWishlist(product)} aria-label={`${wishlisted.includes(product.id) ? "Remove" : "Add"} ${product.name} ${wishlisted.includes(product.id) ? "from" : "to"} wishlist`} title={product.isReal ? "Save item" : "Demo listing"}>♥</button><small>{product.age}</small></div>
                <div className="product-content"><span className="product-category">{product.category}</span><h3>{product.isReal ? <a href={`/listings/${product.id}`}>{product.name}</a> : product.name}</h3><div className="price"><strong>₹{product.price.toLocaleString("en-IN")}</strong>{product.originalPrice > product.price && <s>₹{product.originalPrice.toLocaleString("en-IN")}</s>}</div><div className="seller"><span>{product.seller.charAt(0)}</span><div><b>{product.seller} {product.verified && <i title="Verified student">✓</i>}</b><small>{product.year}</small></div><em>{product.location}</em></div></div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state"><span>🔎</span><h3>No items found</h3><p>Try another search or browse all categories.</p><button onClick={() => { setQuery(""); setActiveCategory("All"); }}>Clear filters</button></div>
        )}
      </section>

      <section className="how-it-works" id="how-it-works">
        <div className="section-heading light"><div><span className="section-kicker">SIMPLE BY DESIGN</span><h2>From listing to handoff.</h2></div></div>
        <div className="steps"><article><span>01</span><b>List in a minute</b><p>Add a photo, a fair price and the pickup location.</p></article><article><span>02</span><b>Chat and agree</b><p>Make an offer and arrange a safe campus meetup.</p></article><article><span>03</span><b>Exchange safely</b><p>Inspect the item, complete the handoff and leave a rating.</p></article></div>
      </section>

      <section className="safety-strip" id="safety"><div className="shield">✓</div><div><span>CAMPUSKART PROTECT</span><h2>Built for a trusted student community.</h2><p>College-email verification, public meetup points, user ratings and simple reporting keep every exchange safer.</p></div><button>Read safety guide →</button></section>

      <footer><a className="brand footer-brand" href="#top"><span className="brand-mark">C</span><span>Campus<span>Kart</span></span></a><p>Made for students, by students.</p><span>© 2026 CampusKart</span></footer>
    </main>
  );
}
