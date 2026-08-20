import Link from "next/link";
import { notFound } from "next/navigation";
import { requireChatGPTUser } from "../chatgpt-auth";
import { getAdminStats } from "../../db/admin";
import { ensureStudentProfile } from "../../db/profiles";
import { getOpenReports } from "../../db/trades";
import { getVerificationRequests } from "../../db/verification";
import ReportsManager from "./ReportsManager";
import VerificationManager from "./VerificationManager";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const identity = await requireChatGPTUser("/admin");
  const profile = await ensureStudentProfile(identity);
  if (profile.role !== "admin") notFound();
  const [reports, verificationRequests, stats] = await Promise.all([getOpenReports(), getVerificationRequests(), getAdminStats()]);

  return <main className="messages-page">
    <nav className="nav-shell messages-nav"><Link className="brand" href="/"><span className="brand-mark">C</span><span>Campus<span>Kart</span></span></Link><div><Link href="/dashboard">Dashboard</Link><Link href="/">Marketplace</Link></div></nav>
    <section className="admin-shell">
      <header><span className="dashboard-kicker">TRUST &amp; SAFETY</span><h1>Admin control centre</h1><p>Verify campus members, monitor marketplace health and resolve community reports.</p></header>
      <div className="admin-stats"><article><span>Students</span><strong>{stats.students}</strong></article><article><span>Listings</span><strong>{stats.listings}</strong></article><article><span>Orders</span><strong>{stats.orders}</strong></article><article><span>Pending IDs</span><strong>{stats.pendingVerifications}</strong></article><article><span>Open reports</span><strong>{stats.openReports}</strong></article></div>
      <VerificationManager initialRequests={verificationRequests} />
      <section className="admin-section"><div className="admin-section-heading"><div><span className="dashboard-kicker">MARKETPLACE SAFETY</span><h2>Listing reports</h2></div><span>{stats.openReports} open</span></div>
        {reports.length ? <ReportsManager initialReports={reports}/> : <div className="inbox-empty"><span>✓</span><h2>No reports to review</h2><p>The CampusKart community is currently clear.</p></div>}
      </section>
    </section>
  </main>;
}
