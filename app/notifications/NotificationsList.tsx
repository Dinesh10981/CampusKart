"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Activity = {
  id: number;
  conversationId: number;
  body: string;
  kind: "message" | "offer" | "system";
  offerAmount: number | null;
  offerStatus: string | null;
  createdAt: string;
  readAt: string | null;
  senderName: string;
  listingTitle: string;
};

export default function NotificationsList({ initialActivity }: { initialActivity: Activity[] }) {
  const [activity, setActivity] = useState(initialActivity);
  const [saving, setSaving] = useState(false);
  const unread = useMemo(() => activity.filter((item) => !item.readAt).length, [activity]);

  async function markAllRead() {
    setSaving(true);
    const response = await fetch("/api/notifications/read", { method: "POST" });
    if (response.ok) setActivity((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
    setSaving(false);
  }

  if (!activity.length) return <div className="inbox-empty"><span>🔔</span><h2>You are all caught up</h2><p>New messages, offers and meetup updates will appear here.</p><Link href="/">Browse marketplace</Link></div>;

  return <>
    <div className="activity-toolbar"><span>{unread ? `${unread} unread notification${unread === 1 ? "" : "s"}` : "Everything is read"}</span><button onClick={markAllRead} disabled={!unread || saving}>{saving ? "Updating…" : "Mark all as read"}</button></div>
    <div className="activity-list">{activity.map((item) => (
      <Link href={`/messages/${item.conversationId}`} className={`activity-row ${item.readAt ? "" : "unread"}`} key={item.id}>
        <span className="activity-icon">{item.kind === "offer" ? "₹" : item.kind === "system" ? "✓" : "●"}</span>
        <div><strong>{item.kind === "offer" ? `${item.senderName} sent an offer of ₹${item.offerAmount?.toLocaleString("en-IN")}` : item.kind === "system" ? item.body : `${item.senderName}: ${item.body}`}</strong><p>{item.listingTitle}{item.offerStatus ? ` · ${item.offerStatus}` : ""}</p></div>
        <time>{new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</time>
      </Link>
    ))}</div>
  </>;
}
