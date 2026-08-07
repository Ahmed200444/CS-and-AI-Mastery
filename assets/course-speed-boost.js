(function(){
'use strict';

var COURSE_PREFIX='/assets/course-data/';
var COURSE_VERSION='?v=20260807-2';
var prefetched=new Map();
var busy=false;
var nativeFetch=window.fetch.bind(window);

function safeId(id){return String(id||'').replace(/[^A-Za-z0-9._-]/g,'')}
function urlFor(id){return COURSE_PREFIX+encodeURIComponent(safeId(id))+'.json'+COURSE_VERSION}
function withTimeout(promise,ms){
  return Promise.race([
    promise,
    new Promise(function(resolve){setTimeout(function(){resolve(null)},ms)})
  ]);
}

/* Course JSON files are immutable for a deploy. Let the browser cache them instead
   of forcing a new network round-trip every time the viewer asks for one. */
window.fetch=function(input,init){
  var url='';
  try{url=typeof input==='string'?input:(input&&input.url)||''}catch(e){}
  if(url.indexOf(COURSE_PREFIX)>=0){
    var next=Object.assign({},init||{});
    next.cache='force-cache';
    return nativeFetch(input,next);
  }
  return nativeFetch(input,init);
};

function prefetch(id){
  id=safeId(id);
  if(!id)return Promise.resolve(false);
  if(prefetched.has(id))return prefetched.get(id);
  var p=nativeFetch(urlFor(id),{cache:'force-cache'})
    .then(function(r){return !!(r&&r.ok)})
    .catch(function(){return false});
  prefetched.set(id,p);
  return p;
}

function visibleCourseIds(){
  return Array.prototype.slice.call(document.querySelectorAll('[data-scr-course]'))
    .map(function(b){return safeId(b.getAttribute('data-scr-course'))})
    .filter(Boolean);
}

function warmImportantCourses(){
  var ids=visibleCourseIds().slice(0,8);
  ids.forEach(function(id,i){
    setTimeout(function(){prefetch(id)},80+i*70);
  });
}

function temporarilyHideEmbeddedData(run){
  var node=document.getElementById('coursedata');
  if(!node)return run();
  var original=node.id;
  node.id='coursedata-speed-standby';
  try{return run()}finally{node.id=original}
}

async function fastOpen(button){
  if(busy)return;
  var id=safeId(button&&button.getAttribute('data-scr-course'));
  if(!id)return;
  busy=true;
  var oldText=button.textContent;
  button.disabled=true;
  button.textContent='Opening…';

  /* Give an already-running preload a very short chance to finish. Keeping the
     catalog visible during this wait feels much faster than showing a full-page
     loading screen. */
  var ready=await withTimeout(prefetch(id),900);

  var catalog=document.getElementById('csai-catalog-recovery');
  if(catalog)catalog.remove();

  try{
    if(window.CSAIMasteryDirectCourse&&typeof window.CSAIMasteryDirectCourse.open==='function'){
      if(ready){
        /* The viewer normally parses the enormous embedded 54-course JSON first.
           For a successfully cached per-course file, skip that expensive parse. */
        temporarilyHideEmbeddedData(function(){window.CSAIMasteryDirectCourse.open(id)});
      }else{
        /* Reliability fallback: if prefetch failed, let the viewer use its embedded
           data path rather than failing the course entirely. */
        window.CSAIMasteryDirectCourse.open(id);
      }
    }
  }finally{
    button.disabled=false;
    button.textContent=oldText;
    busy=false;
  }
}

/* Window capture runs before the viewer's document-capture click listener, so we
   can take the optimized path without changing the proven course viewer itself. */
window.addEventListener('click',function(event){
  var button=event.target&&event.target.closest&&event.target.closest('[data-scr-course]');
  if(!button)return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  fastOpen(button);
},true);

/* Warm a course as soon as the user shows intent. */
window.addEventListener('pointerover',function(event){
  var button=event.target&&event.target.closest&&event.target.closest('[data-scr-course]');
  if(button)prefetch(button.getAttribute('data-scr-course'));
},true);
window.addEventListener('focusin',function(event){
  var button=event.target&&event.target.closest&&event.target.closest('[data-scr-course]');
  if(button)prefetch(button.getAttribute('data-scr-course'));
},true);

var scheduled=false;
function scheduleWarm(){
  if(scheduled)return;
  scheduled=true;
  setTimeout(function(){scheduled=false;warmImportantCourses()},120);
}
new MutationObserver(function(mutations){
  for(var i=0;i<mutations.length;i++){
    if(mutations[i].addedNodes&&mutations[i].addedNodes.length){scheduleWarm();break}
  }
}).observe(document.documentElement,{childList:true,subtree:true});

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleWarm);else scheduleWarm();

window.CSAICourseSpeed={prefetch:prefetch,warm:warmImportantCourses};
})();
