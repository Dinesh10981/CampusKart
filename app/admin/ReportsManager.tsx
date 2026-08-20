"use client";

import { useState } from "react";

type Report = { id:number; reason:string; details:string; status:string; createdAt:string; listingId:number; listingTitle:string; reporterName:string };

export default function ReportsManager({ initialReports }: { initialReports:Report[] }) {
  const [reports,setReports] = useState(initialReports);
  const [message,setMessage] = useState("");
  async function moderate(id:number,status:"resolved"|"dismissed",hideListing=false) {
    setMessage("");
    const response = await fetch(`/api/admin/reports/${id}`, { method:"PATCH", headers:{"content-type":"application/json"}, body:JSON.stringify({ status, hideListing }) });
    const data = (await response.json()) as { error?:string };
    if (!response.ok) { setMessage(data.error || "Unable to update report."); return; }
    setReports((current) => current.map((report) => report.id === id ? {...report,status} : report));
    setMessage(hideListing ? "Report resolved and listing hidden." : `Report ${status}.`);
  }
  return <>{message && <p className="admin-message">{message}</p>}<div className="report-list">{reports.map((report) => <article className="report-card" key={report.id}><header><span className={`listing-status-inline ${report.status}`}>{report.status}</span><time>{new Date(report.createdAt).toLocaleDateString("en-IN")}</time></header><h2>{report.listingTitle}</h2><p><strong>{report.reason}</strong> · reported by {report.reporterName}</p><blockquote>{report.details || "No additional details provided."}</blockquote><footer><a href={`/listings/${report.listingId}`}>View listing</a>{report.status === "open" && <><button onClick={() => moderate(report.id,"dismissed")}>Dismiss</button><button onClick={() => moderate(report.id,"resolved")}>Resolve</button><button className="danger" onClick={() => moderate(report.id,"resolved",true)}>Hide listing</button></>}</footer></article>)}</div></>;
}
