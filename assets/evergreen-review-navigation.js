(function(){
'use strict';

var STORAGE='csai-evergreen-mastery-v1';
var meta={};
try{var node=document.getElementById('course-page-meta');meta=node?JSON.parse(node.textContent||'{}'):{};}catch(e){meta={};}
var courseId=String(meta.id||location.pathname.split('/').pop()||'').replace(/\.html$/,'');

function read(){try{return JSON.parse(localStorage.getItem(STORAGE)||'{}')||{}}catch(e){return{}}}
function dueLessons(){var course=(read()[courseId]||{}),now=Date.now();return Object.keys(course).map(function(id){return{id:id,data:course[id]}}).filter(function(x){return x.data&&x.data.nextReview&&new Date(x.data.nextReview).getTime()<=now}).sort(function(a,b){return new Date(a.data.nextReview)-new Date(b.data.nextReview)})}
function firstLab(){return document.querySelector('[data-evergreen-lab]')}
function lessonFor(id){return Array.from(document.querySelectorAll('.lesson[data-lesson]')).find(function(el){return el.getAttribute('data-lesson')===id})}
function openLab(lab){if(!lab)return false;var lesson=lab.closest('.lesson');if(lesson)lesson.open=true;lab.scrollIntoView({behavior:'smooth',block:'start'});lab.classList.add('evergreen-focus');setTimeout(function(){lab.classList.remove('evergreen-focus')},1800);return true}
function openDue(){var due=dueLessons();if(due.length){var lesson=lessonFor(due[0].id),lab=lesson&&lesson.querySelector('[data-evergreen-lab]');if(openLab(lab))return}openLab(firstLab())}

function style(){if(document.getElementById('csai-evergreen-review-nav-style'))return;var s=document.createElement('style');s.id='csai-evergreen-review-nav-style';s.textContent=`
[data-evergreen-course-status]{cursor:pointer;user-select:none;transition:transform .15s ease,box-shadow .15s ease,filter .15s ease}[data-evergreen-course-status]:hover{filter:brightness(.97);transform:translateY(-1px);box-shadow:0 5px 14px rgba(0,0,0,.12)}[data-evergreen-course-status]:focus{outline:2px solid var(--accent);outline-offset:2px}.evergreen-focus{border-radius:12px;box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 55%,transparent);transition:box-shadow .2s ease}
`;document.head.appendChild(s)}

function enhance(){style();var badge=document.querySelector('[data-evergreen-course-status]');if(!badge)return false;var due=dueLessons();badge.setAttribute('role','button');badge.setAttribute('tabindex','0');badge.setAttribute('aria-label',due.length?(due.length+' lesson'+(due.length===1?' is':'s are')+' due for Evergreen review. Open the first due lesson.'):'Evergreen review is active. No lessons are due yet. Open the first Evergreen Mastery Lab.');badge.title=due.length?'Click to review the first lesson that is due.':'No review is due yet. Click to open the Evergreen Mastery Lab.';badge.textContent=due.length?('🌱 '+due.length+' lesson'+(due.length===1?'':'s')+' due for review → Open review'): '🌱 Evergreen active — no reviews due → Open Mastery Lab';if(badge.dataset.reviewNavReady!=='1'){badge.dataset.reviewNavReady='1';badge.addEventListener('click',openDue);badge.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();openDue()}})}return true}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(enhance,80)});else setTimeout(enhance,80);
setTimeout(enhance,500);setTimeout(enhance,1200);
new MutationObserver(function(){enhance()}).observe(document.documentElement,{childList:true,subtree:true});
})();
