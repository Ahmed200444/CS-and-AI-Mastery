const {json,gh,session,csrfOk,strongSecret,safePath}=require('./_shared');

exports.handler=async(event)=>{
  if(event.httpMethod!=='POST')return json(405,{error:'Method not allowed.'});
  try{
    const got=await session(event),s=got.session,cookies=got.cookie?[got.cookie]:[];
    if(!s)return json(401,{error:'Connect GitHub first.'},cookies);
    if(!csrfOk(event,s))return json(403,{error:'Security check failed. Refresh the page and try again.'},cookies);

    let b={};
    try{b=JSON.parse(event.body||'{}');}catch(e){return json(400,{error:'Invalid JSON.'},cookies);}
    const owner=String(b.owner||''),repo=String(b.repo||''),branch=String(b.branch||'main'),path=safePath(b.path),content=String(b.content||'');
    if(!/^[A-Za-z0-9_.-]+$/.test(owner)||!/^[A-Za-z0-9_.-]+$/.test(repo))return json(400,{error:'Invalid repository.'},cookies);
    if(Buffer.byteLength(content,'utf8')>600000)return json(413,{error:'This code file is too large to sync.'},cookies);
    const secret=strongSecret(content);
    if(secret)return json(400,{error:`Sync blocked because the file appears to contain a ${secret}.`},cookies);

    const apiPath=`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;
    let existing=null;
    try{existing=await gh(`${apiPath}?ref=${encodeURIComponent(branch)}`,s.accessToken);}catch(e){if(e.status!==404)throw e;}

    if(existing&&existing.content){
      const old=Buffer.from(existing.content.replace(/\n/g,''),'base64').toString('utf8');
      if(old===content){
        return json(200,{ok:true,unchanged:true,commitUrl:null,path,contentSha:existing.sha||null},cookies);
      }
    }

    // If the browser previously published this draft, its base SHA is the user's
    // optimistic-lock token. Refuse to overwrite a newer remote edit silently.
    const baseSha=String(b.baseSha||'').trim();
    if(baseSha&&existing&&existing.sha&&baseSha!==existing.sha){
      return json(409,{
        error:'The GitHub file changed since your last publish. Review the remote version before publishing again.',
        path,
        expectedSha:baseSha,
        remoteSha:existing.sha,
        remoteUrl:existing.html_url||null
      },cookies);
    }
    if(baseSha&&!existing){
      return json(409,{
        error:'The GitHub file was removed since your last publish. Review the draft before recreating it.',
        path,
        expectedSha:baseSha,
        remoteSha:null
      },cookies);
    }

    const payload={
      message:String(b.message||`${existing?'Update':'Add'} ${path}`).slice(0,200),
      content:Buffer.from(content,'utf8').toString('base64'),
      branch
    };
    if(existing&&existing.sha)payload.sha=existing.sha;

    let result;
    try{
      result=await gh(apiPath,s.accessToken,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    }catch(e){
      // A concurrent write between our GET and PUT is a real conflict. Do not
      // refresh the SHA and overwrite it automatically.
      if(e.status===409){
        let latest=null;
        try{latest=await gh(`${apiPath}?ref=${encodeURIComponent(branch)}`,s.accessToken);}catch(readError){if(readError.status!==404)throw readError;}
        return json(409,{
          error:'The GitHub file changed while publishing. Review the remote version and retry.',
          path,
          expectedSha:existing&&existing.sha||null,
          remoteSha:latest&&latest.sha||null,
          remoteUrl:latest&&latest.html_url||null
        },cookies);
      }
      throw e;
    }

    return json(200,{
      ok:true,
      unchanged:false,
      path,
      contentSha:result.content&&result.content.sha||null,
      commitUrl:result.commit&&result.commit.html_url||null
    },cookies);
  }catch(e){return json(e.status||500,{error:e.message||'GitHub sync failed.'});}
};
