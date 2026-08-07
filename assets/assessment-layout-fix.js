(function(){
'use strict';
var STYLE_ID='csai-assessment-layout-fix';
function addStyle(){
  if(document.getElementById(STYLE_ID))return;
  var s=document.createElement('style');
  s.id=STYLE_ID;
  s.textContent=`
    .assessment-fullwidth-grid{display:block!important;grid-template-columns:none!important;gap:0!important;margin-top:18px!important}
    .assessment-fullwidth-grid>.assessment-section{display:block!important;width:100%!important;max-width:none!important;margin:0!important}
    .assessment-fullwidth-grid>.assessment-section+ .assessment-section{margin-top:30px!important}
    .assessment-fullwidth-grid .oa-grid{grid-template-columns:minmax(280px,.72fr) minmax(520px,1.28fr)!important}
    .assessment-fullwidth-grid .oa-work{min-width:0!important;overflow:visible!important}
    .assessment-fullwidth-grid .oa-toolbar{display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:9px!important;padding:11px 12px!important;overflow:visible!important}
    .assessment-fullwidth-grid .oa-btn{flex:0 0 auto!important;white-space:nowrap!important}
    .assessment-fullwidth-grid .oa-btn.publish{margin-left:auto!important}
    .assessment-fullwidth-grid .gh-inline-msg{flex:1 1 100%!important;margin-top:2px!important}
    .assessment-fullwidth-grid .oa-editor{min-width:0!important;width:100%!important}
    .assessment-fullwidth-grid .quiz-list{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px!important}
    @media(max-width:980px){
      .assessment-fullwidth-grid .oa-grid{grid-template-columns:1fr!important}
      .assessment-fullwidth-grid .oa-prompt{border-right:0!important;border-bottom:1px solid var(--border)!important}
      .assessment-fullwidth-grid .quiz-list{grid-template-columns:1fr!important}
      .assessment-fullwidth-grid .oa-btn.publish{margin-left:0!important}
    }
    @media(max-width:620px){
      .assessment-fullwidth-grid>.assessment-section+ .assessment-section{margin-top:22px!important}
      .assessment-fullwidth-grid .oa-toolbar{display:grid!important;grid-template-columns:1fr 1fr!important}
      .assessment-fullwidth-grid .oa-btn{width:100%!important}
    }
  `;
  document.head.appendChild(s);
}
function apply(){
  addStyle();
  document.querySelectorAll('.assessment-section').forEach(function(section){
    var parent=section.parentElement;
    if(parent&&parent.classList.contains('grid'))parent.classList.add('assessment-fullwidth-grid');
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
new MutationObserver(function(){requestAnimationFrame(apply)}).observe(document.documentElement,{childList:true,subtree:true});
})();
