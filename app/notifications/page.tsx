import Link from "next/link";
import { requireChatGPTUser } from "../chatgpt-auth";
import { ensureStudentProfile } from "../../db/profiles";
import { getActivityFeed } from "../../db/activity";
import NotificationsList from "./NotificationsList";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const identity = await requireChatGPTUser("/notifications");
  const profile = await ensureStudentProfile(identity);
  const activity = await getActivityFeed(profile.id);

  return (
    <main className="messages-page">
      <nav className="nav-shell messages-nav"><Link className="brand" href="/"><span className="brand-mark">C</span><span>Campus<span>Kart</span></span></Link><div><Link href="/dashboard">Dashboard</Link><Link href="/messages">Messages</Link></div></nav>
      <section className="inbox-shell activity-shell">
        <header><span className="dashboard-kicker">ACTIVITY CENTRE</span><h1>Notifications</h1><p>Offers, messages and meetup updates from your campus trades.</p></header>
        <NotificationsList initialActivity={activity} />
      </section>
    </main>
  );
}
