const UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36";
const num=s=>{s=s.replace(/&nbsp;|,|\s/g,"").replace("%","");if(s===""||s==="-")return null;const n=parseFloat(s);return isNaN(n)?null:n;};
const strip=s=>s.replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/\+/g,"").trim();
export function parseQuarters(html){
  const i=html.indexOf('id="quarters"');if(i<0)return null;
  const t0=html.indexOf("<table",i),t1=html.indexOf("</table>",t0);if(t0<0)return null;
  const tbl=html.slice(t0,t1);
  const heads=[...tbl.slice(0,tbl.indexOf("</thead>")).matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map(m=>strip(m[1])).filter(Boolean);
  const body=tbl.slice(tbl.indexOf("<tbody"));
  const rows={};
  for(const r of body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)){
    const cells=[...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m=>m[1]);
    if(cells.length<2)continue;const label=strip(cells[0]);if(!label||label.startsWith("Raw"))continue;
    rows[label]=cells.slice(1,heads.length+1).map(c=>num(strip(c)));
  }
  const sub=html.slice(i,t0);
  const basis=/Consolidated Figures/.test(sub)?"Consolidated":"Standalone";
  const name=(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)||[])[1];
  const up=(html.match(/Upcoming result date:[\s\S]*?<strong>([\s\S]*?)<\/strong>/)||[])[1];
  return {quarters:heads,rows,basis,name:name?strip(name):null,upcoming:up?strip(up):null};
}
async function get(url){const r=await fetch(url,{headers:{"User-Agent":UA,"Accept":"text/html"},next:{revalidate:43200}});return r;}
export async function fetchCompany(sym){
  sym=sym.toUpperCase().replace(/[^A-Z0-9&\-]/g,"");if(!sym)return {error:"Enter a symbol"};
  for(const path of [`consolidated/`,``]){
    const url=`https://www.screener.in/company/${encodeURIComponent(sym)}/${path}`;
    const r=await get(url);if(r.status===404)return {error:`Unknown NSE symbol: ${sym}`};
    if(!r.ok)return {error:`Data source returned HTTP ${r.status}`};
    const d=parseQuarters(await r.text());
    if(d&&d.quarters.length&&Object.keys(d.rows).length){
      // consolidated page can be empty for standalone-only cos
      const firstKey=Object.keys(d.rows)[0];
      if(d.rows[firstKey].some(v=>v!==null))return {symbol:sym,url,...d};
    }
  }
  return {error:`No quarterly results found for ${sym}`};
}
