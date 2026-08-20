"use client";

import { useCallback, useEffect, useState } from "react";

type Handoff = { id:number; proposedBy:string; location:string; meetupAt:string; status:"proposed"|"confirmed"|"completed"|"cancelled"; buyerCompletedAt:string|null; sellerCompletedAt:string|null };
type Review = { id:number; rating:number; comment:string };

export default function TradePanel({ conversationId, currentUserId, isBuyer }: { conversationId:number; currentUserId:string; isBuyer:boolean }) {
  const [handoff, setHandoff] = useState<Handoff|null>(null);
  const [review, setReview] = useState<Review|null>(null);
  const [listingStatus, setListingStatus] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/conversations/${conversationId}/handoff`, { cache:"no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { handoff:Handoff|null; review:Review|null; listingStatus:string };
    setHandoff(data.handoff); setReview(data.review); setListingStatus(data.listingStatus);
  }, [conversationId]);

  useEffect(() => { const initial = window.setTimeout(refresh,0); const timer = window.setInterval(refresh,5000); return () => { window.clearTimeout(initial); window.clearInterval(timer); }; }, [refresh]);

  async function propose(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const localMeetup = String(form.get("meetupAt") || "");
    const meetupAt = localMeetup ? new Date(localMeetup).toISOString() : "";
    const response = await fetch(`/api/conversations/${conversationId}/handoff`, { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ location:form.get("location"), meetupAt }) });
    const data = (await response.json()) as { error?:string };
    setMessage(response.ok ? "Meetup proposal sent." : data.error || "Unable to schedule meetup.");
    if (response.ok) setOpen(false);
    await refresh(); setBusy(false);
  }

  async function act(action:"accept"|"cancel"|"complete") {
    setBusy(true); setMessage("");
    const response = await fetch(`/api/conversations/${conversationId}/handoff`, { method:"PATCH", headers:{"content-type":"application/json"}, body:JSON.stringify({ action }) });
    const data = (await response.json()) as { error?:string };
    setMessage(response.ok ? action === "complete" ? "Your handoff confirmation was saved." : "Meetup updated." : data.error || "Unable to update meetup.");
    await refresh(); setBusy(false);
  }

  async function submitReview(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!handoff) return;
    setBusy(true); setMessage(""); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/reviews", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ handoffId:handoff.id, rating:Number(form.get("rating")), comment:form.get("comment") }) });
    const data = (await response.json()) as { error?:string };
    setMessage(response.ok ? "Thanks—your review is published." : data.error || "Unable to save review.");
    await refresh(); setBusy(false);
  }

  const ownCompleted = isBuyer ? handoff?.buyerCompletedAt : handoff?.sellerCompletedAt;
  return <section className="trade-panel">
    <div className="trade-title"><div><span>SAFE HANDOFF</span><strong>{handoff && handoff.status !== "cancelled" ? handoff.status : listingStatus === "reserved" ? "Ready to schedule" : "Accept an offer first"}</strong></div>{listingStatus === "reserved" && (!handoff || handoff.status === "cancelled") && <button onClick={() => setOpen((value) => !value)}>Schedule meetup</button>}</div>
    {open && <form className="handoff-form" onSubmit={propose}><input name="location" minLength={3} maxLength={120} required placeholder="Public campus meetup point"/><input name="meetupAt" type="datetime-local" required/><button type="submit" disabled={busy}>Send proposal</button></form>}
    {handoff && handoff.status !== "cancelled" && <div className="handoff-card"><div><span>⌖</span><p><strong>{handoff.location}</strong><small>{new Date(handoff.meetupAt).toLocaleString("en-IN", { dateStyle:"medium", timeStyle:"short" })}</small></p></div><div className="handoff-actions">{handoff.status === "proposed" && handoff.proposedBy !== currentUserId && <button onClick={() => act("accept")} disabled={busy}>Confirm meetup</button>}{handoff.status === "confirmed" && <button onClick={() => act("complete")} disabled={busy || Boolean(ownCompleted)}>{ownCompleted ? "You confirmed handoff" : "Confirm item exchanged"}</button>}{handoff.status !== "completed" && <button className="quiet" onClick={() => act("cancel")} disabled={busy}>Cancel</button>}</div></div>}
    {handoff?.status === "completed" && !review && <form className="review-form" onSubmit={submitReview}><strong>Rate this student</strong><select name="rating" defaultValue="5"><option value="5">★★★★★ Excellent</option><option value="4">★★★★☆ Good</option><option value="3">★★★☆☆ Average</option><option value="2">★★☆☆☆ Poor</option><option value="1">★☆☆☆☆ Very poor</option></select><input name="comment" maxLength={500} placeholder="Optional review"/><button type="submit" disabled={busy}>Publish review</button></form>}
    {review && <p className="review-saved">★ Your {review.rating}/5 review is published.</p>}
    {message && <small className="trade-message">{message}</small>}
  </section>;
}
