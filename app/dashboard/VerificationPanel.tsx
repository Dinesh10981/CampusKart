"use client";

import { useState } from "react";

type VerificationRequest = {
  collegeEmail: string;
  studentId: string;
  status: "pending" | "approved" | "rejected";
  reviewNotes: string;
} | null;

export default function VerificationPanel({ status, initialRequest }: { status: "pending" | "verified" | "rejected"; initialRequest: VerificationRequest }) {
  const [request, setRequest] = useState(initialRequest);
  const [collegeEmail, setCollegeEmail] = useState(initialRequest?.collegeEmail ?? "");
  const [studentId, setStudentId] = useState(initialRequest?.studentId ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/verification", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ collegeEmail, studentId }) });
      const data = (await response.json()) as { request?: NonNullable<VerificationRequest>; error?: string };
      if (!response.ok || !data.request) throw new Error(data.error || "Unable to submit verification.");
      setRequest(data.request);
      setMessage("Verification request submitted for admin review.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit verification.");
    } finally {
      setSaving(false);
    }
  }

  const currentStatus = status === "verified" ? "approved" : request?.status ?? status;
  return <aside className="dashboard-panel verification-panel">
    <span className="verification-icon">{currentStatus === "approved" ? "✓" : currentStatus === "rejected" ? "!" : "ID"}</span>
    <span className="dashboard-kicker">CAMPUS VERIFICATION</span>
    <h2>{currentStatus === "approved" ? "Campus identity verified." : currentStatus === "pending" && request ? "Your request is under review." : "Build trust before you trade."}</h2>
    <p>{currentStatus === "approved" ? "Your verified badge helps buyers and sellers identify trusted campus members." : "Submit your college email and student register number. An administrator reviews the request before your badge appears."}</p>
    {currentStatus !== "approved" && <form className="verification-form" onSubmit={submit}>
      <label>College email<input type="email" value={collegeEmail} onChange={(event) => setCollegeEmail(event.target.value)} maxLength={160} required placeholder="student@college.edu" /></label>
      <label>Student / register number<input value={studentId} onChange={(event) => setStudentId(event.target.value)} minLength={4} maxLength={30} required placeholder="23AIML001" /></label>
      <button type="submit" disabled={saving}>{saving ? "Submitting…" : request?.status === "rejected" ? "Resubmit request" : request ? "Update request" : "Request verification"}</button>
    </form>}
    {request?.status === "rejected" && request.reviewNotes && <p className="verification-note"><strong>Admin note:</strong> {request.reviewNotes}</p>}
    {message && <p className="verification-feedback">{message}</p>}
  </aside>;
}
