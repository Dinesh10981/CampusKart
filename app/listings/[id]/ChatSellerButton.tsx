"use client";

import { useState } from "react";

export default function ChatSellerButton({ listingId, disabled }: { listingId: number; disabled: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startConversation() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      if (response.status === 401) {
        window.location.href = `/signin-with-chatgpt?return_to=${encodeURIComponent(`/listings/${listingId}`)}`;
        return;
      }
      const data = (await response.json()) as { conversation?: { id: number }; error?: string };
      if (!response.ok || !data.conversation) throw new Error(data.error || "Unable to start chat.");
      window.location.href = `/messages/${data.conversation.id}`;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start chat.");
      setLoading(false);
    }
  }

  return (
    <>
      <button className="contact-seller" disabled={disabled || loading} onClick={startConversation}>{disabled ? "This item is sold" : loading ? "Opening conversation…" : "Message seller or make an offer"}</button>
      {error && <span className="chat-start-error">{error}</span>}
    </>
  );
}
