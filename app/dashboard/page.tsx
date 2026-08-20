import Link from "next/link";
import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";
import { ensureStudentProfile, getStudentStats } from "../../db/profiles";
import { getListingsForSeller } from "../../db/listings";
import ListingsManager from "./ListingsManager";
import ProfileForm from "./ProfileForm";
import WishlistSection from "./WishlistSection";
import { getWishlistListings } from "../../db/wishlist";
import { getVerificationRequest } from "../../db/verification";
import VerificationPanel from "./VerificationPanel";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const identity = await requireChatGPTUser("/dashboard");
  const profile = await ensureStudentProfile(identity);
  const stats = await getStudentStats(profile.id);
  const sellerListings = await getListingsForSeller(profile.id);
  const savedListings = await getWishlistListings(profile.id);
  const verificationRequest = await getVerificationRequest(profile.id);
  const firstName = profile.displayName.split(" ")[0];

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link className="brand dashboard-brand" href="/"><span className="brand-mark">C</span><span>Campus<span>Kart</span></span></Link>
        <nav aria-label="Dashboard navigation">
          <a className="current" href="/dashboard"><span>⌂</span> Overview</a>
          <Link href="/"><span>▦</span> Marketplace</Link>
          <Link href="/messages"><span>●</span> Messages</Link>
          <Link href="/notifications"><span>🔔</span> Notifications</Link>
          <Link href="/orders"><span>🧾</span> Purchases &amp; sales</Link>
          <Link href="/assistant"><span>✦</span> AI assistant</Link>
          <a href="#listings"><span>◫</span> My listings</a>
          <a href="#wishlist"><span>♥</span> Wishlist</a>
          {profile.role === "admin" && <Link href="/admin"><span>◆</span> Admin panel</Link>}
        </nav>
        <a className="sign-out-link" href={chatGPTSignOutPath("/")}>Sign out</a>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header">
          <div><span className="dashboard-kicker">STUDENT DASHBOARD</span><h1>Good to see you, {firstName}.</h1><p>Manage your profile, listings and saved campus finds.</p></div>
          <a className="sell-button" href="#listings"><span>＋</span> Create listing</a>
        </header>

        <div className="dashboard-stats">
          <article><span>Active listings</span><strong>{stats.listings}</strong><small>Items you have posted</small></article>
          <article><span>Saved items</span><strong>{stats.wishlist}</strong><small>Your wishlist</small></article>
          <article><span>Campus status</span><strong className={`status-${profile.verificationStatus}`}>{profile.verificationStatus}</strong><small>{profile.verificationStatus === "verified" ? "College identity confirmed" : "Verification review required"}</small></article>
        </div>

        <div className="dashboard-grid">
          <article className="dashboard-panel profile-panel">
            <div className="panel-heading"><div><span className="dashboard-kicker">YOUR ACCOUNT</span><h2>Student profile</h2></div><span className={`status-pill status-${profile.verificationStatus}`}>{profile.verificationStatus}</span></div>
            <div className="identity-card"><span>{profile.displayName.charAt(0).toUpperCase()}</span><div><strong>{profile.displayName}</strong><small>{profile.email}</small></div><em>{profile.role}</em></div>
            <ProfileForm initialDepartment={profile.department ?? ""} initialYear={profile.yearOfStudy} />
          </article>

          <VerificationPanel status={profile.verificationStatus} initialRequest={verificationRequest} />
        </div>

        <ListingsManager initialListings={sellerListings} />
        <WishlistSection listings={savedListings} />
      </section>
    </main>
  );
}
