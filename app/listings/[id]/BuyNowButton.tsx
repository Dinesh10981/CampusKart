"use client";

import { useState } from "react";

export default function BuyNowButton({listingId,disabled}:{listingId:number;disabled:boolean}) {
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  async function placeOrder() {
    setBusy(true); setError("");
    const response=await fetch("/api/orders",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({listingId})});
    const data=(await response.json()) as {error?:string};
    if(response.status===401){window.location.assign(`/signin-with-chatgpt?return_to=${encodeURIComponent(`/listings/${listingId}`)}`);return;}
    if(!response.ok){setError(data.error||"Unable to place order.");setBusy(false);return;}
    window.location.assign("/orders");
  }
  return <div className="buy-now-control"><button type="button" onClick={placeOrder} disabled={disabled||busy}>{busy?"Placing order…":disabled?"Currently unavailable":"Buy now · Pay at meetup"}</button>{error&&<small>{error}</small>}</div>;
}
