"use client";
import {useEffect,useRef,useState} from "react";
const C={rev:"#4c8bf5",cost:"#e5534b",profit:"#3fb950",grey:"#8b949e"};
const A=(h,a)=>{const n=parseInt(h.slice(1),16);return `rgba(${n>>16},${(n>>8)&255},${n&255},${a})`;};
const pick=(rows,keys)=>{for(const k of keys)if(rows[k])return {k,v:rows[k]};return null;};
const fmt=v=>v==null?"–":"₹"+Math.round(v).toLocaleString("en-IN")+" cr";
const pct=(a,b)=>a==null||b==null||b===0?null:((a-b)/Math.abs(b))*100;
const pf=p=>p==null?"":` (${p>=0?"+":""}${p.toFixed(0)}% YoY)`;
function lines(d,i){
  const r=d.rows,g=(keys)=>{const p=pick(r,keys);return p?{label:p.k,v:p.v[i],y:i>=4?p.v[i-4]:null,q:i>=1?p.v[i-1]:null}:null;};
  return {rev:g(["Sales","Revenue"]),exp:g(["Expenses"]),int:g(["Interest"]),op:g(["Operating Profit","Financing Profit"]),
    oi:g(["Other Income"]),dep:g(["Depreciation"]),pbt:g(["Profit before tax"]),np:g(["Net Profit"]),bank:!!r["Financing Profit"]};
}
function build(L){
  const nodes=[],cols=[],src=[],tgt=[],val=[],lc=[];
  const node=(label,c,it)=>{nodes.push(label+(it&&it.v!=null?`<br>${fmt(it.v)}${pf(pct(it.v,it.y))}`:""));cols.push(c);return nodes.length-1;};
  const link=(a,b,v,c)=>{if(v>0.5){src.push(a);tgt.push(b);val.push(v);lc.push(A(c,.45));}};
  const ok=x=>x&&x.v!=null;
  if(!ok(L.rev)||!ok(L.np))return null;
  const v=x=>ok(x)?x.v:0;
  const tax=ok(L.pbt)?L.pbt.v-L.np.v:null;
  const staged=!L.bank&&ok(L.op)&&L.op.v>0&&ok(L.pbt)&&L.pbt.v>0&&L.np.v>0;
  if(staged){
    const R=node("Revenue",C.rev,L.rev),E=ok(L.exp)?node("Operating expenses",C.cost,L.exp):null,O=node("Operating profit (EBITDA)",C.profit,L.op);
    if(E!=null)link(R,E,L.exp.v,C.cost);link(R,O,L.op.v,C.profit);
    const P=node("Profit before tax",C.profit,L.pbt);
    if(ok(L.oi)&&L.oi.v>0){const I=node("Other income",C.profit,L.oi);link(I,P,L.oi.v,C.profit);}
    if(ok(L.int)&&L.int.v>0){link(O,node("Interest",C.cost,L.int),L.int.v,C.cost);}
    if(ok(L.dep)&&L.dep.v>0){link(O,node("Depreciation",C.cost,L.dep),L.dep.v,C.cost);}
    const diff=L.pbt.v-(L.op.v+Math.max(v(L.oi),0)-Math.max(v(L.int),0)-Math.max(v(L.dep),0));
    const toP=L.op.v-Math.max(v(L.int),0)-Math.max(v(L.dep),0);
    if(diff<-1){link(O,node("Exceptional / other (net)",C.cost,{v:-diff}),-diff,C.cost);link(O,P,toP+diff,C.profit);}
    else{link(O,P,toP,C.profit);if(diff>1)link(node("Exceptional / other (net)",C.profit,{v:diff}),P,diff,C.profit);}
    const N=node("Net profit",C.profit,L.np);
    if(tax>0){link(P,node("Tax & other",C.cost,{v:tax}),tax,C.cost);link(P,N,L.np.v,C.profit);}
    else{link(P,N,L.pbt.v,C.profit);if(tax<-1)link(node("Associates / other",C.profit,{v:-tax}),N,-tax,C.profit);}
  }else{
    const T=node("Total income",C.rev,null);
    link(node(L.bank?"Revenue (interest earned)":"Revenue",C.rev,L.rev),T,L.rev.v,C.rev);
    if(ok(L.oi)&&L.oi.v>0)link(node("Other income",C.rev,L.oi),T,L.oi.v,C.rev);
    if(ok(L.int)&&L.int.v>0)link(T,node(L.bank?"Interest expended":"Interest",C.cost,L.int),L.int.v,C.cost);
    if(ok(L.exp)&&L.exp.v>0)link(T,node(L.bank?"Opex & provisions":"Expenses",C.cost,L.exp),L.exp.v,C.cost);
    if(ok(L.dep)&&L.dep.v>0)link(T,node("Depreciation",C.cost,L.dep),L.dep.v,C.cost);
    const inTot=L.rev.v+Math.max(v(L.oi),0),outCost=Math.max(v(L.int),0)+Math.max(v(L.exp),0)+Math.max(v(L.dep),0);
    const pbt=ok(L.pbt)?L.pbt.v:inTot-outCost;const gap=inTot-outCost-pbt;
    if(gap>1)link(T,node("Exceptional / other (net)",C.cost,{v:gap}),gap,C.cost);
    if(pbt>0){const P=node("Profit before tax",C.profit,L.pbt);link(T,P,pbt,C.profit);
      if(L.np.v>0){const N=node("Net profit",C.profit,L.np);if(tax>0){link(P,node("Tax & other",C.cost,{v:tax}),tax,C.cost);link(P,N,L.np.v,C.profit);}else{link(P,N,pbt,C.profit);if(tax<-1)link(node("Associates / other",C.profit,{v:-tax}),N,-tax,C.profit);}}
      else{link(P,node("Tax & other",C.cost,{v:tax}),pbt,C.cost);}
    }else{link(node("Pre-tax loss",C.cost,{v:-pbt}),T,-pbt-(gap<-1?0:0),C.cost);}
    if(gap<-1)link(node("Exceptional / other (net)",C.profit,{v:-gap}),T,-gap,C.profit);
  }
  return {nodes,cols,src,tgt,val,lc};
}
const EX=["ITC","TCS","RELIANCE","HDFCBANK","INFY","ICICIBANK","TATAMOTORS","HINDUNILVR"];
export default function Page(){
  const [sym,setSym]=useState("ITC"),[q,setQ]=useState("ITC"),[d,setD]=useState(null),[err,setErr]=useState(""),[load,setLoad]=useState(false),[qi,setQi]=useState(-1),[sug,setSug]=useState([]);
  const ref=useRef(null);
  useEffect(()=>{const p=new URLSearchParams(location.search).get("symbol");if(p){setSym(p.toUpperCase());setQ(p.toUpperCase());}},[]);
  useEffect(()=>{if(!sym)return;setLoad(true);setErr("");fetch("/api/results?symbol="+encodeURIComponent(sym)).then(r=>r.json()).then(j=>{if(j.error){setErr(j.error);setD(null);}else{setD(j);setQi(j.quarters.length-1);}history.replaceState(null,"","?symbol="+sym);}).catch(e=>setErr(String(e))).finally(()=>setLoad(false));},[sym]);
  useEffect(()=>{if(q.length<2||q===sym){setSug([]);return;}const t=setTimeout(()=>fetch("/api/search?q="+encodeURIComponent(q)).then(r=>r.json()).then(setSug).catch(()=>{}),250);return()=>clearTimeout(t);},[q]);
  const L=d&&qi>=0?lines(d,qi):null;const S=L?build(L):null;
  const mobile=typeof window!=="undefined"&&window.innerWidth<700;
  useEffect(()=>{let tries=0;const draw=()=>{if(!window.Plotly){if(tries++<50)setTimeout(draw,200);return;}if(!S||!ref.current)return;
    const qn=d.quarters[qi];
    window.Plotly.react(ref.current,[{type:"sankey",arrangement:"snap",valueformat:",.0f",valuesuffix:" cr",
      node:{label:S.nodes,color:S.cols,pad:16,thickness:16,line:{width:0}},link:{source:S.src,target:S.tgt,value:S.val,color:S.lc}}],
      {title:{text:`<b>${d.name||d.symbol}</b> — Quarter ended ${qn} (${d.basis}, ₹ crore)`,font:{size:mobile?13:17}},font:{color:"#e6e9ef",size:mobile?9:12},paper_bgcolor:"#161b26",
       margin:{l:10,r:10,t:50,b:40},height:mobile?560:620,
       annotations:[{x:0,y:-0.06,xref:"paper",yref:"paper",showarrow:false,font:{size:10,color:"#8b949e"},text:`Source: Screener.in quarterly results (${d.basis.toLowerCase()}) · Tax = PBT − Net profit · nse-sankey`}]},
      {responsive:true,displaylogo:false});};draw();},[d,qi]);
  const dl=()=>window.Plotly&&window.Plotly.downloadImage(ref.current,{format:"png",width:1600,height:900,scale:1,filename:`${d.symbol}_${d.quarters[qi].replace(" ","_")}_sankey`});
  const go=s=>{s=s.trim().toUpperCase();if(s){setSym(s);setQ(s);setSug([]);}};
  const rowsT=L?[["Revenue",L.rev],["Expenses",L.exp],[L.bank?"Financing profit":"Operating profit",L.op],["Other income",L.oi],["Interest",L.int],["Depreciation",L.dep],["Profit before tax",L.pbt],["Net profit",L.np]].filter(x=>x[1]):[];
  const cell={padding:"6px 10px",borderBottom:"1px solid #263042",textAlign:"right"};
  const chg=p=>p==null?"–":<span style={{color:p>=0?C.profit:C.cost}}>{p>=0?"+":""}{p.toFixed(1)}%</span>;
  return <main style={{maxWidth:1200,margin:"0 auto",padding:16}}>
    <h1 style={{fontSize:24,margin:"8px 0"}}>NSE Results → Sankey</h1>
    <p style={{color:"#8b949e",marginTop:0}}>Type any NSE symbol to see its quarterly results flow from revenue to net profit.</p>
    <form onSubmit={e=>{e.preventDefault();go(q);}} style={{display:"flex",gap:8,position:"relative",flexWrap:"wrap"}}>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="e.g. ITC, TCS, RELIANCE" style={{flex:"1 1 220px",padding:"10px 12px",fontSize:16,borderRadius:8,border:"1px solid #30363d",background:"#0b0f17",color:"#fff"}}/>
      <button style={{padding:"10px 18px",borderRadius:8,border:0,background:C.rev,color:"#fff",fontSize:16}}>Show</button>
      {sug.length>0&&<div style={{position:"absolute",top:46,left:0,right:0,background:"#161b26",border:"1px solid #30363d",borderRadius:8,zIndex:5}}>
        {sug.map(s=><div key={s.symbol} onClick={()=>go(s.symbol)} style={{padding:"8px 12px",cursor:"pointer"}}><b>{s.symbol}</b> <span style={{color:"#8b949e"}}>{s.name}</span></div>)}</div>}
    </form>
    <div style={{display:"flex",gap:6,flexWrap:"wrap",margin:"10px 0"}}>{EX.map(x=><button key={x} onClick={()=>go(x)} style={{padding:"4px 10px",borderRadius:16,border:"1px solid #30363d",background:x===sym?"#263042":"transparent",color:"#cdd5e0",cursor:"pointer"}}>{x}</button>)}</div>
    {load&&<p>Loading {sym}…</p>}
    {err&&<p style={{color:C.cost,background:"#2a1414",padding:10,borderRadius:8}}>{err}</p>}
    {d&&!err&&<>
      <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",margin:"8px 0"}}>
        <label>Quarter: <select value={qi} onChange={e=>setQi(+e.target.value)} style={{padding:6,borderRadius:6,background:"#0b0f17",color:"#fff",border:"1px solid #30363d"}}>
          {d.quarters.map((x,i)=><option key={i} value={i}>{x}</option>).reverse()}</select></label>
        <button onClick={dl} style={{padding:"6px 14px",borderRadius:8,border:"1px solid #3fb950",background:"transparent",color:"#3fb950",cursor:"pointer"}}>Download PNG</button>
        {d.upcoming&&<span style={{color:"#8b949e"}}>Next results: {d.upcoming}</span>}
      </div>
      {S?<div id="chart" ref={ref} style={{width:"100%",borderRadius:10,overflow:"hidden"}}/>:<p>Not enough line items to draw a Sankey for this quarter.</p>}
      <div style={{overflowX:"auto"}}><table style={{borderCollapse:"collapse",width:"100%",marginTop:14,fontSize:14}}>
        <thead><tr><th style={{...cell,textAlign:"left"}}>₹ crore</th><th style={cell}>{d.quarters[qi]}</th><th style={cell}>QoQ</th><th style={cell}>YoY</th></tr></thead>
        <tbody>{rowsT.map(([n,x])=><tr key={n}><td style={{...cell,textAlign:"left"}}>{n}</td><td style={cell}>{x.v==null?"–":Math.round(x.v).toLocaleString("en-IN")}</td><td style={cell}>{chg(pct(x.v,x.q))}</td><td style={cell}>{chg(pct(x.v,x.y))}</td></tr>)}</tbody></table></div>
      <p style={{color:"#8b949e",fontSize:12}}>Source: <a style={{color:"#8b949e"}} href={d.url}>{d.url}</a> ({d.basis}). Figures as published by Screener.in, refreshed every 12h. Tax is derived as PBT − Net profit; for banks, "Expenses" includes provisions. Not investment advice.</p>
    </>}
  </main>;
}
