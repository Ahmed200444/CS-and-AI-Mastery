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
  updateButton(document.getElementById(FLOAT_ID));
}

function labelFor(theme){ return theme==='dark'?'☀️ Light':'🌙 Dark'; }
function ariaFor(theme){ return theme==='dark'?'Switch to light mode':'Switch to dark mode'; }

function updateButton(button){
  if(!button)return;
  var theme=currentTheme();
  var label=labelFor(theme);
  var aria=ariaFor(theme);
  if(button.textContent!==label)button.textContent=label;
  button.setAttribute('aria-label',aria);
  button.setAttribute('title',aria);
  button.setAttribute('aria-pressed',theme==='dark'?'true':'false');
}

function toggleTheme(event){
  if(event){ event.preventDefault(); event.stopPropagation(); }
  applyTheme(currentTheme()==='dark'?'light':'dark');
}

function addStyle(){
  if(document.getElementById(STYLE_ID))return;
  var style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent='\n#'+FLOAT_ID+'{position:fixed!important;right:22px!important;bottom:22px!important;left:auto!important;top:auto!important;transform:none!important;z-index:2147483200!important;border:1px solid #b8c7d6!important;border-radius:999px!important;padding:10px 16px!important;background:#fff!important;color:#17304b!important;font:800 14px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;box-shadow:0 8px 24px rgba(0,0,0,.16)!important;cursor:pointer!important;white-space:nowrap!important}\nhtml[data-theme="dark"] #'+FLOAT_ID+',body[data-theme="dark"] #'+FLOAT_ID+'{background:#111b25!important;color:#edf3f8!important;border-color:#455464!important}\n@media(max-width:720px){#'+FLOAT_ID+'{right:14px!important;bottom:14px!important;padding:10px 14px!important}}\n';
  document.head.appendChild(style);
}

function makeButton(){
  var button=document.createElement('button');
  button.type='button';
  button.id=FLOAT_ID;
  button.setAttribute('data-course-theme-toggle','');
  button.addEventListener('click',toggleTheme);
  updateButton(button);
  return button;
}

function currentTrackContainer(){
  var route='';
  try{route=String(location.hash||'').replace(/^#/,'');}catch(e){}
  if(!route||route==='hub'||route==='courses')return null;
  var registry=window.TRACK_REGISTRY;
  var entry=registry&&registry[route];
  return entry?document.getElementById(entry.containerId):null;
}

function courseVisible(){
  // Generated /courses/*.html pages are already direct course views. Their
  // metadata node is the stable marker, so the theme control must remain
  // available even though there is no legacy hash-routed track container.
  if(document.getElementById('course-page-meta'))return true;
  var direct=document.getElementById('csai-direct-course-view');
  if(direct){
    var directStyle=getComputedStyle(direct);
    if(!direct.hidden&&directStyle.display!=='none'&&directStyle.visibility!=='hidden')return true;
  }
  var container=currentTrackContainer();
  if(!container)return false;
  var style=getComputedStyle(container);
  return !container.hidden&&style.display!=='none'&&style.visibility!=='hidden';
}

function removeOldTopToggle(){
  document.querySelectorAll('.dcv-top [data-course-theme-toggle]').forEach(function(button){
    if(button.id!==FLOAT_ID)button.remove();
  });
}

function scan(){
  addStyle();
  removeOldTopToggle();
  var existing=document.getElementById(FLOAT_ID);
  if(!courseVisible()){
    if(existing)existing.remove();
    return;
  }
  if(!existing){
    existing=makeButton();
    document.body.appendChild(existing);
  }
  updateButton(existing);
}

var scheduled=false;
function scheduleScan(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(function(){ scheduled=false; scan(); });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan);else scan();
new MutationObserver(scheduleScan).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['data-theme','style','hidden','class']});
window.addEventListener('hashchange',function(){setTimeout(scan,0)});
window.addEventListener('storage',function(event){if(event.key===KEY||event.key==='theme')scan()});
})();
