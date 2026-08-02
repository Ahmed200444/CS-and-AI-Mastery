const crypto=require('crypto');
const {STATE_COOKIE,env,siteUrl,encrypt,cookie,redirect}=require('./_shared');
exports.handler=async()=>{
  try{
    const state=crypto.randomBytes(24).toString('hex');
    const callback=`${siteUrl()}/api/github/callback`;
    const q=new URLSearchParams({client_id:env('GITHUB_CLIENT_ID'),redirect_uri:callback,state});
    return redirect(`https://github.com/login/oauth/authorize?${q}`,[cookie(STATE_COOKIE,encrypt({state,at:Date.now()}),600)]);
  }catch(e){return {statusCode:500,body:e.message};}
};
