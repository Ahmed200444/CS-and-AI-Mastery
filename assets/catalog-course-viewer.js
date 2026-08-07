(function(){
'use strict';

var VIEW_ID='csai-direct-course-view';
var STYLE_ID='csai-direct-course-style';
var courseCache={};
var embeddedMap=null;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function arr(v){return Array.isArray(v)?v:[]}
function list(v){return Array.isArray(v)?v:(v?[v]:[])}
function safeId(id){return String(id||'').replace(/[^A-Za-z0-9._-]/g,'')}
function loadProgress(){try{return JSON.parse(localStorage.getItem('courses_progress_v1')||'{}')||{}}catch(e){return{}}}
function saveProgress(v){try{localStorage.setItem('courses_progress_v1',JSON.stringify(v))}catch(e){}}
function lessonExplanation(l){return l.explanation||l.explain||l.description||'Study the concept, review the example, and practise it before moving on.'}
function examples(l){var v=l.examples||l.example;return Array.isArray(v)?v:(v?[v]:[])}
function lessonOrder(course){return arr(course.lessons).map(function(l,i){return{l:l,i:i}}).sort(function(a,b){var x=Number(a.l.displayOrder),y=Number(b.l.displayOrder);if(!Number.isFinite(x))x=a.i;if(!Number.isFinite(y))y=b.i;return x-y})}

function addStyle(){
  if(document.getElementById(STYLE_ID))return;
  var s=document.createElement('style');
  s.id=STYLE_ID;
  s.textContent=`
#${VIEW_ID}{position:fixed!important;inset:0!important;z-index:2147483100!important;overflow:auto!important;-webkit-overflow-scrolling:touch;background:#f4f7fb!important;color:#172231!important;font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;visibility:visible!important;opacity:1!important}
#${VIEW_ID} *{box-sizing:border-box}.dcv-wrap{max-width:1100px;margin:auto;padding:18px 20px 110px}.dcv-top{position:sticky;top:0;z-index:4;display:flex;justify-content:space-between;gap:10px;padding:10px 0;background:#f4f7fb!important}.dcv-btn{border:1px solid #b8c7d6;border-radius:9px;padding:9px 13px;background:#fff!important;color:#17304b!important;font:inherit;font-weight:800;cursor:pointer}.dcv-primary{background:#17649a!important;color:#fff!important;border-color:#17649a!important}.dcv-hero,.dcv-card,.dcv-lesson{background:#fff!important;border:1px solid #d8e1ea!important;border-radius:15px;color:#172231!important}.dcv-hero{padding:22px;margin:8px 0 16px}.dcv-kicker{font-size:.74rem;letter-spacing:.1em;font-weight:900;color:#17649a}.dcv-hero h1{margin:5px 0 8px;font-size:clamp(2rem,4vw,3.2rem);line-height:1.08}.dcv-muted{color:#5d6c7c}.dcv-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.dcv-pill{padding:4px 8px;border-radius:999px;background:#e8f1f8!important;color:#174b72!important;font-size:.78rem;font-weight:800}.dcv-progress{height:10px;border-radius:999px;background:#dce5ed!important;overflow:hidden;margin:14px 0 5px}.dcv-progress span{display:block;height:100%;background:#16805b!important}.dcv-lessons{display:grid;gap:11px}.dcv-lesson{overflow:hidden}.dcv-lesson summary{display:flex;align-items:center;gap:10px;padding:14px 16px;cursor:pointer;font-weight:850}.dcv-num{display:grid;place-items:center;min-width:34px;height:28px;border-radius:8px;background:#e8f1f8!important;color:#17649a!important}.dcv-title{flex:1}.dcv-check{display:flex;gap:6px;align-items:center;font-size:.82rem;font-weight:700}.dcv-body{padding:0 16px 18px}.dcv-body h3{margin:17px 0 7px;font-size:1rem}.dcv-body p,.dcv-body li{line-height:1.68}.dcv-code{white-space:pre-wrap;overflow:auto;padding:13px;border-radius:10px;background:#101827!important;color:#f4f7fb!important;font:500 .86rem/1.55 ui-monospace,SFMono-Regular,Consolas,monospace}.dcv-note{margin-top:12px;padding:12px;border-left:4px solid #d28b23;border-radius:8px;background:#fff7e7!important}.dcv-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px}.dcv-card{padding:17px}.dcv-card h2{margin:0 0 10px}.dcv-item{padding:12px;margin:9px 0;border-radius:10px;background:#f4f7fb!important}.dcv-answer{width:100%;min-height:100px;margin-top:8px;padding:10px;border:1px solid #aebdca;border-radius:8px;background:transparent;color:inherit;font:inherit}.dcv-empty{padding:17px;border:1px dashed #b8c7d6;border-radius:10px}.dcv-loading{text-align:center;padding:70px 20px}.dcv-error{color:#9b2c2c;font-weight:750}.dcv-loading-actions{margin-top:20px}
html[data-theme="dark"] #${VIEW_ID},body[data-theme="dark"] #${VIEW_ID}{background:#0f1720!important;color:#edf3f8!important}html[data-theme="dark"] .dcv-top,body[data-theme="dark"] .dcv-top{background:#0f1720!important}html[data-theme="dark"] .dcv-hero,html[data-theme="dark"] .dcv-card,html[data-theme="dark"] .dcv-lesson,body[data-theme="dark"] .dcv-hero,body[data-theme="dark"] .dcv-card,body[data-theme="dark"] .dcv-lesson{background:#17212c!important;color:#edf3f8!important;border-color:#344352!important}html[data-theme="dark"] .dcv-btn,body[data-theme="dark"] .dcv-btn{background:#111b25!important;color:#edf3f8!important;border-color:#455464!important}html[data-theme="dark"] .dcv-item,body[data-theme="dark"] .dcv-item{background:#111b25!important}html[data-theme="dark"] .dcv-note,body[data-theme="dark"] .dcv-note{background:#2b2417!important;color:#edf3f8!important}html[data-theme="dark"] .dcv-muted,body[data-theme="dark"] .dcv-muted{color:#c6d1da!important}
@media(max-width:720px){.dcv-wrap{padding:10px 10px 100px}.dcv-grid{grid-template-columns:1fr}.dcv-top{align-items:stretch}.dcv-top .dcv-btn{flex:1}.dcv-lesson summary{flex-wrap:wrap;align-items:flex-start}.dcv-check{width:100%;padding-left:44px}}
`;
  document.head.appendChild(s);
}

function remove(){var n=document.getElementById(VIEW_ID);if(n)n.remove();document.documentElement.style.overflow=''}

function buildEmbeddedMap(){
  if(embeddedMap)return embeddedMap;
  embeddedMap={};
  try{
    var node=document.getElementById('coursedata');
    var data=node?JSON.parse(node.textContent||'[]'):[];
    if(Array.isArray(data))data.forEach(function(course){if(course&&course.id)embeddedMap[course.id]=course});
  }catch(error){
    console.warn('[CS AI Mastery] Embedded course data could not be parsed.',error);
  }
  return embeddedMap;
}

function embeddedCourse(id){
  var map=buildEmbeddedMap();
  return map&&map[id]?map[id]:null;
}

async function fetchCourseWithTimeout(id){
  var controller=typeof AbortController==='function'?new AbortController():null;
  var timer=setTimeout(function(){if(controller)controller.abort()},5000);
  try{
    var options={cache:'no-store'};
    if(controller)options.signal=controller.signal;
    var response=await fetch('/assets/course-data/'+encodeURIComponent(id)+'.json?v=20260807-2',options);
    if(!response.ok)throw new Error('Course data returned HTTP '+response.status);
    var course=await response.json();
    if(!course||course.id!==id)throw new Error('Course data is invalid');
    return course;
  }finally{
    clearTimeout(timer);
  }
}

async function getCourse(id){
  id=safeId(id);
  if(!id)throw new Error('Invalid course id');
  if(courseCache[id])return courseCache[id];

  var embedded=embeddedCourse(id);
  if(embedded){
    courseCache[id]=embedded;
    return embedded;
  }

  try{
    var remote=await fetchCourseWithTimeout(id);
    courseCache[id]=remote;
    return remote;
  }catch(error){
    if(error&&error.name==='AbortError')throw new Error('Course loading timed out. Please go back to All courses and try again.');
    throw error;
  }
}

function progressStatus(course,lessons){
  var p=loadProgress(),s=p[course.id]||{},m=s.lessons||{},done=0;
  lessons.forEach(function(x,i){var id=x.l.id||('lesson-'+i);if(m[id])done++});
  return{done:done,total:lessons.length,pct:lessons.length?Math.round(done/lessons.length*100):0};
}

function quizHtml(q,i){
  var question=q.q||q.question||q.prompt||('Question '+(i+1)),opts=arr(q.options);
  return'<div class="dcv-item"><b>'+esc(question)+'</b>'+(opts.length?'<ol>'+opts.map(function(o){return'<li>'+esc(o)+'</li>'}).join('')+'</ol>':'')+'<textarea class="dcv-answer" placeholder="Write your answer..."></textarea></div>';
}
function exerciseHtml(x,i){return'<div class="dcv-item"><b>'+esc(x.title||('Exercise '+(i+1)))+'</b><p>'+esc(x.prompt||x.description||'Complete this exercise using what you learned in the course.')+'</p>'+(x.hint?'<details><summary>Hint</summary><p>'+esc(x.hint)+'</p></details>':'')+'<textarea class="dcv-answer" placeholder="Write code or notes here..."></textarea></div>'}
function projectHtml(x,i){return'<div class="dcv-item"><b>'+esc(x.title||x.name||('Project '+(i+1)))+'</b><p>'+esc(x.description||x.desc||x.prompt||'Build this project and document what you learned.')+'</p></div>'}

function renderCourse(course){
  addStyle();
  remove();
  var lessons=lessonOrder(course),st=progressStatus(course,lessons),root=document.createElement('div');
  root.id=VIEW_ID;
  root.setAttribute('role','main');
  root.setAttribute('aria-label',(course.title||course.id)+' course');

  var lessonHtml=lessons.length?lessons.map(function(x,i){
    var l=x.l,id=l.id||('lesson-'+i),p=loadProgress(),checked=!!(((p[course.id]||{}).lessons||{})[id]),objs=list(l.objectives),concepts=list(l.concepts),mistakes=list(l.commonMistakes||l.commonMistake),exs=examples(l);
    return'<details class="dcv-lesson" data-dcv-lesson="'+esc(id)+'" '+(i===0?'open':'')+'><summary><span class="dcv-num">'+String(i+1).padStart(2,'0')+'</span><span class="dcv-title">'+esc(l.title||('Lesson '+(i+1)))+'</span><label class="dcv-check"><input type="checkbox" data-dcv-complete '+(checked?'checked':'')+'> Complete</label></summary><div class="dcv-body">'+(objs.length?'<h3>What you will learn</h3><ul>'+objs.map(function(v){return'<li>'+esc(v)+'</li>'}).join('')+'</ul>':'')+'<h3>Explanation</h3><p>'+esc(lessonExplanation(l))+'</p>'+(concepts.length?'<h3>Key concepts</h3><div class="dcv-meta">'+concepts.map(function(v){return'<span class="dcv-pill">'+esc(v)+'</span>'}).join('')+'</div>':'')+(exs.length?'<h3>Example</h3>'+exs.map(function(v){return'<pre class="dcv-code">'+esc(v)+'</pre>'}).join(''):'')+(mistakes.length?'<div class="dcv-note"><b>Common mistake:</b> '+esc(mistakes.join(' • '))+'</div>':'')+'</div></details>';
  }).join(''):'<div class="dcv-empty">No lesson content is listed for this course yet.</div>';

  var exercises=arr(course.exercises),quiz=arr(course.quiz),projects=arr(course.projects);
  if(course.capstone)projects=projects.concat([course.capstone]);

  root.innerHTML='<div class="dcv-wrap"><div class="dcv-top"><button class="dcv-btn" data-dcv-back>← All courses</button><button class="dcv-btn dcv-primary" data-dcv-home>Home</button></div><section class="dcv-hero"><div class="dcv-kicker">COURSE</div><h1>'+esc(course.icon||'📘')+' '+esc(course.title||course.id)+'</h1><p class="dcv-muted">'+esc(course.blurb||course.description||'Complete the lessons in order and practise each concept.')+'</p><div class="dcv-meta"><span class="dcv-pill">'+lessons.length+' lessons</span><span class="dcv-pill">'+exercises.length+' exercises</span><span class="dcv-pill">'+quiz.length+' checkpoints</span><span class="dcv-pill">'+projects.length+' projects</span></div><div class="dcv-progress"><span data-dcv-bar style="width:'+st.pct+'%"></span></div><div class="dcv-muted" data-dcv-status>'+st.done+' of '+st.total+' lessons complete</div></section><section class="dcv-lessons">'+lessonHtml+'</section><div class="dcv-grid"><section class="dcv-card"><h2>Exercises</h2>'+(exercises.length?exercises.map(exerciseHtml).join(''):'<p class="dcv-muted">No separate exercises are listed.</p>')+'</section><section class="dcv-card"><h2>Knowledge checks</h2>'+(quiz.length?quiz.map(quizHtml).join(''):'<p class="dcv-muted">No separate checkpoints are listed.</p>')+'</section></div><section class="dcv-card" style="margin-top:14px"><h2>Projects</h2>'+(projects.length?projects.map(projectHtml).join(''):'<p class="dcv-muted">No separate projects are listed.</p>')+'</section></div>';

  document.body.appendChild(root);
  document.documentElement.style.overflow='hidden';

  root.addEventListener('click',function(e){
    if(e.target.closest('[data-dcv-back]')){remove();if(typeof window.showTrack==='function')window.showTrack('courses');return}
    if(e.target.closest('[data-dcv-home]')){remove();if(typeof window.showTrack==='function')window.showTrack('hub')}
  });
  root.addEventListener('change',function(e){
    if(!e.target.matches('[data-dcv-complete]'))return;
    var lesson=e.target.closest('[data-dcv-lesson]');if(!lesson)return;
    var id=lesson.getAttribute('data-dcv-lesson'),p=loadProgress();
    p[course.id]=p[course.id]||{};p[course.id].lessons=p[course.id].lessons||{};p[course.id].lessons[id]=!!e.target.checked;saveProgress(p);
    var now=progressStatus(course,lessons),bar=root.querySelector('[data-dcv-bar]'),text=root.querySelector('[data-dcv-status]');
    if(bar)bar.style.width=now.pct+'%';if(text)text.textContent=now.done+' of '+now.total+' lessons complete';
  });
}

function showLoadError(loading,error,id){
  if(!loading||document.getElementById(VIEW_ID)!==loading)return;
  loading.innerHTML='<div class="dcv-wrap"><div class="dcv-top"><button class="dcv-btn" data-dcv-error-back>← All courses</button><button class="dcv-btn dcv-primary" data-dcv-retry>Retry</button></div><section class="dcv-hero"><h1>Course could not be loaded</h1><p class="dcv-error">'+esc(error&&error.message?error.message:String(error))+'</p></section></div>';
  loading.addEventListener('click',function(e){
    if(e.target.closest('[data-dcv-error-back]')){remove();if(typeof window.showTrack==='function')window.showTrack('courses')}
    if(e.target.closest('[data-dcv-retry]'))open(id);
  });
}

async function open(id){
  id=safeId(id);
  addStyle();
  remove();
  var loading=document.createElement('div');
  loading.id=VIEW_ID;
  loading.innerHTML='<div class="dcv-loading"><h2>Loading course…</h2><p class="dcv-muted">Preparing the lesson content.</p></div>';
  document.body.appendChild(loading);
  document.documentElement.style.overflow='hidden';

  var failSafe=setTimeout(function(){
    if(document.getElementById(VIEW_ID)===loading){
      showLoadError(loading,new Error('Loading took too long. Please retry.'),id);
    }
  },6500);

  try{
    var course=await getCourse(id);
    clearTimeout(failSafe);
    if(document.getElementById(VIEW_ID)!==loading)return;
    renderCourse(course);
  }catch(error){
    clearTimeout(failSafe);
    console.error('[CS AI Mastery] Direct course viewer failed',error);
    showLoadError(loading,error,id);
  }
}

document.addEventListener('click',function(e){
  var button=e.target.closest&&e.target.closest('[data-scr-course]');
  if(!button)return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  var id=button.getAttribute('data-scr-course');
  var catalog=document.getElementById('csai-catalog-recovery');
  if(catalog)catalog.remove();
  open(id);
},true);

window.CSAIMasteryDirectCourse={open:open,close:remove};
})();
