/* Optional services: GitHub sync and the AI tutor need a server (Netlify functions or the local launcher).
   On static hosting or the single HTML file they do not exist, so their controls are hidden instead of broken.
   Sets window.CSAI_SERVICES = {github, tutor} (true/false once checked) and html.csai-no-github / html.csai-no-tutor. */
(function(){
  if(window.CSAI_SERVICES)return;
  var root=document.documentElement,S=window.CSAI_SERVICES={github:null,tutor:null};
  var st=document.createElement('style');st.id='csai-optional-services-style';
  st.textContent='html.csai-svc-pending #csai-ghbar,html.csai-svc-pending #ct-open,html.csai-no-github #csai-ghbar,html.csai-no-github .oa-btn.publish,html.csai-no-github .project-btn.publish,html.csai-no-github .csai-clean-publish,html.csai-no-github .csai-final-publish-status,html.csai-no-github .gh-inline-msg,html.csai-no-tutor #ct-open,html.csai-no-tutor #csai-tutor{display:none!important}';
  (document.head||root).appendChild(st);
  root.classList.add('csai-svc-pending');
  function done(name,ok){
    S[name]=!!ok;root.classList.toggle('csai-no-'+name,!ok);
    if(S.github!==null&&S.tutor!==null){root.classList.remove('csai-svc-pending');try{document.dispatchEvent(new CustomEvent('csai:services',{detail:S}));}catch(e){}}
  }
  function probe(url,opts,test,name){
    var ctl=typeof AbortController==='function'?new AbortController():null,t=setTimeout(function(){if(ctl)ctl.abort();},4000);
    opts=opts||{};if(ctl)opts.signal=ctl.signal;
    fetch(url,opts).then(function(r){
      clearTimeout(t);
      var json=/json/i.test(r.headers.get('content-type')||'');
      if(!json)return done(name,false);
      return r.json().then(function(d){done(name,test(r,d));},function(){done(name,false);});
    }).catch(function(){clearTimeout(t);done(name,false);});
  }
  /* GitHub is usable when the status endpoint answers and a GitHub App (or the local gh login) is configured. */
  probe('/api/github/status',{credentials:'same-origin'},function(r,d){return r.ok&&d&&typeof d==='object'&&(d.connected===true||!!d.installUrl||d.local===true);},'github');
  /* The tutor function answers 405 to GET when it exists; static hosts answer 404 or HTML. */
  probe('/api/tutor',{method:'GET'},function(r){return r.status===405;},'tutor');
})();
