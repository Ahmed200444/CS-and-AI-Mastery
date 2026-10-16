/* Footer links (About, Terms, Privacy, Support) and a one-time welcome card.
   Text is generic template wording rendered from assets/product-config.js — have it reviewed before you sell. */
(function(){
  'use strict';
  if(window.__csaiProductFooter)return;window.__csaiProductFooter=true;
  var C=window.CSAI_PRODUCT||{name:'CS & AI Mastery'},NAME=C.name||'CS & AI Mastery',OWNER=C.owner||'',MAIL=C.supportEmail||'',SITE=C.website||'';
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function theme(){var h=document.documentElement,b=document.body;return(h.getAttribute('data-theme')||(b&&b.getAttribute('data-theme'))||(b&&b.classList.contains('light')?'light':'dark'))==='light'?'light':'dark';}
  var who=OWNER?esc(OWNER):'the publisher';
  var contact=MAIL?'<a href="mailto:'+esc(MAIL)+'">'+esc(MAIL)+'</a>':'the publisher';
  var DOCS={
    about:{title:'About '+NAME,html:
      '<p>'+esc(NAME)+' is a hands-on learning platform for computer science and AI engineering: lessons, runnable examples, exercises, quizzes, projects and interview preparation, organised into guided paths.</p>'+
      '<p>Your progress and settings are saved in this browser, so you can pick up where you left off on this device.</p>'+
      (OWNER?'<p>Published by '+esc(OWNER)+'.</p>':'')+
      (SITE?'<p><a href="'+esc(SITE)+'" rel="noopener" target="_blank">'+esc(SITE.replace(/^https?:\/\//,''))+'</a></p>':'')},
    terms:{title:'Terms of use',html:
      '<p><strong>Licence.</strong> '+who.charAt(0).toUpperCase()+who.slice(1)+' grants you a personal, non-exclusive, non-transferable licence to use '+esc(NAME)+' for your own learning. You may not copy, resell, sublicense or redistribute the platform or its course content without written permission.</p>'+
      '<p><strong>Educational content.</strong> The material is provided for learning. It is not professional, legal or career advice, and no particular job, grade or outcome is promised.</p>'+
      '<p><strong>Third-party services.</strong> Some features rely on services you choose to use, such as GitHub or an AI provider, and on public content delivery networks that supply the in-browser code engines. Their own terms apply.</p>'+
      '<p><strong>No warranty.</strong> The platform is provided "as is", without warranties of any kind. To the extent the law allows, '+who+' is not liable for losses arising from its use. Features may change over time.</p>'+
      '<p><strong>Contact.</strong> Questions about these terms: '+contact+'.</p>'},
    privacy:{title:'Privacy',html:
      '<p><strong>Stored in your browser.</strong> Progress, notes, theme and similar settings are saved in this browser (local storage). They stay on your device and are not sent to '+who+'. Clearing site data removes them.</p>'+
      '<p><strong>No tracking.</strong> The platform does not include advertising or analytics scripts.</p>'+
      '<p><strong>Code engines.</strong> Python, SQL and C++ examples run in your browser. The engines are downloaded from public content delivery networks (for example jsDelivr or cdnjs), which can see your IP address when they serve those files.</p>'+
      '<p><strong>GitHub (optional).</strong> If GitHub publishing is enabled on this deployment and you connect your account, the platform uses your own GitHub sign-in to save the files you choose to the repository you select. Disconnect at any time from the GitHub bar.</p>'+
      '<p><strong>AI tutor (optional).</strong> If the tutor is enabled on this deployment, the question you ask and the text of the current lesson are sent through the site\'s server to the AI provider configured by the operator in order to produce an answer.</p>'+
      '<p><strong>Contact.</strong> Privacy questions: '+contact+'.</p>'}
  };
  var css=document.createElement('style');css.id='csai-product-footer-style';
  css.textContent='#csai-foot{margin:28px auto 0;padding:14px 16px 84px;max-width:980px;text-align:center;font:13px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;opacity:.85}'+
   '#csai-foot a,#csai-foot button{color:inherit;background:none;border:0;padding:2px 4px;font:inherit;text-decoration:underline;text-underline-offset:3px;cursor:pointer}'+
   '#csai-foot .sep{opacity:.5;margin:0 4px}'+
   'dialog.csai-doc{box-sizing:border-box;max-height:calc(100vh - 32px);overflow:auto;max-width:min(560px,calc(100vw - 32px));width:100%;border-radius:14px;padding:22px 24px;font:15px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;border:1px solid}'+
   'dialog.csai-doc.dark{background:#16202c;color:#e6edf5;border-color:#2b3a4b}dialog.csai-doc.light{background:#fff;color:#14243a;border-color:#dbe3ec}'+
   'dialog.csai-doc::backdrop{background:rgba(5,10,16,.6)}dialog.csai-doc h2{margin:0 0 10px;font-size:1.2rem}dialog.csai-doc p{margin:0 0 12px}dialog.csai-doc a{color:#4da3ff}dialog.csai-doc.light a{color:#1767e8}'+
   'dialog.csai-doc .close{margin-top:6px;padding:9px 16px;border-radius:9px;border:0;background:#1767e8;color:#fff;font:inherit;font-weight:600;cursor:pointer}'+
   '#csai-welcome{position:fixed;right:16px;bottom:calc(var(--csai-dock-h,56px) + 16px);z-index:80;max-width:min(360px,calc(100vw - 32px));padding:16px 18px;border-radius:14px;border:1px solid;font:14px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35)}'+
   '#csai-welcome.dark{background:#16202c;color:#e6edf5;border-color:#2b3a4b}#csai-welcome.light{background:#fff;color:#14243a;border-color:#dbe3ec}'+
   '#csai-welcome h2{margin:0 0 6px;font-size:1.05rem}#csai-welcome ul{margin:6px 0 12px;padding-left:18px}#csai-welcome button{padding:8px 14px;border-radius:9px;border:0;background:#1767e8;color:#fff;font:inherit;font-weight:600;cursor:pointer}';
  document.head.appendChild(css);
  function openDoc(key){
    var d=DOCS[key];if(!d)return;
    var dlg=document.createElement('dialog');dlg.className='csai-doc '+theme();dlg.setAttribute('aria-labelledby','csai-doc-title');
    dlg.innerHTML='<h2 id="csai-doc-title">'+esc(d.title)+'</h2>'+d.html+'<button type="button" class="close">Close</button>';
    dlg.addEventListener('close',function(){dlg.remove();});
    dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close();});
    dlg.querySelector('.close').addEventListener('click',function(){dlg.close();});
    document.body.appendChild(dlg);
    if(typeof dlg.showModal==='function')dlg.showModal();else dlg.setAttribute('open','');
  }
  function footer(){
    if(document.getElementById('csai-foot')||!document.body)return;
    var f=document.createElement('footer');f.id='csai-foot';
    var parts=['<span>&copy; '+new Date().getFullYear()+' '+esc(OWNER||NAME)+'</span>','<button type="button" data-doc="about">About</button>','<button type="button" data-doc="terms">Terms</button>','<button type="button" data-doc="privacy">Privacy</button>'];
    if(MAIL)parts.push('<a href="mailto:'+esc(MAIL)+'">Support</a>');
    f.innerHTML=parts.join('<span class="sep" aria-hidden="true">·</span>');
    f.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-doc]');if(b)openDoc(b.getAttribute('data-doc'));});
    document.body.appendChild(f);
  }
  function welcome(){
    if(C.welcome===false||document.getElementById('csai-welcome'))return;
    if(window.__csaiInCourse||/\/courses\//.test(location.pathname))return;
    try{if(localStorage.getItem('csai-welcome-v1'))return;}catch(e){}
    var w=document.createElement('aside');w.id='csai-welcome';w.className=theme();w.setAttribute('role','dialog');w.setAttribute('aria-labelledby','csai-welcome-title');
    w.innerHTML='<h2 id="csai-welcome-title">Welcome to '+esc(NAME)+'</h2><ul><li>Pick a course or a learning path to start.</li><li>Run the examples and exercises right in the page.</li><li>Your progress is saved in this browser.</li></ul><button type="button">Got it</button>';
    w.querySelector('button').addEventListener('click',function(){try{localStorage.setItem('csai-welcome-v1','1');}catch(e){}w.remove();});
    document.body.appendChild(w);
  }
  function init(){footer();setTimeout(welcome,1200);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
