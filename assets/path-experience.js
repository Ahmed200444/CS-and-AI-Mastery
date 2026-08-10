(function(){
'use strict';

var PATHS=[
  {id:'aiPathTrack',kind:'ai',title:'AI Engineer Path',about:'Build from programming foundations through modern AI, production systems, and portfolio-ready engineering work.',tips:['Follow the phases in order when a prerequisite is new to you.','Use projects as checkpoints, not just lesson completion.','Keep every course accessible so you can review weak areas anytime.']},
  {id:'cePathTrack',kind:'ce',title:'Computer Engineering Path',about:'Build strong systems foundations from computer architecture and networking through hardware and distributed systems.',tips:['Prioritize architecture, networking, and digital hardware first.','Treat upcoming specializations as optional depth, not blockers.','Use systems projects to connect theory to real engineering decisions.']},
  {id:'fsPathTrack',kind:'fs',title:'Starting Developer Path',about:'A beginner-friendly sequence from web fundamentals through backend, databases, APIs, projects, and deployment.',tips:['Move in order until the fundamentals feel comfortable.','Build the capstone as the path grows so each stage has a purpose.','Revisit earlier stages whenever a later project exposes a gap.']},
  {id:'companyPathsTrack',kind:'company-list',title:'Career Paths',about:'Role-focused plans that reuse your existing courses and projects instead of duplicating content.',tips:['Use readiness as guidance, not a guarantee.','Finish required skills before optional extras.','Prioritize portfolio evidence that matches the role.']},
  {id:'companyTrack',kind:'company',title:'Career Path',about:'A focused course and project sequence for a specific role or company target.',tips:['Start with required courses.','Use interview preparation after the core skills are solid.','Keep portfolio work specific and explain your decisions.']}
];
var scheduled=false;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function parseCourses(){try{return JSON.parse((document.getElementById('coursedata')||{}).textContent||'[]')||[];}catch(e){return[];}}
function norm(v){return String(v||'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}
function findCourse(raw){
  var wanted=norm(raw),courses=parseCourses();
  var aliases={
    'software-engineering-fundamentals':'swe-fundamentals',
    'data-structures-and-algorithms':'dsa',
    'object-oriented-programming':'oop',
    'machine-learning':'ai-ml',
    'ai-ml':'ai-ml',
    'large-language-models':'llms',
    'retrieval-augmented-generation':'rag',
    'computer-architecture':'comparch-os',
    'computer-architecture-and-operating-systems':'comparch-os',
    'computer-networks':'networking',
    'digital-systems-and-computer-hardware':'digital-hardware',
    'distributed-systems-and-concurrency':'distributed-systems'
  };
  var candidate=aliases[wanted]||wanted;
  return courses.find(function(c){return c.id===candidate||norm(c.id)===candidate||norm(c.title)===wanted||norm(c.linked)===wanted;})||null;
}
function openCourse(id){
  var c=findCourse(id)||parseCourses().find(function(x){return x.id===id;});
  if(!c)return false;
  if(c.linked&&window.TRACK_REGISTRY&&window.TRACK_REGISTRY[c.linked]&&typeof window.showTrack==='function'){window.showTrack(c.linked);return true;}
  if(typeof window.cxOpen==='function'){window.cxOpen(c.id);return true;}
  location.href='/courses/'+encodeURIComponent(c.id)+'.html';return true;
}
function createAside(cfg){
  var aside=document.createElement('aside');aside.className='csai-path-insights';aside.setAttribute('aria-label',cfg.title+' guidance');aside.setAttribute('data-csai-path-insights','');
  aside.innerHTML='<div class="csai-path-eyebrow">Learning path</div><h2>About this path</h2><p>'+esc(cfg.about)+'</p><hr><h2>Recommended</h2><ul>'+cfg.tips.map(function(t){return'<li>'+esc(t)+'</li>';}).join('')+'</ul><button type="button" class="csai-path-resume" data-csai-path-resume>Resume path</button><button type="button" class="csai-path-secondary" data-csai-all-courses>View all courses</button>';
  return aside;
}
function wrap(cfg){
  var root=document.getElementById(cfg.id);if(!root)return;
  root.classList.add('csai-path-shell');
  if(root.querySelector(':scope > .csai-path-layout'))return;
  var layout=document.createElement('div');layout.className='csai-path-layout'+(cfg.kind==='fs'?' csai-path-layout-three':'');layout.setAttribute('data-csai-path-layout','');
  var children=Array.prototype.slice.call(root.children);children.forEach(function(n){layout.appendChild(n);});
  layout.appendChild(createAside(cfg));root.appendChild(layout);
}
function removeCourseOnlyLeak(root){
  root.querySelectorAll('[data-course-language-mode],.course-lang-mode,[data-cpp-loop-panel],.cpp-companion,.csai-dual-pane,[data-dual-cpp-pane]').forEach(function(n){n.remove();});
  /* Defensive cleanup for a leaked language/action strip. Never touch a course/path card whose title happens to be Python. */
  Array.prototype.slice.call(root.querySelectorAll('div,section,nav')).forEach(function(group){
    if(group.closest('.ai-path-course-card,.cx-card,.fs-stage,.cp-course-card'))return;
    var buttons=Array.prototype.slice.call(group.querySelectorAll(':scope > button'));
    if(buttons.length<2||buttons.length>8)return;
    var labels=buttons.map(function(b){return norm(b.textContent);});
    var languageCount=labels.filter(function(x){return x==='python'||x==='javascript'||x==='typescript'||x==='c'||x==='cpp'||x==='java';}).length;
    var codeAction=labels.some(function(x){return x==='draw-code'||x==='run-code'||x==='code'||x==='open-code';});
    if(languageCount>=2&&codeAction)group.remove();
  });
}
function repairMissingAI(root){
  Array.prototype.slice.call(root.querySelectorAll('.ai-path-course-card')).forEach(function(card){
    var m=(card.textContent||'').match(/Missing course reference:\s*([^\n]+)/i);if(!m)return;
    var raw=m[1].trim(),course=findCourse(raw);if(!course)return;
    card.classList.add('csai-path-repaired');
    card.innerHTML='<div class="csai-path-repaired-note">Course reference repaired</div><h3 style="margin:0 0 5px">'+esc(course.icon||'📘')+' '+esc(course.title||course.id)+'</h3><p style="margin:0;color:var(--sub,var(--csub,#8b96a6));font-size:.84rem">This path now points to the real course in your 54-course catalog.</p><button type="button" class="wd-btn" style="margin-top:10px" data-csai-open-course="'+esc(course.id)+'">Open course</button>';
  });
}
function improveUpcomingCE(root){
  Array.prototype.slice.call(root.querySelectorAll('.cx-card')).forEach(function(card){
    var text=(card.textContent||'');if(!/planned|not available yet/i.test(text))return;
    card.classList.add('csai-path-upcoming');
    var badge=card.querySelector('.cx-flag-soon');if(badge)badge.textContent='Upcoming specialization';
    var disabled=card.querySelector('button:disabled');if(disabled){
      disabled.textContent='Optional specialization — current path can continue';
      disabled.setAttribute('title','This future specialization is not required to continue the current 54-course learning path.');
    }
    if(card.querySelector('[data-csai-prereq]'))return;
    var target=/embedded/i.test(text)?'digital-hardware':/systems programming/i.test(text)?'comparch-os':/advanced computer organization/i.test(text)?'comparch-os':'';
    if(target){var btn=document.createElement('button');btn.type='button';btn.className='wd-btn-ghost csai-path-prereq-btn';btn.setAttribute('data-csai-prereq',target);btn.textContent='Study the closest available prerequisite';card.appendChild(btn);}
  });
}
function refreshAside(root,cfg){
  var aside=root.querySelector('[data-csai-path-insights]');if(!aside)return;
  var title=root.querySelector('h1');if(title&&title.textContent.trim()&&cfg.kind==='company'){aside.querySelector('.csai-path-eyebrow').textContent='Career path';}
  var resume=aside.querySelector('[data-csai-path-resume]');if(resume){
    var target=root.querySelector('.ai-path-course-card button:not(:disabled),.cx-card button:not(:disabled),[data-act*="OpenCourse"], [data-act*="GoToStage"], [data-act*="openCourse"], .wd-btn:not(:disabled)');
    resume.disabled=!target;resume.style.opacity=target?'1':'.6';resume.dataset.targetReady=target?'1':'0';
  }
}
function enhance(cfg){
  var root=document.getElementById(cfg.id);if(!root)return;wrap(cfg);removeCourseOnlyLeak(root);if(cfg.kind==='ai')repairMissingAI(root);if(cfg.kind==='ce')improveUpcomingCE(root);refreshAside(root,cfg);
}
function run(){scheduled=false;PATHS.forEach(enhance);}
function queue(){if(scheduled)return;scheduled=true;setTimeout(run,24);}

document.addEventListener('click',function(e){
  var open=e.target.closest&&e.target.closest('[data-csai-open-course]');if(open){e.preventDefault();openCourse(open.getAttribute('data-csai-open-course'));return;}
  var prereq=e.target.closest&&e.target.closest('[data-csai-prereq]');if(prereq){e.preventDefault();openCourse(prereq.getAttribute('data-csai-prereq'));return;}
  var all=e.target.closest&&e.target.closest('[data-csai-all-courses]');if(all){e.preventDefault();if(typeof window.showTrack==='function')window.showTrack('courses');else location.href='/#courses';return;}
  var resume=e.target.closest&&e.target.closest('[data-csai-path-resume]');if(resume){
    e.preventDefault();var root=resume.closest('.csai-path-shell');if(!root)return;
    var target=root.querySelector('.ai-path-course-card button:not(:disabled),.cx-card button:not(:disabled),[data-act*="OpenCourse"], [data-act*="GoToStage"], [data-act*="openCourse"], .wd-btn:not(:disabled)');if(target)target.click();return;
  }
},true);

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){run();setTimeout(run,220);},{once:true});else{run();setTimeout(run,220);}
var observer=new MutationObserver(function(records){if(records.some(function(r){return r.addedNodes&&r.addedNodes.length;}))queue();});
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hashchange',queue);
})();
