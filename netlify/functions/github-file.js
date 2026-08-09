const {json,gh,session,csrfOk,strongSecret,safePath}=require('./_shared');

exports.handler=async(event)=>{
  try{
    if(event.httpMethod!=='POST') return json(405,{error:'Method not allowed.'});
    const got=await session(event), s=got.session;
    const headersCookie=got.cookie?[got.cookie]:[];
    if(!s) return json(401,{error:'Connect GitHub first.'},headersCookie);
    if(!csrfOk(event,s)) return json(403,{error:'Invalid or expired request.'},headersCookie);
    let body={};
    try{ body=JSON.parse(event.body||'{}'); }catch(e){ return json(400,{error:'Invalid JSON request.'},headersCookie); }
    const repository=String(body.repository||'').trim();
    if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) return json(400,{error:'Invalid repository.'},headersCookie);
    const path=safePath(body.path), content=String(body.content??'');
    const createOnly=body.createOnly===true || path.startsWith('student-code/');
    const requirePath=body.requirePath?safePath(body.requirePath):null;
    if(!content.trim()) return json(400,{error:'The file is empty.'},headersCookie);
    if(Buffer.byteLength(content,'utf8')>900000) return json(413,{error:'File is too large to publish from the browser.'},headersCookie);
    const secret=strongSecret(content); if(secret) return json(400,{error:`Remove the detected ${secret} before publishing.`},headersCookie);
    const [owner,repo]=repository.split('/');
    const repoInfo=await gh(`/repos/${owner}/${repo}`,s.accessToken);
    const branch=String(body.branch||repoInfo.default_branch||'main').trim();
    const encoded=p=>p.split('/').map(encodeURIComponent).join('/');
    if(requirePath){try{await gh(`/repos/${owner}/${repo}/contents/${encoded(requirePath)}?ref=${encodeURIComponent(branch)}`,s.accessToken);}catch(error){if(error.status===404)return json(400,{error:'Publish the code first.'},headersCookie);throw error;}}
    let sha=null,currentUrl=null;
    try{const current=await gh(`/repos/${owner}/${repo}/contents/${encoded(path)}?ref=${encodeURIComponent(branch)}`,s.accessToken);sha=current.sha;currentUrl=current.html_url||null;}catch(error){if(error.status!==404)throw error;}
    if(sha&&createOnly)return json(200,{ok:true,alreadyExists:true,path,repository,commit:null,url:currentUrl||`https://github.com/${repository}/blob/${branch}/${path}`},headersCookie);
    const message=String(body.message||`${sha?'Update':'Add'} ${path} from CS & AI Mastery`).slice(0,200);
    const payload={message,content:Buffer.from(content,'utf8').toString('base64'),branch};if(sha)payload.sha=sha;
    const saved=await gh(`/repos/${owner}/${repo}/contents/${encoded(path)}`,s.accessToken,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    return json(200,{ok:true,alreadyExists:false,path,repository,commit:saved.commit?.sha||null,url:saved.content?.html_url||`https://github.com/${repository}/blob/${branch}/${path}`},headersCookie);
  }catch(error){return json(error.status||500,{error:error.message||'GitHub publish failed.'});}
};
