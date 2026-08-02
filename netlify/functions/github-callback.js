const crypto=require('crypto');
const {COOKIE,STATE_COOKIE,env,siteUrl,decrypt,cookies,cookie,redirect}=require('./_shared');
exports.handler=async(event)=>{
  try{
    const q=event.queryStringParameters||{}, saved=decrypt(cookies(event)[STATE_COOKIE]);
    if(!q.code||!q.state||!saved||saved.state!==q.state||Date.now()-saved.at>600000) throw new Error('GitHub authorization state was invalid or expired.');
    const body=new URLSearchParams({client_id:env('GITHUB_CLIENT_ID'),client_secret:env('GITHUB_CLIENT_SECRET'),code:q.code,redirect_uri:`${siteUrl()}/api/github/callback`});
    const r=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/x-www-form-urlencoded'},body});
    const d=await r.json(); if(!r.ok||d.error)throw new Error(d.error_description||d.error||'GitHub token exchange failed.');
    const sess={accessToken:d.access_token,refreshToken:d.refresh_token||null,expiresAt:Date.now()+((d.expires_in||28800)*1000),refreshExpiresAt:Date.now()+((d.refresh_token_expires_in||15897600)*1000),csrf:crypto.randomBytes(24).toString('hex')};
    return redirect(`${siteUrl()}/?github=connected#githubsync`,[cookie(COOKIE,require('./_shared').encrypt(sess),60*60*24*180),cookie(STATE_COOKIE,'',0)]);
  }catch(e){return redirect(`${siteUrl()}/?github=error#githubsync`,[cookie(STATE_COOKIE,'',0)]);}
};
