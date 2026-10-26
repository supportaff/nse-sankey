export async function GET(req){
  const q=new URL(req.url).searchParams.get("q")||"";if(q.length<2)return Response.json([]);
  const r=await fetch(`https://www.screener.in/api/company/search/?q=${encodeURIComponent(q)}`,{headers:{"User-Agent":"Mozilla/5.0"},next:{revalidate:86400}});
  if(!r.ok)return Response.json([]);
  const j=await r.json();
  return Response.json(j.filter(x=>x.url).slice(0,8).map(x=>({name:x.name,symbol:x.url.split("/")[2]})).filter(x=>x.symbol&&!/^\d+$/.test(x.symbol)),{headers:{"Cache-Control":"s-maxage=86400"}});
}
