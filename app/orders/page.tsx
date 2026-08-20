import Link from "next/link";
import {requireChatGPTUser} from "../chatgpt-auth";
import {ensureStudentProfile} from "../../db/profiles";
import {getOrdersForUser} from "../../db/orders";
import OrdersManager from "./OrdersManager";

export const dynamic="force-dynamic";

export default async function OrdersPage(){const identity=await requireChatGPTUser("/orders");const profile=await ensureStudentProfile(identity);const orders=await getOrdersForUser(profile.id);return <main className="messages-page"><nav className="nav-shell messages-nav"><Link className="brand" href="/"><span className="brand-mark">C</span><span>Campus<span>Kart</span></span></Link><div><Link href="/dashboard">Dashboard</Link><Link href="/messages">Messages</Link><Link href="/assistant">AI Assistant</Link></div></nav><section className="orders-shell"><header><span className="dashboard-kicker">CAMPUS ORDERS</span><h1>Purchases &amp; sales</h1><p>Track every order from confirmation to a safe campus handoff.</p></header><OrdersManager initialOrders={orders}/></section></main>}
