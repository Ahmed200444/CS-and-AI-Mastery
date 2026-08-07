(function(){
'use strict';
var KEY='cs-ai-mastery-theme';
var FLOAT_ID='csai-course-theme-floating';
var STYLE_ID='csai-course-theme-toggle-style';

function currentTheme(){
  var value='';
  try{ value=localStorage.getItem(KEY)||localStorage.getItem('theme')||''; }catch(e){}
  if(value!=='dark'&&value!=='light') value=document.documentElement.dataset.theme||'light';
  return value==='dark'?'dark':'light';
}

function fallbackApply(theme){
  var dark=theme==='dark';
  var html=document.documentElement;
  html.dataset.theme=theme;
  html.classList.toggle('dark',dark);
  html.classList.toggle('light',!dark);
  if(document.body){
    document.body.dataset.theme=theme;
    document.body.classList.toggle('dark',dark);
    document.body.classList.toggle('light',!dark);
  }
  try{
    localStorage.setItem(KEY,theme);
    localStorage.setItem('theme',theme);
  }catch(e){}
}

function applyTheme(theme){
  try{
    if(window.CSAIMasteryTheme&&typeof window.CSAIMasteryTheme.apply==='function'){
      window.CSAIMasteryTheme.apply(theme);
    }else{
      fallbackApply(theme);
    }
  }catch(error){
    console.warn('[CS AI Mastery] Theme helper failed; using fallback.',error);
    fallbackApply(theme);
  }
  updateLabels();
}

function labelFor(theme){ return theme==='dark'?'☀️ Light':'🌙 Dark'; }
function ariaFor(theme){ return theme==='dark'?'Switch to light mode':'Switch to dark mode'; }

function updateButton(button){
  if(!button)return;
  var theme=currentTheme();
  button.textContent=labelFor(theme);
  button.setAttribute('aria-label',ariaFor(theme));
  button.setAttribute('title',ariaFor(theme));
  button.setAttribute('aria-pressed',theme==='dark'?'true':'false');
}

function updateLabels(){
  document.querySelectorAll('[data-course-theme-toggle]').forEach(updateButton);
}

function toggleTheme(event){
  if(event){ event.preventDefault(); event.stopPropagation(); }
  applyTheme(currentTheme()==='dark'?'light':'dark');
}

function addStyle(){
  if(document.getElementById(STYLE_ID))return;
  var style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent='\n.dcv-top .dcv-theme-toggle{margin-left:auto;margin-right:auto;white-space:nowrap}\n#'+FLOAT_ID+'{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483200;border:1px solid #b8c7d6;border-radius:999px;padding:9px 14px;background:#fff;color:#17304b;font:800 14px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.12);cursor:pointer}\nhtml[data-theme="dark"] #'+FLOAT_ID+',body[data-theme="dark"] #'+FLOAT_ID+'{background:#111b25;color:#edf3f8;border-color:#455464}\n@media(max-width:720px){.dcv-top{display:grid!important;grid-template-columns:1fr auto 1fr!important;align-items:center!important}.dcv-top [data-dcv-back]{justify-self:start}.dcv-top .dcv-theme-toggle{justify-self:center;margin:0!important}.dcv-top [data-dcv-home]{justify-self:end}.dcv-top .dcv-btn{width:auto!important;flex:none!important}#'+FLOAT_ID+'{top:10px}}\n';
  document.head.appendChild(style);
}

function makeButton(className){
  var button=document.createElement('button');
  button.type='button';
  button.className=className||'';
  button.setAttribute('data-course-theme-toggle','');
  button.addEventListener('click',toggleTheme);
  updateButton(button);
  return button;
}

function ensureDirectViewer(){
  var direct=document.getElementById('csai-direct-course-view');
  var top=direct&&direct.querySelector('.dcv-top');
  if(!top)return false;
  var floating=document.getElementById(FLOAT_ID);
  if(floating)floating.remove();
  var button=top.querySelector('[data-course-theme-toggle]');
  if(!button){
    button=makeButton('dcv-btn dcv-theme-toggle');
    var home=top.querySelector('[data-dcv-home]');
    if(home)top.insertBefore(button,home); else top.appendChild(button);
  }
  updateButton(button);
  return true;
}

function currentTrackContainer(){
  var route='';
  try{route=String(location.hash||'').replace(/^#/,'');}catch(e){}
  if(!route||route==='hub'||route==='courses')return null;
  var registry=window.TRACK_REGISTRY;
  var entry=registry&&registry[route];
  return entry?document.getElementById(entry.containerId):null;
}

function ensureLegacyCourse(){
  if(ensureDirectViewer())return;
  var existing=document.getElementById(FLOAT_ID);
  var container=currentTrackContainer();
  if(!container){ if(existing)existing.remove(); return; }
  var style=getComputedStyle(container);
  if(container.hidden||style.display==='none'||style.visibility==='hidden'){ if(existing)existing.remove(); return; }
  if(!existing){
    existing=makeButton('');
    existing.id=FLOAT_ID;
    document.body.appendChild(existing);
  }
  updateButton(existing);
}

function scan(){ addStyle(); ensureLegacyCourse(); updateLabels(); }

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan);else scan();
new MutationObserver(function(){ requestAnimationFrame(scan); }).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['data-theme']});
window.addEventListener('hashchange',function(){setTimeout(scan,0)});
window.addEventListener('storage',function(event){if(event.key===KEY||event.key==='theme')scan()});
})();
