import {fetchCompany} from "../../../lib/screener";
export const revalidate=43200;
export async function GET(req){
  const s=new URL(req.url).searchParams.get("symbol")||"";
  try{const d=await fetchCompany(s);
    return Response.json(d,{status:d.error?404:200,headers:{"Cache-Control":d.error?"s-maxage=600":"s-maxage=43200, stale-while-revalidate=86400"}});
  }catch(e){return Response.json({error:"Fetch failed: "+e.message},{status:502});}
}
