import Link from "next/link";
import {requireChatGPTUser} from "../chatgpt-auth";
import AssistantChat from "./AssistantChat";

export const dynamic="force-dynamic";

export default async function AssistantPage(){await requireChatGPTUser("/assistant");return <main className="assistant-page"><nav className="nav-shell messages-nav"><Link className="brand" href="/"><span className="brand-mark">C</span><span>Campus<span>Kart</span></span></Link><div><Link href="/orders">Orders</Link><Link href="/messages">Messages</Link><Link href="/dashboard">Dashboard</Link></div></nav><section className="assistant-shell"><header><span className="dashboard-kicker">PERSONAL SHOPPING GUIDE</span><h1>CampusKart AI Assistant</h1><p>Discover better matches, negotiate fairly and trade more safely.</p></header><AssistantChat/></section></main>}
