import Link from "next/link";
import { notFound } from "next/navigation";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { ensureStudentProfile } from "../../../db/profiles";
import { getMessagesForConversation } from "../../../db/chat";
import ChatRoom from "./ChatRoom";

export const dynamic = "force-dynamic";

async function ConversationContent({ id, returnTo }: { id: number; returnTo: string }) {
  const identity = await requireChatGPTUser(returnTo);
  const profile = await ensureStudentProfile(identity);
  const result = await getMessagesForConversation(id, profile.id);
  if (!result) notFound();

  return (
    <section className="chat-shell">
      <header className="chat-header">
        <Link href="/messages">←</Link>
        <div className="chat-product-image" style={result.conversation.listing.imageKey ? { backgroundImage:`url(/api/listing-image?key=${encodeURIComponent(result.conversation.listing.imageKey)})` } : undefined}>{!result.conversation.listing.imageKey && <span>📦</span>}</div>
        <div><span>{result.conversation.isBuyer ? "SELLER" : "BUYER"}</span><h1>{result.conversation.otherUser?.displayName || "CampusKart student"}</h1><p>{result.conversation.listing.title} · ₹{result.conversation.listing.price.toLocaleString("en-IN")}</p></div>
        <Link className="view-product-link" href={`/listings/${result.conversation.listing.id}`}>View product</Link>
      </header>
      <ChatRoom conversationId={id} currentUserId={profile.id} initialMessages={result.messages} listingPrice={result.conversation.listing.price} isBuyer={result.conversation.isBuyer} />
    </section>
  );
}

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) notFound();
  return <main className="chat-page"><ConversationContent id={id} returnTo={`/messages/${id}`} /></main>;
}
