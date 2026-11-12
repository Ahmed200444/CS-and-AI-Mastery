(function(){
'use strict';
// Pro polish v6 — small interaction layer that sits on top of the existing pages.
// It only reads what is already on the page: it never writes progress, never changes ids or routes,
// and every feature is skipped quietly if the element it needs is not there.
if(window.__csaiProPolishV6)return;window.__csaiProPolishV6=true;

var reduce=false;
try{reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn);else fn()}
function $(s,r){return (r||document).querySelector(s)}
function $all(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function isCoursePage(){return !!$('main.wrap')&&$all('details.lesson').length>0}

/* 1. Reading progress bar on course pages */
function readingBar(){
  if(!isCoursePage()||document.getElementById('p6-read'))return;
  var bar=document.createElement('div');bar.id='p6-read';bar.setAttribute('aria-hidden','true');
  var fill=document.createElement('i');bar.appendChild(fill);document.body.appendChild(bar);
  var queued=false;
  function paint(){
    queued=false;
    var el=document.documentElement,max=el.scrollHeight-el.clientHeight;
    var pct=max>0?Math.min(100,Math.max(0,(window.pageYOffset||el.scrollTop)/max*100)):0;
    fill.style.width=pct.toFixed(1)+'%';
  }
  function ask(){if(!queued){queued=true;(window.requestAnimationFrame||setTimeout)(paint,16)}}
  window.addEventListener('scroll',ask,{passive:true});window.addEventListener('resize',ask,{passive:true});paint();
}

/* 2. Lesson filter inside the "Course contents" navigation */
function lessonFilter(){
  var nav=$('.csai-cn');if(!nav||$('.p6-filter',nav))return !!nav;
  var list=$('ol',nav);if(!list)return true;
  var items=$all('li',list);if(items.length<8)return true;
  var box=document.createElement('div');box.className='p6-filter';
  var input=document.createElement('input');input.type='search';input.id='p6-lesson-filter';
  input.setAttribute('aria-label','Filter lessons');input.placeholder='Filter '+items.length+' lessons';
  input.autocomplete='off';box.appendChild(input);
  var empty=document.createElement('div');empty.className='p6-filter-empty';empty.textContent='No lesson matches that filter.';
  list.parentNode.insertBefore(box,list);list.parentNode.insertBefore(empty,list.nextSibling);
  input.addEventListener('input',function(){
    var q=input.value.trim().toLowerCase(),shown=0;
    items.forEach(function(li){var hit=!q||li.textContent.toLowerCase().indexOf(q)!==-1;li.classList.toggle('p6-hide',!hit);if(hit)shown++});
    empty.classList.toggle('on',shown===0);
  });
  input.addEventListener('keydown',function(e){if(e.key==='Escape'){input.value='';input.dispatchEvent(new Event('input'));input.blur()}});
  document.addEventListener('keydown',function(e){
    if(e.key!=='/'||e.ctrlKey||e.metaKey||e.altKey)return;
    var t=e.target,tag=t&&t.tagName;
    if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||(t&&t.isContentEditable))return;
    if(input.offsetParent===null)return; // navigation collapsed (phone) — leave the key alone
    e.preventDefault();input.focus();
  });
  return true;
}
function waitForNav(){
  if(!isCoursePage())return;
  var tries=0;(function tick(){if(lessonFilter())return;if(++tries<40)setTimeout(tick,150)})();
}

/* 3. Lesson-complete toast (reads the existing checkboxes; storage is untouched) */
var toastTimer=null;
function toast(title,sub,pct){
  var t=document.getElementById('p6-toast');
  if(!t){t=document.createElement('div');t.id='p6-toast';t.setAttribute('role','status');t.setAttribute('aria-live','polite');
    t.innerHTML='<div class="p6-tick" aria-hidden="true">✓</div><div><b></b><span></span></div><div class="p6-tbar" aria-hidden="true"><i style="width:0"></i></div>';
    document.body.appendChild(t)}
  $('b',t).textContent=title;$('span',t).textContent=sub;
  var fill=$('.p6-tbar i',t);
  t.classList.add('on');
  setTimeout(function(){fill.style.width=Math.max(0,Math.min(100,pct))+'%'},30);
  clearTimeout(toastTimer);toastTimer=setTimeout(function(){t.classList.remove('on')},3200);
}
function completionToast(){
  if(!isCoursePage())return;
  document.addEventListener('change',function(e){
    var box=e.target;
    if(!box||box.type!=='checkbox'||!box.closest||!box.closest('details.lesson > summary label.check'))return;
    if(!box.checked)return;
    setTimeout(function(){
      var all=$all('details.lesson > summary label.check input[type="checkbox"]');
      var done=all.filter(function(b){return b.checked}).length,total=all.length;if(!total)return;
      if(done>=total)toast('Course complete','All '+total+' lessons finished. Well done.',100);
      else toast('Lesson complete',done+' of '+total+' lessons done — '+(total-done)+' to go.',done/total*100);
    },60);
  });
}

/* 4. Dashboard: count-up numbers and gentle reveal */
function countUp(){
  if(reduce)return;
  $all('.av4-stat strong').forEach(function(el){
    var raw=el.textContent.trim();if(!/^\d{1,3}(,\d{3})*$|^\d+$/.test(raw))return;
    var target=parseInt(raw.replace(/,/g,''),10);if(!(target>0))return;
    var comma=raw.indexOf(',')!==-1,start=null,last=raw,dur=900;
    function fmt(n){return comma?n.toLocaleString('en-US'):String(n)}
    function step(ts){
      if(el.textContent.trim()!==last){return} // another script updated the number — leave it alone
      if(start===null)start=ts;
      var p=Math.min(1,(ts-start)/dur),eased=1-Math.pow(1-p,3);
      last=p>=1?raw:fmt(Math.round(target*eased));el.textContent=last;
      if(p<1)requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}
function reveal(){
  if(reduce||!('IntersectionObserver' in window))return;
  var els=$all('.av4-path-card,.av4-mini-course,.hub-card,.hub-career-grid > *');
  if(!els.length)return;
  var vh=window.innerHeight||800;
  els=els.filter(function(el){var r=el.getBoundingClientRect();return r.width>0&&r.top>vh*0.92});
  if(!els.length)return;
  var io=new IntersectionObserver(function(entries){entries.forEach(function(en){if(en.isIntersecting){en.target.classList.add('p6-in');io.unobserve(en.target)}})},{rootMargin:'0px 0px -6% 0px'});
  els.forEach(function(el){el.classList.add('p6-rv');io.observe(el)});
  // Safety net: nothing may stay hidden if the observer never fires (print, odd embeds, hidden tabs).
  setTimeout(function(){els.forEach(function(el){el.classList.add('p6-in')})},4000);
}

ready(function(){
  try{readingBar()}catch(e){}
  try{waitForNav()}catch(e){}
  try{completionToast()}catch(e){}
  setTimeout(function(){try{countUp()}catch(e){};try{reveal()}catch(e){}},500);
});
})();
