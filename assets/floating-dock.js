(function(){
'use strict';
// One bottom dock for the three floating controls (Tutor, GitHub status, theme toggle) so they sit in a
// reserved strip instead of floating over lesson text. Existing scripts keep working: they look their
// elements up by id, and this script only re-parents the nodes and restyles them.
var DOCK_ID='csai-dock';
function controls(){
  return [
    document.getElementById('ct-open'),
    document.getElementById('csai-ghbar'),
    document.getElementById('g-theme-toggle')||document.querySelector('button.theme[data-theme-toggle], button.theme')
  ].filter(Boolean);
}
function addStyle(){
  if(document.getElementById('csai-dock-style'))return;
  var s=document.createElement('style');s.id='csai-dock-style';
  s.textContent=
'#'+DOCK_ID+'{position:fixed;left:var(--csai-dock-left,0px);right:0;bottom:0;z-index:9998;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 14px calc(8px + env(safe-area-inset-bottom,0px));background:rgba(255,255,255,.94);border-top:1px solid rgba(23,34,49,.12);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}'+
'html[data-theme="dark"] #'+DOCK_ID+', body[data-theme="dark"] #'+DOCK_ID+'{background:rgba(15,23,32,.94);border-top-color:rgba(255,255,255,.12)}'+
'#'+DOCK_ID+'>*{position:static!important;transform:none!important;left:auto!important;right:auto!important;bottom:auto!important;margin:0!important;max-width:100%;box-shadow:none!important}'+
'#'+DOCK_ID+'>#csai-ghbar{flex:1 1 0;justify-content:center;min-width:0;border:0!important;background:transparent!important;padding:0!important}#'+DOCK_ID+' #csai-ghbar .status{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
'#'+DOCK_ID+'>#ct-open,#'+DOCK_ID+'>#g-theme-toggle,#'+DOCK_ID+'>.theme{flex:0 0 auto}'+
'html.csai-has-dock body{padding-bottom:calc(var(--csai-dock-h,56px) + 12px)!important}'+
'@media(max-width:700px){#'+DOCK_ID+'{flex-wrap:wrap;gap:8px;padding:6px 10px calc(6px + env(safe-area-inset-bottom,0px))}#'+DOCK_ID+'>#csai-ghbar:has(input,select){order:3;flex:1 1 100%}}';
  document.head.appendChild(s);
}
function sideOffset(dock){
  var side=document.querySelector('.av4-side');
  var w=0;
  if(side){var cs=getComputedStyle(side);if(cs.display!=='none'&&cs.position==='fixed'){var r=side.getBoundingClientRect();if(r.left<=0&&r.width<window.innerWidth*0.6)w=Math.round(r.right);}}
  dock.style.setProperty('--csai-dock-left',w+'px');
}
var dock=null,queued=false;
function adopt(){
  queued=false;
  var list=controls();
  if(!list.length)return;
  addStyle();
  if(!dock||!document.body.contains(dock)){
    dock=document.getElementById(DOCK_ID);
    if(!dock){dock=document.createElement('div');dock.id=DOCK_ID;dock.setAttribute('role','toolbar');dock.setAttribute('aria-label','Quick tools');document.body.appendChild(dock);}
    document.documentElement.classList.add('csai-has-dock');
    if(window.ResizeObserver)new ResizeObserver(function(){document.documentElement.style.setProperty('--csai-dock-h',dock.offsetHeight+'px');sideOffset(dock);}).observe(dock);
  }
  var inOrder=list.every(function(el,i){return dock.children[i]===el;});
  if(!inOrder)list.forEach(function(el){dock.appendChild(el);});
  sideOffset(dock);
}
function schedule(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(adopt);}
function boot(){
  adopt();
  new MutationObserver(function(rs){for(var i=0;i<rs.length;i++){if(rs[i].addedNodes.length){schedule();return;}}}).observe(document.body,{childList:true});
  window.addEventListener('resize',schedule);
  setTimeout(adopt,600);setTimeout(adopt,1800);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
