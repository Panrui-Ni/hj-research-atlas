/**
 * HJ Atlas optional anonymous rating backend (Cloudflare Worker + D1).
 * Public-facing results never disclose voters, browser IDs, or IP hashes.
 * The service offers pseudonymous per-browser voting, NOT a guarantee of one vote per human.
 */
const DIMENSIONS = ['concept','method','technical','systematic','generality'];
const GRADES = ['very_high','high','moderate','low'];
const defaults = () => Object.fromEntries(DIMENSIONS.map(k=>[k,Object.fromEntries(GRADES.map(g=>[g,0]))]));
const reply = (data,status=200,origin='') => new Response(JSON.stringify(data),{
  status, headers:{'Content-Type':'application/json;charset=utf-8','Cache-Control':'no-store',
    ...(origin?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{})}
});
async function hmac(secret,text) {
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const sig=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(text)));
  return [...sig].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function stats(db,paperId){
  const result=await db.prepare('SELECT dimension,grade,COUNT(*) AS total FROM votes WHERE paper_id=? GROUP BY dimension,grade').bind(paperId).all();
  const dimensions=defaults();
  for(const r of result.results||[]){if(dimensions[r.dimension]&&Object.hasOwn(dimensions[r.dimension],r.grade)) dimensions[r.dimension][r.grade]=r.total;}
  return {paperId,dimensions,updatedAt:new Date().toISOString()};
}
async function verifyTurnstile(env,token,ip){
  const form=new FormData();form.append('secret',env.TURNSTILE_SECRET);form.append('response',token);
  if(ip)form.append('remoteip',ip);
  const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:form});
  if(!response.ok)return false;
  const data=await response.json();
  const allowedHostname=new URL(env.ALLOWED_ORIGIN).hostname;
  return Boolean(data.success&&data.hostname===allowedHostname);
}
export default {
  async fetch(request,env){
    const allow=(env.ALLOWED_ORIGIN||'').replace(/\/$/,'');
    const origin=request.headers.get('Origin')||'';
    if(!allow||!env.DB||!env.RATING_SECRET||!env.TURNSTILE_SECRET)return reply({error:'Server not configured'},503);
    const cors=origin===allow?origin:'';
    if(request.method==='OPTIONS') {
      if(!cors)return reply({error:'Origin denied'},403);
      return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':cors,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'86400','Vary':'Origin'}});
    }
    if(origin&&origin!==allow)return reply({error:'Origin denied'},403);
    const url=new URL(request.url);
    if(url.pathname!=='/votes')return reply({error:'Not found'},404,cors);
    if(request.method==='GET'){
      const paperId=url.searchParams.get('paperId')||'';
      if(!/^[a-z0-9][a-z0-9-]{0,79}$/.test(paperId))return reply({error:'Invalid paper ID'},400,cors);
      if(env.ALLOWED_PAPERS&& !env.ALLOWED_PAPERS.split(',').map(s=>s.trim()).includes(paperId))return reply({error:'Unknown paper'},404,cors);
      try{return reply(await stats(env.DB,paperId),200,cors);}catch{return reply({error:'Database unavailable'},503,cors);}
    }
    if(request.method!=='POST')return reply({error:'Method not allowed'},405,cors);
    if(!cors)return reply({error:'Origin required'},403);
    const textBody=await request.text();
    if(textBody.length>5000)return reply({error:'Payload too large'},413,cors);
    let body;try{body=JSON.parse(textBody);}catch{return reply({error:'Invalid JSON'},400,cors);}
    const {paperId,voterToken,scores,turnstileToken}=body||{};
    if(typeof paperId!=='string'||!/^[a-z0-9][a-z0-9-]{0,79}$/.test(paperId))return reply({error:'Invalid paper ID'},400,cors);
    if(env.ALLOWED_PAPERS&& !env.ALLOWED_PAPERS.split(',').map(s=>s.trim()).includes(paperId))return reply({error:'Unknown paper'},404,cors);
    if(typeof voterToken!=='string'|| !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(voterToken))return reply({error:'Invalid anonymous voter token'},400,cors);
    if(!scores||typeof scores!=='object'||Array.isArray(scores)||Object.keys(scores).some(k=>!DIMENSIONS.includes(k))||DIMENSIONS.some(k=>!Object.hasOwn(scores,k)|| !['',...GRADES].includes(scores[k]))||!DIMENSIONS.some(k=>GRADES.includes(scores[k])))return reply({error:'Invalid scores'},400,cors);
    if(typeof turnstileToken!=='string'||turnstileToken.length<10||turnstileToken.length>4096)return reply({error:'Anti-bot check required'},400,cors);
    const ip=request.headers.get('CF-Connecting-IP')||'';
    try {
      if(!await verifyTurnstile(env,turnstileToken,ip))return reply({error:'Anti-bot verification failed'},403,cors);
      const day=new Date().toISOString().slice(0,10);
      const ipHash=await hmac(env.RATING_SECRET,`limit:${day}:${ip}`);
      const used=await env.DB.prepare('SELECT writes FROM daily_limits WHERE day=? AND ip_hash=?').bind(day,ipHash).first();
      if(Number(used?.writes||0)>=Number(env.MAX_DAILY_WRITES||60))return reply({error:'Daily voting limit reached'},429,cors);
      const voterHash=await hmac(env.RATING_SECRET,`voter:${voterToken}`);
      const statements=[env.DB.prepare('INSERT INTO daily_limits(day,ip_hash,writes) VALUES(?,?,1) ON CONFLICT(day,ip_hash) DO UPDATE SET writes=writes+1').bind(day,ipHash)];
      for(const key of DIMENSIONS){
        if(scores[key]) statements.push(env.DB.prepare('INSERT INTO votes(paper_id,dimension,voter_hash,grade,updated_at) VALUES(?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(paper_id,dimension,voter_hash) DO UPDATE SET grade=excluded.grade,updated_at=CURRENT_TIMESTAMP').bind(paperId,key,voterHash,scores[key]));
        else statements.push(env.DB.prepare('DELETE FROM votes WHERE paper_id=? AND dimension=? AND voter_hash=?').bind(paperId,key,voterHash));
      }
      await env.DB.batch(statements);
      return reply(await stats(env.DB,paperId),200,cors);
    }catch{return reply({error:'Voting service temporarily unavailable'},503,cors);}
  }
};
