"use client";

import { useState } from "react";

export default function ReportListingButton({ listingId }: { listingId: number }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/reports", {
      method:"POST", headers:{ "content-type":"application/json" },
      body:JSON.stringify({ listingId, reason:form.get("reason"), details:form.get("details") }),
    });
    const data = (await response.json()) as { error?: string };
    if (response.status === 401) {
      window.location.assign(`/signin-with-chatgpt?return_to=${encodeURIComponent(`/listings/${listingId}`)}`);
      return;
    }
    if (!response.ok) setMessage(data.error || "Unable to submit report.");
    else { setMessage("Report submitted for review."); setOpen(false); }
    setSaving(false);
  }

  return <div className="report-control">
    <button type="button" onClick={() => setOpen((value) => !value)}>⚑ Report listing</button>
    {open && <form onSubmit={submit}><select name="reason" defaultValue="misleading"><option value="misleading">Misleading information</option><option value="prohibited">Prohibited item</option><option value="spam">Spam or duplicate</option><option value="unsafe">Unsafe behaviour</option><option value="other">Other concern</option></select><textarea name="details" maxLength={500} placeholder="Tell the moderation team what happened (optional)"/><div><button type="button" onClick={() => setOpen(false)}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Sending…" : "Submit report"}</button></div></form>}
    {message && <small>{message}</small>}
  </div>;
}
