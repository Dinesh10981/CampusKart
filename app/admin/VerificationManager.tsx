"use client";

import { useState } from "react";

type Verification = { id:number; studentName:string; accountEmail:string; collegeEmail:string; studentId:string; college:string; department:string|null; yearOfStudy:number|null; status:"pending"|"approved"|"rejected"; reviewNotes:string; submittedAt:string };

export default function VerificationManager({ initialRequests }: { initialRequests: Verification[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [notes, setNotes] = useState<Record<number,string>>({});
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  async function decide(id:number, decision:"approved"|"rejected") {
    setSavingId(id); setMessage("");
    const response = await fetch(`/api/admin/verifications/${id}`, { method:"PATCH", headers:{"content-type":"application/json"}, body:JSON.stringify({ decision, reviewNotes:notes[id] || "" }) });
    const data = (await response.json()) as { error?:string };
    if (!response.ok) setMessage(data.error || "Unable to review request.");
    else { setRequests((current) => current.map((item) => item.id === id ? {...item,status:decision,reviewNotes:notes[id] || ""} : item)); setMessage(`Verification ${decision}.`); }
    setSavingId(null);
  }

  return <section className="admin-section"><div className="admin-section-heading"><div><span className="dashboard-kicker">STUDENT TRUST</span><h2>Campus verification requests</h2></div><span>{requests.filter((item) => item.status === "pending").length} pending</span></div>
    {message && <p className="admin-message">{message}</p>}
    {requests.length ? <div className="verification-review-list">{requests.map((request) => <article className="verification-review-card" key={request.id}>
      <header><div className="identity-card"><span>{request.studentName.charAt(0).toUpperCase()}</span><div><strong>{request.studentName}</strong><small>{request.accountEmail}</small></div></div><em className={`status-pill status-${request.status === "approved" ? "verified" : request.status}`}>{request.status}</em></header>
      <dl><div><dt>College email</dt><dd>{request.collegeEmail}</dd></div><div><dt>Register number</dt><dd>{request.studentId}</dd></div><div><dt>Course</dt><dd>{request.department || "Not provided"}{request.yearOfStudy ? ` · Year ${request.yearOfStudy}` : ""}</dd></div><div><dt>Submitted</dt><dd>{new Date(request.submittedAt).toLocaleDateString("en-IN")}</dd></div></dl>
      {request.status === "pending" ? <footer><input value={notes[request.id] || ""} onChange={(event) => setNotes((current) => ({...current,[request.id]:event.target.value}))} maxLength={300} placeholder="Optional review note"/><button onClick={() => decide(request.id,"rejected")} disabled={savingId === request.id}>Reject</button><button className="approve" onClick={() => decide(request.id,"approved")} disabled={savingId === request.id}>Approve</button></footer> : request.reviewNotes && <p className="review-note">Admin note: {request.reviewNotes}</p>}
    </article>)}</div> : <div className="inbox-empty"><span>ID</span><h2>No verification requests yet</h2><p>Student submissions will appear here for review.</p></div>}
  </section>;
}
