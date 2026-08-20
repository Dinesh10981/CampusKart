"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TradePanel from "./TradePanel";

type Message = {
  id: number;
  senderId: string;
  senderName: string;
  body: string;
  kind: "message" | "offer" | "system";
  offerAmount: number | null;
  offerStatus: "pending" | "accepted" | "rejected" | "countered" | "withdrawn" | null;
  createdAt: string;
};

export default function ChatRoom({
  conversationId,
  currentUserId,
  initialMessages,
  listingPrice,
  isBuyer,
}: {
  conversationId: number;
  currentUserId: string;
  initialMessages: Message[];
  listingPrice: number;
  isBuyer: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [showOffer, setShowOffer] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/conversations/${conversationId}/messages`, { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { messages?: Message[] };
    if (data.messages) setMessages(data.messages);
  }, [conversationId]);

  useEffect(() => {
    const timer = window.setInterval(refresh, 3000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) return;
    setSending(true); setError("");
    const response = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type:"message", body }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) setError(data.error || "Unable to send message.");
    else { setBody(""); await refresh(); }
    setSending(false);
  }

  async function sendPriceOffer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true); setError("");
    const response = await fetch(`/api/conversations/${conversationId}/messages`, {
      method:"POST", headers:{ "content-type":"application/json" }, body:JSON.stringify({ type:"offer", amount:Number(offerAmount) }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) setError(data.error || "Unable to send offer.");
    else { setOfferAmount(""); setShowOffer(false); await refresh(); }
    setSending(false);
  }

  async function actOnOffer(id: number, action: "accept" | "reject" | "withdraw" | "counter") {
    let amount: number | undefined;
    if (action === "counter") {
      const raw = window.prompt("Enter your counteroffer amount in ₹:");
      if (!raw) return;
      amount = Number(raw);
    }
    setError("");
    const response = await fetch(`/api/offers/${id}`, {
      method:"PATCH", headers:{ "content-type":"application/json" }, body:JSON.stringify({ action, amount }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) setError(data.error || "Unable to update offer.");
    await refresh();
  }

  return (
    <div className="chat-room">
      <div className="message-stream" aria-live="polite">
        <div className="chat-safety"><span>✓</span> Keep payments offline until you inspect the item at a safe campus meetup.</div>
        {messages.length === 0 && <div className="chat-empty"><span>👋</span><p>Start with a question about the item or make a fair offer.</p></div>}
        {messages.map((message) => {
          const own = message.senderId === currentUserId;
          return (
            <div className={`message-wrap ${own ? "own" : "other"}`} key={message.id}>
              <small>{own ? "You" : message.senderName}</small>
              {message.kind === "offer" ? (
                <article className="offer-bubble">
                  <span>PRICE OFFER</span><strong>₹{message.offerAmount?.toLocaleString("en-IN")}</strong><em className={`offer-${message.offerStatus}`}>{message.offerStatus}</em>
                  {message.offerStatus === "pending" && <div>{own ? <button onClick={() => actOnOffer(message.id,"withdraw")}>Withdraw</button> : <><button className="accept" onClick={() => actOnOffer(message.id,"accept")}>Accept</button><button onClick={() => actOnOffer(message.id,"counter")}>Counter</button><button className="reject" onClick={() => actOnOffer(message.id,"reject")}>Reject</button></>}</div>}
                </article>
              ) : <p className="message-bubble">{message.body}</p>}
              <time>{new Date(message.createdAt).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}</time>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="chat-composer">
        <TradePanel conversationId={conversationId} currentUserId={currentUserId} isBuyer={isBuyer} />
        {error && <p className="chat-error">{error}</p>}
        {showOffer && <form className="offer-form" onSubmit={sendPriceOffer}><label>Offer amount (listed at ₹{listingPrice.toLocaleString("en-IN")})<div><span>₹</span><input type="number" min="1" max="1000000" value={offerAmount} onChange={(event) => setOfferAmount(event.target.value)} required autoFocus /><button type="submit" disabled={sending}>Send offer</button><button type="button" onClick={() => setShowOffer(false)}>Cancel</button></div></label></form>}
        <form className="message-form" onSubmit={sendMessage}><button type="button" className="offer-toggle" onClick={() => setShowOffer((value) => !value)}>₹ Make offer</button><input aria-label="Message" value={body} onChange={(event) => setBody(event.target.value)} maxLength={1000} placeholder="Type a message…" /><button type="submit" disabled={sending || !body.trim()}>Send</button></form>
      </div>
    </div>
  );
}
