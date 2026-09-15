const {json,gh,session,csrfOk,strongSecret,safePath}=require('./_shared');
exports.handler=async(event)=>{
  if(event.httpMethod!=='POST')return json(405,{error:'Method not allowed.'});
  try{
    const got=await session(event), s=got.session, cookies=got.cookie?[got.cookie]:[];
    if(!s)return json(401,{error:'Connect GitHub first.'},cookies);
    if(!csrfOk(event,s))return json(403,{error:'Security check failed. Refresh the page and try again.'},cookies);
    let b={};try{b=JSON.parse(event.body||'{}');}catch(e){return json(400,{error:'Invalid JSON.'},cookies);}
    const owner=String(b.owner||''),repo=String(b.repo||''),branch=String(b.branch||'main'),path=safePath(b.path),content=String(b.content||'');
    if(!/^[A-Za-z0-9_.-]+$/.test(owner)||!/^[A-Za-z0-9_.-]+$/.test(repo))return json(400,{error:'Invalid repository.'},cookies);
    if(content.length>600000)return json(413,{error:'This code file is too large to sync.'},cookies);
    const secret=strongSecret(content);if(secret)return json(400,{error:`Sync blocked because the file appears to contain a ${secret}.`},cookies);
    const apiPath=`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;
    let existing=null;
    try{existing=await gh(`${apiPath}?ref=${encodeURIComponent(branch)}`,s.accessToken);}catch(e){if(e.status!==404)throw e;}
    if(existing&&existing.content){const old=Buffer.from(existing.content.replace(/\n/g,''),'base64').toString('utf8');if(old===content)return json(200,{ok:true,unchanged:true,commitUrl:null,path},cookies);}
    const payload={message:String(b.message||`Update ${path}`),content:Buffer.from(content,'utf8').toString('base64'),branch};if(existing&&existing.sha)payload.sha=existing.sha;
    let result;
    try{result=await gh(apiPath,s.accessToken,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});}catch(e){
      if(e.status===409){const latest=await gh(`${apiPath}?ref=${encodeURIComponent(branch)}`,s.accessToken);payload.sha=latest.sha;result=await gh(apiPath,s.accessToken,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});}else throw e;
    }
    return json(200,{ok:true,unchanged:false,path,commitUrl:result.commit&&result.commit.html_url||null},cookies);
  }catch(e){return json(e.status||500,{error:e.message});}
};
