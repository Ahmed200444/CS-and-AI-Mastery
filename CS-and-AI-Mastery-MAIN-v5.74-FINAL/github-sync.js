const {env,json,gh,session}=require('./_shared');
exports.handler=async(event)=>{
  try{
    const got=await session(event), s=got.session;
    const headersCookie=got.cookie?[got.cookie]:[];
    const installUrl=process.env.GITHUB_APP_SLUG?`https://github.com/apps/${process.env.GITHUB_APP_SLUG}/installations/new`:null;
    if(!s)return json(200,{connected:false,installUrl,csrf:null},headersCookie);
    const user=await gh('/user',s.accessToken);
    const ins=await gh('/user/installations?per_page=100',s.accessToken);
    const repos=[];
    for(const inst of (ins.installations||[])){
      try{
        const r=await gh(`/user/installations/${inst.id}/repositories?per_page=100`,s.accessToken);
        for(const repo of (r.repositories||[]))if(repo.permissions&&repo.permissions.push)repos.push({id:repo.id,full_name:repo.full_name,private:repo.private,default_branch:repo.default_branch,installation_id:inst.id});
      }catch(e){}
    }
    repos.sort((a,b)=>a.full_name.localeCompare(b.full_name));
    return json(200,{connected:true,user:{login:user.login,avatar_url:user.avatar_url},repositories:repos,installUrl,csrf:s.csrf},headersCookie);
  }catch(e){return json(e.status||500,{error:e.message});}
};
