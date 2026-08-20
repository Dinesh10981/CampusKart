"use client";

import {useState} from "react";

type ChatMessage={role:"assistant"|"user";text:string};
const starters=["Find electronics under ₹1,000","Suggest a fair offer","How do I avoid scams?","Compare the cheapest options"];

export default function AssistantChat(){
  const [messages,setMessages]=useState<ChatMessage[]>([{role:"assistant",text:"Hi! I’m the CampusKart shopping assistant. Tell me what you need and your budget—I can recommend live listings, compare prices, draft an offer, or explain safe handoff steps."}]);
  const [input,setInput]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  async function ask(text:string){const question=text.trim();if(!question||busy)return;setMessages((current)=>[...current,{role:"user",text:question}]);setInput("");setBusy(true);setError("");const response=await fetch("/api/assistant",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({message:question})});const data=(await response.json()) as {reply?:string;error?:string};if(response.status===401){window.location.assign("/signin-with-chatgpt?return_to=%2Fassistant");return;}if(!response.ok||!data.reply)setError(data.error||"The assistant could not respond.");else setMessages((current)=>[...current,{role:"assistant",text:data.reply!}]);setBusy(false);}
  return <div className="assistant-console"><aside><div className="ai-orb">✦</div><span>CAMPUSKART AI</span><h2>Shop smarter on campus.</h2><p>Recommendations use active CampusKart listings and your budget.</p><div>{starters.map((starter)=><button key={starter} onClick={()=>ask(starter)}>{starter}</button>)}</div><small>AI guidance can be imperfect. Inspect every product before paying.</small></aside><section><div className="assistant-messages">{messages.map((message,index)=><article className={message.role} key={`${message.role}-${index}`}><span>{message.role==="assistant"?"✦":"You"}</span><p>{message.text}</p></article>)}{busy&&<article className="assistant thinking"><span>✦</span><p>Checking the marketplace…</p></article>}</div>{error&&<p className="assistant-error">{error}</p>}<form onSubmit={(event)=>{event.preventDefault();ask(input)}}><input value={input} onChange={(event)=>setInput(event.target.value)} maxLength={600} placeholder="Ask for products, price advice or a negotiation message…" aria-label="Message CampusKart AI"/><button type="submit" disabled={busy||input.trim().length<2}>Send</button></form></section></div>;
}
