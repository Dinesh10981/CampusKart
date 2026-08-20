import Link from "next/link";
import { requireChatGPTUser } from "../chatgpt-auth";
import { ensureStudentProfile } from "../../db/profiles";
import { getConversationSummaries } from "../../db/chat";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const identity = await requireChatGPTUser("/messages");
  const profile = await ensureStudentProfile(identity);
  const conversations = await getConversationSummaries(profile.id);

  return (
    <main className="messages-page">
      <nav className="nav-shell messages-nav"><Link className="brand" href="/"><span className="brand-mark">C</span><span>Campus<span>Kart</span></span></Link><div><Link href="/dashboard">Dashboard</Link><Link href="/">Marketplace</Link></div></nav>
      <section className="inbox-shell">
        <header><span className="dashboard-kicker">BUYER–SELLER CHAT</span><h1>Your conversations</h1><p>Negotiate prices and arrange safe campus handoffs.</p></header>
        {conversations.length ? (
          <div className="conversation-list">
            {conversations.map((conversation) => (
              <Link href={`/messages/${conversation.id}`} className="conversation-row" key={conversation.id}>
                <div className="conversation-image" style={conversation.listing?.imageKey ? { backgroundImage:`url(/api/listing-image?key=${encodeURIComponent(conversation.listing.imageKey)})` } : undefined}>{!conversation.listing?.imageKey && <span>📦</span>}</div>
                <div className="conversation-summary"><div><strong>{conversation.otherUser?.displayName || "CampusKart student"}</strong>{conversation.unreadCount > 0 && <em>{conversation.unreadCount}</em>}</div><h2>{conversation.listing?.title || "Marketplace listing"}</h2><p>{conversation.lastMessage ? conversation.lastMessage.kind === "offer" ? `Offer: ₹${conversation.lastMessage.offerAmount?.toLocaleString("en-IN")}` : conversation.lastMessage.body : "Start the conversation"}</p></div>
                <div className="conversation-meta"><strong>₹{conversation.listing?.price.toLocaleString("en-IN")}</strong><span className={`listing-status-inline ${conversation.listing?.status}`}>{conversation.listing?.status}</span></div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="inbox-empty"><span>💬</span><h2>No conversations yet</h2><p>Open an active marketplace listing and select “Message seller” to begin.</p><Link href="/">Browse marketplace</Link></div>
        )}
      </section>
    </main>
  );
}
