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

    const path=safePath(body.path);
    const content=String(body.content??'');
    if(!content.trim()) return json(400,{error:'The file is empty.'},headersCookie);
    if(Buffer.byteLength(content,'utf8')>900000) return json(413,{error:'File is too large to publish from the browser.'},headersCookie);
    const secret=strongSecret(content);
    if(secret) return json(400,{error:`Remove the detected ${secret} before publishing.`},headersCookie);

    const [owner,repo]=repository.split('/');
    const repoInfo=await gh(`/repos/${owner}/${repo}`,s.accessToken);
    const branch=String(body.branch||repoInfo.default_branch||'main').trim();
    const encoded=p=>p.split('/').map(encodeURIComponent).join('/');

    // A README can depend on its matching code file. This keeps the portfolio
    // hierarchy honest and prevents an orphan README from being published first.
    if(body.requirePath){
      const required=safePath(body.requirePath);
      try{
        await gh(`/repos/${owner}/${repo}/contents/${encoded(required)}?ref=${encodeURIComponent(branch)}`,s.accessToken);
      }catch(error){
        if(error.status===404) return json(400,{error:'Publish the code first.',requirePath:required},headersCookie);
        throw error;
      }
    }

    let current=null;
    try{
      current=await gh(`/repos/${owner}/${repo}/contents/${encoded(path)}?ref=${encodeURIComponent(branch)}`,s.accessToken);
    }catch(error){ if(error.status!==404) throw error; }

    // Learner portfolio files are create-once by design. Revisiting a lesson or
    // clicking Publish/README again must never create another commit or overwrite
    // completed work. Callers may also opt into create-only behavior explicitly.
    const createOnly=path.startsWith('student-code/') || body.createOnly===true;
    if(current&&createOnly){
      return json(200,{
        ok:true,
        alreadyExists:true,
        path,
        repository,
        commit:null,
        url:current.html_url||`https://github.com/${repository}/blob/${branch}/${path}`
      },headersCookie);
    }

    const message=String(body.message||`${current?'Update':'Add'} ${path} from CS & AI Mastery`).slice(0,200);
    const payload={message,content:Buffer.from(content,'utf8').toString('base64'),branch};
    if(current&&current.sha) payload.sha=current.sha;

    const saved=await gh(`/repos/${owner}/${repo}/contents/${encoded(path)}`,s.accessToken,{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    return json(200,{
      ok:true,
      alreadyExists:false,
      path,
      repository,
      commit:saved.commit?.sha||null,
      url:saved.content?.html_url||`https://github.com/${repository}/blob/${branch}/${path}`
    },headersCookie);
  }catch(error){ return json(error.status||500,{error:error.message||'GitHub publish failed.'}); }
};
