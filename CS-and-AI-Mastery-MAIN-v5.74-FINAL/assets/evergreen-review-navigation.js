(function(){
'use strict';

var STORAGE='csai-evergreen-mastery-v1';
var meta={};
try{var node=document.getElementById('course-page-meta');meta=node?JSON.parse(node.textContent||'{}'):{};}catch(e){meta={};}
var courseId=String(meta.id||location.pathname.split('/').pop()||'').replace(/\.html$/,'');
var ready=false;

function read(){try{return JSON.parse(localStorage.getItem(STORAGE)||'{}')||{}}catch(e){return{}}}
function dueLessons(){
 var course=(read()[courseId]||{}),now=Date.now();
 return Object.keys(course).map(function(id){return{id:id,data:course[id]}}).filter(function(x){return x.data&&x.data.nextReview&&new Date(x.data.nextReview).getTime()<=now}).sort(function(a,b){return new Date(a.data.nextReview)-new Date(b.data.nextReview)});
}
function firstLab(){return document.querySelector('[data-evergreen-lab]')}
function lessonFor(id){return Array.from(document.querySelectorAll('.lesson[data-lesson]')).find(function(el){return el.getAttribute('data-lesson')===id})}
function openLab(lab){
 if(!lab)return false;
 var lesson=lab.closest('.lesson');
 if(lesson)lesson.open=true;
 requestAnimationFrame(function(){lab.scrollIntoView({behavior:'smooth',block:'start'});lab.classList.add('evergreen-focus');setTimeout(function(){lab.classList.remove('evergreen-focus')},1600)});
 return true;
}
function openDue(){
 var due=dueLessons();
 if(due.length){var lesson=lessonFor(due[0].id),lab=lesson&&lesson.querySelector('[data-evergreen-lab]');if(openLab(lab))return;}
 openLab(firstLab());
}
function style(){
 if(document.getElementById('csai-evergreen-review-nav-style'))return;
 var s=document.createElement('style');s.id='csai-evergreen-review-nav-style';s.textContent=`
[data-evergreen-course-status]{display:inline-flex;align-items:center;gap:6px;margin-top:10px;padding:7px 10px;border:1px solid var(--border);border-radius:999px;background:var(--pill);color:var(--pilltext);font:850 .78rem/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer;user-select:none;transition:transform .15s ease,box-shadow .15s ease,filter .15s ease}[data-evergreen-course-status]:hover{filter:brightness(.97);transform:translateY(-1px);box-shadow:0 5px 14px rgba(0,0,0,.12)}[data-evergreen-course-status]:focus{outline:2px solid var(--accent);outline-offset:2px}.evergreen-focus{border-radius:12px;box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 55%,transparent);transition:box-shadow .2s ease}
`;
 document.head.appendChild(s);
}
function ensureBadge(){
 var hero=document.querySelector('.hero');
 if(!hero)return null;
 var badge=hero.querySelector('[data-evergreen-course-status]');
 if(!badge){badge=document.createElement('button');badge.type='button';badge.className='evergreen-course-status';badge.setAttribute('data-evergreen-course-status','');var progressStatus=hero.querySelector('[data-progress-status]');if(progressStatus)progressStatus.insertAdjacentElement('afterend',badge);else hero.appendChild(badge);}
 return badge;
}
function enhance(){
 style();
 var badge=ensureBadge();
 if(!badge)return false;
 var due=dueLessons();
 var text=due.length?('🌱 '+due.length+' lesson'+(due.length===1?'':'s')+' due for review → Open review'):'🌱 Evergreen active — no reviews due → Open Mastery Lab';
 var aria=due.length?(due.length+' lesson'+(due.length===1?' is':'s are')+' due for Evergreen review. Open the first due lesson.'):'Evergreen review is active. No lessons are due yet. Open the first Evergreen Mastery Lab.';
 if(badge.textContent!==text)badge.textContent=text;
 badge.setAttribute('aria-label',aria);
 badge.title=due.length?'Click to review the first lesson that is due.':'No review is due yet. Click to open the first Evergreen Mastery Lab.';
 if(!ready){badge.addEventListener('click',openDue);badge.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();openDue()}});ready=true;}
 return true;
}
function start(){enhance();setTimeout(enhance,250);setTimeout(enhance,800);setTimeout(enhance,1600)}
window.addEventListener('csai-review-updated',function(){setTimeout(enhance,20)});
window.addEventListener('storage',function(e){if(e.key===STORAGE)setTimeout(enhance,20)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
