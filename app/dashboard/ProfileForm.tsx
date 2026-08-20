"use client";

import { useState } from "react";

export default function ProfileForm({
  initialDepartment,
  initialYear,
}: {
  initialDepartment: string;
  initialYear: number | null;
}) {
  const [department, setDepartment] = useState(initialDepartment);
  const [yearOfStudy, setYearOfStudy] = useState(initialYear?.toString() ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("saving");
    setMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ department, yearOfStudy: Number(yearOfStudy) }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to save your profile.");
      setState("saved");
      setMessage("Profile saved successfully.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Unable to save your profile.");
    }
  }

  return (
    <form className="profile-form" onSubmit={saveProfile}>
      <label>
        Department
        <input value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="Artificial Intelligence and Machine Learning" required minLength={2} maxLength={80} />
      </label>
      <label>
        Year of study
        <select value={yearOfStudy} onChange={(event) => setYearOfStudy(event.target.value)} required>
          <option value="">Select year</option>
          <option value="1">First year</option><option value="2">Second year</option><option value="3">Third year</option><option value="4">Fourth year</option><option value="5">Postgraduate</option>
        </select>
      </label>
      <div className="form-action-row">
        <button type="submit" disabled={state === "saving"}>{state === "saving" ? "Saving…" : "Save profile"}</button>
        {message && <span className={state === "error" ? "form-message error" : "form-message"}>{message}</span>}
      </div>
    </form>
  );
}
