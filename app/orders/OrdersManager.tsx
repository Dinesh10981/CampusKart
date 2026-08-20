"use client";

import Link from "next/link";
import { useState } from "react";

type Order={id:number;orderNumber:string;listingId:number;conversationId:number;amount:number;source:"buy_now"|"offer";status:"pending"|"confirmed"|"meetup_scheduled"|"completed"|"cancelled";createdAt:string;title:string;imageKey:string|null;pickupLocation:string;isBuyer:boolean;otherName:string};
const steps=["pending","confirmed","meetup_scheduled","completed"];

export default function OrdersManager({initialOrders}:{initialOrders:Order[]}) {
  const [orders,setOrders]=useState(initialOrders);
  const [message,setMessage]=useState("");
  async function act(id:number,action:"confirm"|"cancel") {
    setMessage("");
    const response=await fetch(`/api/orders/${id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({action})});
    const data=(await response.json()) as {error?:string};
    if(!response.ok){setMessage(data.error||"Unable to update order.");return;}
    setOrders((current)=>current.map((order)=>order.id===id?{...order,status:action==="confirm"?"confirmed":"cancelled"}:order));
  }
  const purchases=orders.filter((order)=>order.isBuyer);
  const sales=orders.filter((order)=>!order.isBuyer);
  return <>{message&&<p className="order-message">{message}</p>}<OrderSection title="My purchases" empty="You have not placed an order yet." orders={purchases} onAction={act}/><OrderSection title="My sales" empty="No students have ordered your listings yet." orders={sales} onAction={act}/></>;
}

function OrderSection({title,empty,orders,onAction}:{title:string;empty:string;orders:Order[];onAction:(id:number,action:"confirm"|"cancel")=>void}) {
  return <section className="order-section"><div className="order-section-title"><h2>{title}</h2><span>{orders.length} order{orders.length===1?"":"s"}</span></div>{orders.length?<div className="order-grid">{orders.map((order)=><article className="order-card" key={order.id}><header><div className="order-image" style={order.imageKey?{backgroundImage:`url(/api/listing-image?key=${encodeURIComponent(order.imageKey)})`}:undefined}>{!order.imageKey&&<span>📦</span>}</div><div><small>{order.orderNumber}</small><h3>{order.title}</h3><p>{order.isBuyer?`Seller: ${order.otherName}`:`Buyer: ${order.otherName}`}</p></div><strong>₹{order.amount.toLocaleString("en-IN")}</strong></header><div className={`order-progress ${order.status}`}>{steps.map((step,index)=><div className={order.status!=="cancelled"&&index<=Math.max(0,steps.indexOf(order.status))?"done":""} key={step}><i>{index+1}</i><span>{step.replace("_"," ")}</span></div>)}</div>{order.status==="cancelled"&&<p className="cancelled-order">This order was cancelled.</p>}<footer><Link href={`/messages/${order.conversationId}`}>Open chat</Link><Link href={`/listings/${order.listingId}`}>View item</Link>{!order.isBuyer&&order.status==="pending"&&<button onClick={()=>onAction(order.id,"confirm")}>Confirm order</button>}{order.status!=="completed"&&order.status!=="cancelled"&&<button className="quiet" onClick={()=>onAction(order.id,"cancel")}>Cancel</button>}</footer></article>)}</div>:<div className="empty-order"><span>🧾</span><p>{empty}</p><Link href="/">Browse marketplace</Link></div>}</section>;
}
