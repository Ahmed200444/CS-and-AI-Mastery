const {json,gh,session,csrfOk,safePath}=require('./_shared');
exports.handler=async(event)=>{
  try{
    const got=await session(event),s=got.session,cookies=got.cookie?[got.cookie]:[];
    if(!s)return json(401,{error:'Connect GitHub first.'},cookies);
    if(!csrfOk(event,s))return json(403,{error:'Security check failed.'},cookies);
    let b={};try{b=JSON.parse(event.body||'{}');}catch(e){return json(400,{error:'Invalid JSON.'},cookies);}
    const owner=String(b.owner||''),repo=String(b.repo||''),branch=String(b.branch||'main'),path=safePath(b.path);
    const apiPath=`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;
    if(event.httpMethod==='DELETE'){
      let sha=b.sha||null;if(!sha){const x=await gh(`${apiPath}?ref=${encodeURIComponent(branch)}`,s.accessToken);sha=x.sha;}
      const result=await gh(apiPath,s.accessToken,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:`Delete ${path} from CS & AI Mastery`,sha,branch})});
      return json(200,{ok:true,commitUrl:result.commit&&result.commit.html_url||null},cookies);
    }
    if(event.httpMethod==='GET'){
      const x=await gh(`${apiPath}?ref=${encodeURIComponent(branch)}`,s.accessToken);return json(200,{ok:true,sha:x.sha,content:x.content?Buffer.from(x.content.replace(/\n/g,''),'base64').toString('utf8'):''},cookies);
    }
    return json(405,{error:'Method not allowed.'},cookies);
  }catch(e){return json(e.status||500,{error:e.message});}
};
