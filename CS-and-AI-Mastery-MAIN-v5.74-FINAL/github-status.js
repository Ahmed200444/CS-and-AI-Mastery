const crypto = require('crypto');
const COOKIE = 'csai_gh_session';
const STATE_COOKIE = 'csai_gh_state';
const API = '2026-03-10';

function env(name){ const v=process.env[name]; if(!v) throw new Error(`Missing environment variable: ${name}`); return v; }
function siteUrl(){ return (process.env.SITE_URL || process.env.URL || '').replace(/\/$/,''); }
function key(){ return crypto.createHash('sha256').update(env('SESSION_SECRET')).digest(); }
function b64url(buf){ return Buffer.from(buf).toString('base64url'); }
function encrypt(obj){
  const iv=crypto.randomBytes(12), cipher=crypto.createCipheriv('aes-256-gcm',key(),iv);
  const body=Buffer.concat([cipher.update(JSON.stringify(obj),'utf8'),cipher.final()]);
  return [b64url(iv),b64url(cipher.getAuthTag()),b64url(body)].join('.');
}
function decrypt(v){
  if(!v) return null;
  try{ const [i,t,b]=v.split('.').map(x=>Buffer.from(x,'base64url')); const d=crypto.createDecipheriv('aes-256-gcm',key(),i); d.setAuthTag(t); return JSON.parse(Buffer.concat([d.update(b),d.final()]).toString('utf8')); }catch(e){ return null; }
}
function cookies(event){
  const raw=(event.headers.cookie||event.headers.Cookie||''); const out={};
  raw.split(';').forEach(p=>{const i=p.indexOf('=');if(i>0)out[p.slice(0,i).trim()]=decodeURIComponent(p.slice(i+1).trim());}); return out;
}
function cookie(name,value,maxAge,httpOnly=true){
  let s=`${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax; Secure; Max-Age=${maxAge}`; if(httpOnly)s+='; HttpOnly'; return s;
}
function json(status,body,cookiesOut=[]){ const out={statusCode:status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},body:JSON.stringify(body)}; if(cookiesOut.length) out.multiValueHeaders={'Set-Cookie':cookiesOut}; return out; }
function redirect(url,cookiesOut=[]){ const out={statusCode:302,headers:{Location:url,'Cache-Control':'no-store'},body:''}; if(cookiesOut.length) out.multiValueHeaders={'Set-Cookie':cookiesOut}; return out; }
function originAllowed(event){ const allowed=siteUrl(); const o=event.headers.origin||event.headers.Origin||''; return !allowed || !o || o===allowed; }
function csrfOk(event,session){ return originAllowed(event) && !!session && !!session.csrf && (event.headers['x-csai-csrf']||event.headers['X-CSAI-CSRF'])===session.csrf; }
async function gh(path,token,options={}){
  const r=await fetch(`https://api.github.com${path}`,{...options,headers:{Accept:'application/vnd.github+json','Authorization':`Bearer ${token}`,'X-GitHub-Api-Version':API,'User-Agent':'CS-AI-Mastery',...(options.headers||{})}});
  const text=await r.text(); let data={}; try{data=text?JSON.parse(text):{};}catch(e){}
  if(!r.ok){ const err=new Error(data.message||`GitHub request failed (${r.status})`); err.status=r.status; throw err; }
  return data;
}
async function refreshSession(session){
  if(!session) return null;
  if((session.expiresAt||0) > Date.now()+60000) return session;
  if(!session.refreshToken) return null;
  const body=new URLSearchParams({client_id:env('GITHUB_CLIENT_ID'),client_secret:env('GITHUB_CLIENT_SECRET'),grant_type:'refresh_token',refresh_token:session.refreshToken});
  const r=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/x-www-form-urlencoded'},body});
  const d=await r.json(); if(!r.ok||d.error) throw new Error(d.error_description||d.error||'Could not refresh GitHub session.');
  return {...session,accessToken:d.access_token,refreshToken:d.refresh_token||session.refreshToken,expiresAt:Date.now()+((d.expires_in||28800)*1000),refreshExpiresAt:Date.now()+((d.refresh_token_expires_in||15897600)*1000)};
}
async function session(event){ const s=decrypt(cookies(event)[COOKIE]); if(!s)return {session:null,cookie:null}; const n=await refreshSession(s); return {session:n,cookie:n&&n!==s?cookie(COOKIE,encrypt(n),60*60*24*180):null}; }
function strongSecret(text){ const rules=[[/github_pat_[A-Za-z0-9_]{20,}/,'GitHub token'],[/gh[pousr]_[A-Za-z0-9]{20,}/,'GitHub token'],[/sk-[A-Za-z0-9_-]{20,}/,'API key'],[/AKIA[0-9A-Z]{16}/,'AWS access key'],[/AIza[0-9A-Za-z_-]{30,}/,'Google API key'],[/-----BEGIN [A-Z ]*PRIVATE KEY-----/,'private key']]; for(const [re,n] of rules)if(re.test(text))return n; return null; }
function safePath(p){ p=String(p||'').replace(/\\/g,'/').replace(/^\/+/, ''); if(!p||p.includes('..')||p.split('/').some(x=>!x||x==='.'||x==='..'))throw new Error('Invalid repository file path.'); return p; }
module.exports={COOKIE,STATE_COOKIE,env,siteUrl,encrypt,decrypt,cookies,cookie,json,redirect,csrfOk,gh,session,strongSecret,safePath};
