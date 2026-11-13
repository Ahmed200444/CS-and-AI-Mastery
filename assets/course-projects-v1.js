(function(){
'use strict';
/* Course projects v1 (v5.90): gives every course page a visible Projects section.
   - "Course contents" gains a Practice group with links to Assessment practice and Projects.
   - Each project row becomes an overview card: number, level, description, what it includes and its status.
   Read-only layer: it never writes learner progress and never changes the project workspace itself. */
var meta=null;
try{meta=JSON.parse((document.getElementById('course-page-meta')||{}).textContent||'null')}catch(e){meta=null}
if(!meta||!meta.id)return;
var CID=String(meta.id),DRAFT='csai-project-draft-v1:'+CID+':',ACTIVITY='csai_activity_v1';
var LEVELS={1:'Starter',2:'Intermediate',3:'Advanced',4:'Capstone'};
var levels=null,levelsAsked=false,capstone='';

function read(key){try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(e){return{}}}
function has(key){try{return localStorage.getItem(key)!==null}catch(e){return false}}
function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
function el(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n}
function pad(n){return n<10?'0'+n:String(n)}

function folds(){
  var all=Array.prototype.slice.call(document.querySelectorAll('details.csai-heavy-fold'));
  var out={projects:null,practice:null};
  all.forEach(function(d){
    var s=d.querySelector(':scope > summary'),label=clean(s?s.getAttribute('data-cp1-label')||s.textContent:'').toLowerCase();
    if(/^projects/.test(label)){if(!out.projects)out.projects=d}
    else if(!out.practice)out.practice=d;
  });
  return out;
}
/* Project cards live either in the fold's <template> (not opened yet) or in its body (opened). */
function scope(fold){
  if(!fold)return null;
  var t=fold.querySelector(':scope > template[data-csai-heavy-template]');
  return t?t.content:fold.querySelector(':scope > .csai-heavy-fold-body');
}
function rows(fold){
  var s=scope(fold);if(!s)return[];
  return Array.prototype.slice.call(s.querySelectorAll('details.csai-lazy-item')).filter(function(r){return !!card(r)});
}
function card(row){
  var t=row.querySelector(':scope > template[data-csai-lazy-template]');
  return (t?t.content:row).querySelector('.project-card');
}
function statusOf(pid){
  var a=read(ACTIVITY).projects||{};
  if(a[CID+':'+pid])return{key:'published',text:'Published'};
  if(has(DRAFT+pid))return{key:'draft',text:'Draft saved'};
  return{key:'none',text:'Not started'};
}
function loadLevels(){
  if(levelsAsked)return;levelsAsked=true;
  if(typeof fetch!=='function')return;
  fetch('../assets/course-data/'+encodeURIComponent(CID)+'.json').then(function(r){return r.ok?r.json():null}).then(function(d){
    if(!d||!Array.isArray(d.projects))return;
    levels={};d.projects.forEach(function(p){if(p&&p.id&&LEVELS[p.level])levels[p.id]=LEVELS[p.level]});
    capstone=d.capstone&&d.capstone.title?clean(d.capstone.title).toLowerCase():'';
    paint();
  }).catch(function(){});
}
function decorate(row,index){
  var c=card(row);if(!c)return;
  var pid=c.getAttribute('data-project')||('projects-'+index);
  var sum=row.querySelector(':scope > summary');if(!sum)return;
  if(row.getAttribute('data-cp1')!=='1'){
    var h=c.querySelector('.project-head h3'),p=c.querySelector('.project-head p');
    var title=clean(h?h.textContent:sum.textContent),desc=clean(p?p.textContent:'');
    row.setAttribute('data-cp1','1');row.classList.add('cp1-row');
    sum.textContent='';
    var top=el('span','cp1-top');
    top.appendChild(el('span','cp1-eyebrow','Project '+pad(index+1)));
    top.appendChild(el('span','cp1-status','Not started'));
    sum.appendChild(top);
    sum.appendChild(el('span','cp1-title',title));
    if(desc)sum.appendChild(el('span','cp1-desc',desc));
    var chips=el('span','cp1-chips');
    ['Code workspace','4 check levels','README and GitHub publishing'].forEach(function(t){chips.appendChild(el('span','cp1-chip',t))});
    sum.appendChild(chips);
    sum.appendChild(el('span','cp1-open','Open project'));
  }
  var eyebrow=sum.querySelector('.cp1-eyebrow'),level=levels&&levels[pid],shown=sum.querySelector('.cp1-title');
  if(!level&&capstone&&shown&&clean(shown.textContent).toLowerCase()===capstone)level='Capstone';
  if(eyebrow)eyebrow.textContent='Project '+pad(index+1)+(level?' · '+level:'');
  var st=statusOf(pid),badge=sum.querySelector('.cp1-status');
  if(badge){badge.textContent=st.text;badge.setAttribute('data-cp1-state',st.key)}
  return st.key;
}
function summaryLine(fold,counts,total){
  var body=fold.querySelector(':scope > .csai-heavy-fold-body');if(!body)return;
  var host=body.querySelector('.project-section')||body;
  var line=host.querySelector(':scope > .cp1-count');
  if(!line){
    line=el('p','cp1-count');
    var stack=host.querySelector(':scope > .project-stack');
    if(stack)host.insertBefore(line,stack);else host.appendChild(line);
  }
  var text=counts.published+' of '+total+' project'+(total===1?'':'s')+' published';
  if(counts.draft)text+=' · '+counts.draft+' draft'+(counts.draft===1?'':'s')+' saved';
  line.textContent=text+'.';
  var hint=host.querySelector(':scope > .cp1-hint'),svc=window.CSAI_SERVICES;
  if(svc&&svc.github===false){if(hint)hint.remove();return}
  if(!hint){hint=el('p','cp1-hint');line.insertAdjacentElement('afterend',hint)}
  hint.textContent='Open a project, then use Publish to GitHub to put your work in your own repository so recruiters can open it. Connect your GitHub account first with the GitHub button at the bottom of the page.';
}
function paint(){
  var f=folds();if(!f.projects)return;
  var list=rows(f.projects),counts={published:0,draft:0,none:0};
  list.forEach(function(r,i){var k=decorate(r,i);if(k)counts[k]++});
  var s=f.projects.querySelector(':scope > summary');
  if(s&&list.length){
    s.setAttribute('data-cp1-label','Projects');
    s.textContent='Projects';
    s.appendChild(el('span','cp1-fold-count',String(list.length)));
  }
  if(f.projects.open)summaryLine(f.projects,counts,list.length);
  nav(f,list.length);
}
function go(which){
  var f=folds(),d=which==='projects'?f.projects:f.practice;if(!d)return;
  if(!d.open)d.open=true;
  if(which==='projects')loadLevels();
  setTimeout(function(){
    paint();
    try{d.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){d.scrollIntoView()}
    var s=d.querySelector(':scope > summary');if(s){try{s.focus({preventScroll:true})}catch(e){}}
  },60);
}
function nav(f,projectCount){
  var box=document.querySelector('.csai-cn');if(!box||(!f.projects&&!f.practice))return;
  var group=box.querySelector('.cp1-nav');
  if(!group){
    group=el('div','cp1-nav');
    group.appendChild(el('span','csai-cn-kicker cp1-nav-kicker','Practice'));
    box.appendChild(group);
    group.addEventListener('click',function(e){
      var a=e.target.closest&&e.target.closest('[data-cp1-go]');if(!a)return;
      e.preventDefault();go(a.getAttribute('data-cp1-go'));
    });
  }
  function link(which,label,count){
    var a=group.querySelector('[data-cp1-go="'+which+'"]');
    if(!a){
      a=el('a','cp1-nav-link');a.setAttribute('href','#');a.setAttribute('data-cp1-go',which);
      a.appendChild(el('span','n',''));a.appendChild(el('span','t',label));group.appendChild(a);
    }
    a.querySelector('.n').textContent=count;
  }
  if(f.practice)link('practice','Exercises and checks','✎');
  if(f.projects&&projectCount)link('projects','Projects',String(projectCount));
}
function boot(){
  paint();
  document.addEventListener('toggle',function(e){
    var d=e.target;if(!d||!d.matches)return;
    if(d.matches('details.csai-heavy-fold')||d.matches('details.csai-lazy-item')){
      if(d.open&&d.matches('details.csai-heavy-fold'))loadLevels();
      setTimeout(paint,0);
    }
  },true);
  /* Typing in a project editor saves a draft in this window; refresh the status badge shortly after. */
  var timer=null;
  document.addEventListener('input',function(e){
    if(!e.target||!e.target.closest||!e.target.closest('.project-card'))return;
    clearTimeout(timer);timer=setTimeout(paint,700);
  },true);
  window.addEventListener('storage',function(e){if(!e.key||e.key===ACTIVITY||e.key.indexOf(DRAFT)===0)paint()});
  window.addEventListener('csai-progress-updated',paint);
  /* The fold and the sidebar are built by other deferred layers; paint again once they exist. */
  [300,1200,3000].forEach(function(ms){setTimeout(paint,ms)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
