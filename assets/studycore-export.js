(function(){
'use strict';

var STYLE_ID='csai-studycore-export-style';
var DIALOG_ID='csai-studycore-export-dialog';
var BUTTON_ID='csai-studycore-export-button';
var catalogCache=null;
var courseCache=new Map();
var manifestCache=null;

function safeId(value){return /^[a-z0-9-]+$/.test(String(value||''))?String(value):''}
function uniqueIds(values){var seen=new Set();return (values||[]).map(safeId).filter(function(id){if(!id||seen.has(id))return false;seen.add(id);return true})}
function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]})}

async function fetchJson(url){
  var response=await fetch(url,{cache:'no-store',headers:{accept:'application/json'}});
  if(!response.ok)throw new Error('Could not load the CS & AI Mastery export data ('+response.status+').');
  return response.json();
}
async function manifest(){
  if(manifestCache)return manifestCache;
  var value=await fetchJson('/assets/studycore-export-manifest.json');
  if(!value||value.schemaVersion!==1||!value.commit||!value.version)throw new Error('The StudyCore export manifest is invalid.');
  manifestCache=value;
  return value;
}
async function catalog(){
  if(catalogCache)return catalogCache;
  var value=await fetchJson('/assets/catalog-data.json');
  if(!value||!Array.isArray(value.courses))throw new Error('The course catalog is invalid.');
  catalogCache=value;
  return value;
}
async function course(id){
  id=safeId(id);
  if(!id)throw new Error('Choose a valid course.');
  if(courseCache.has(id))return courseCache.get(id);
  var value=await fetchJson('/assets/course-data/'+encodeURIComponent(id)+'.json');
  if(!value||value.id!==id||!Array.isArray(value.lessons))throw new Error('This course could not be prepared for StudyCore.');
  courseCache.set(id,value);
  return value;
}

function mdText(value){return String(value==null?'':value).replace(/\r\n?/g,'\n').trim()}
function mdList(values){return (Array.isArray(values)?values:[]).map(function(value){return'- '+mdText(value)}).join('\n')}
function fenced(value){var text=mdText(value);var fence=text.indexOf('```')>=0?'````':'```';return fence+'\n'+text+'\n'+fence}
function buildStudyCoreMarkdown(courseData,lessonIds,target,meta){
  if(!courseData||!safeId(courseData.id)||!Array.isArray(courseData.lessons))throw new Error('Choose a valid course first.');
  var ids=uniqueIds(lessonIds);
  if(!ids.length)throw new Error('Choose at least one lesson.');
  var wanted=new Set(ids);
  var lessons=courseData.lessons.filter(function(lesson){return lesson&&wanted.has(safeId(lesson.id))});
  if(!lessons.length)throw new Error('The selected lessons could not be found.');
  if(lessons.length!==ids.length)throw new Error('One or more selected lessons are unavailable in this course.');
  var intent=target==='materials'?'materials':'flashcards';
  var title=mdText(courseData.title||courseData.name||courseData.id);
  var lines=[
    '# CS & AI Mastery — '+title,
    '',
    '> StudyCore-ready export generated from CS & AI Mastery.',
    '> Intended StudyCore action: '+(intent==='flashcards'?'import this file as course material, then generate flashcards from only these selected lessons.':'import this file as course material.'),
    '',
    '## Export metadata',
    '',
    '- Source: CS & AI Mastery',
    '- Repository: Ahmed200444/CS-and-AI-Mastery',
    '- Course ID: '+courseData.id,
    '- Course: '+title,
    '- Selected lesson IDs: '+ids.join(', '),
    '- StudyCore intent: '+intent,
    '- Source version: '+mdText(meta&&meta.version||'unknown'),
    '- Source commit: '+mdText(meta&&meta.commit||'unknown'),
    ''
  ];
  lessons.forEach(function(lesson,index){
    var lessonTitle=mdText(lesson.title||lesson.id||('Lesson '+(index+1)));
    lines.push('## Lesson '+(index+1)+' — '+lessonTitle,'');
    var objectives=Array.isArray(lesson.objectives)?lesson.objectives:[];
    if(objectives.length)lines.push('### What you will learn','',mdList(objectives),'');
    var explanation=mdText(lesson.explanation||lesson.explain||lesson.description||'');
    if(explanation)lines.push('### Explanation','',explanation,'');
    var concepts=Array.isArray(lesson.concepts)?lesson.concepts:[];
    if(concepts.length)lines.push('### Key concepts','',mdList(concepts),'');
    var examples=lesson.examples||lesson.example;
    examples=Array.isArray(examples)?examples:(examples?[examples]:[]);
    if(examples.length){
      lines.push('### Examples','');
      examples.forEach(function(example,exampleIndex){lines.push('#### Example '+(exampleIndex+1),'',fenced(example),'')});
    }
    var mistakes=lesson.commonMistakes||lesson.commonMistake;
    mistakes=Array.isArray(mistakes)?mistakes:(mistakes?[mistakes]:[]);
    if(mistakes.length)lines.push('### Common mistakes','',mdList(mistakes),'');
  });
  lines.push('---','','Exported for StudyCore from CS & AI Mastery.');
  return lines.join('\n').replace(/\n{3,}/g,'\n\n').trim()+'\n';
}
function exportFileName(courseData,lessonIds,target){
  var ids=uniqueIds(lessonIds),courseId=safeId(courseData&&courseData.id)||'course',intent=target==='materials'?'materials':'flashcards';
  if(ids.length===1)return'cs-ai-mastery-'+courseId+'-'+ids[0]+'-'+intent+'.md';
  return'cs-ai-mastery-'+courseId+'-'+ids.length+'-lessons-'+intent+'.md';
}
function downloadMarkdown(content,fileName){
  var blob=new Blob([content],{type:'text/markdown;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download=fileName;a.style.display='none';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(function(){URL.revokeObjectURL(url)},1000);
}

function addStyle(){
  if(document.getElementById(STYLE_ID))return;
  var style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=
    '#'+DIALOG_ID+'{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;padding:18px;background:rgba(5,10,18,.72);backdrop-filter:blur(9px);font-family:"Segoe UI",-apple-system,BlinkMacSystemFont,Roboto,sans-serif}'+
    '#'+DIALOG_ID+' *{box-sizing:border-box}.sce-panel{width:min(780px,100%);max-height:min(780px,92vh);overflow:auto;border:1px solid rgba(255,255,255,.13);border-radius:18px;background:#111827;color:#f2f6fa;box-shadow:0 30px 90px rgba(0,0,0,.45)}.sce-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:20px 20px 14px;border-bottom:1px solid rgba(255,255,255,.1)}.sce-head h2{margin:3px 0 4px;font-size:1.35rem}.sce-head p{margin:0;color:#b8c3cf;font-size:.86rem;line-height:1.5}.sce-kicker{font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:#4fd1c5;font-weight:800}.sce-close{border:1px solid rgba(255,255,255,.16);border-radius:9px;background:transparent;color:#fff;width:38px;height:38px;font-size:1.2rem;cursor:pointer}.sce-body{padding:18px 20px 20px}.sce-field{display:grid;gap:7px;margin-bottom:14px}.sce-field>span{font-size:.78rem;color:#c5ced8;font-weight:700}.sce-field select{width:100%;min-height:44px;padding:0 11px;border:1px solid rgba(255,255,255,.15);border-radius:9px;background:#0d1521;color:#fff;font:inherit}.sce-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:8px 0 10px}.sce-toolbar strong{margin-right:auto;font-size:.84rem}.sce-small{border:1px solid rgba(255,255,255,.15);border-radius:8px;background:#182333;color:#e8eef5;padding:7px 10px;font-weight:700;cursor:pointer}.sce-lessons{display:grid;gap:7px;max-height:340px;overflow:auto;padding:2px}.sce-lesson{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;align-items:start;padding:10px 11px;border:1px solid rgba(255,255,255,.1);border-radius:9px;background:#0d1521}.sce-lesson input{margin-top:3px}.sce-lesson b{display:block;font-size:.86rem}.sce-lesson small{display:block;margin-top:2px;color:#98a7b7;font-size:.72rem}.sce-targets{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:16px 0}.sce-target{display:flex;gap:9px;align-items:flex-start;padding:12px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:#0d1521}.sce-target b{display:block;font-size:.84rem}.sce-target small{display:block;color:#98a7b7;font-size:.72rem;line-height:1.4;margin-top:2px}.sce-note{padding:10px 12px;border-left:3px solid #4fd1c5;border-radius:7px;background:rgba(79,209,197,.08);color:#cbd5df;font-size:.77rem;line-height:1.5}.sce-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:16px}.sce-actions button{min-height:42px;padding:0 14px;border-radius:9px;font-weight:800;cursor:pointer}.sce-cancel{border:1px solid rgba(255,255,255,.15);background:transparent;color:#fff}.sce-go{border:1px solid #4fd1c5;background:#4fd1c5;color:#062b28}.sce-go:disabled{opacity:.45;cursor:not-allowed}.sce-status{min-height:20px;margin-top:9px;color:#f5bd72;font-size:.78rem}'+
    '#'+BUTTON_ID+'{white-space:nowrap}.sce-studycore-icon{font-weight:900;color:#4fd1c5}'+
    'body[data-theme="light"] #'+DIALOG_ID+'{background:rgba(25,25,31,.42)}body[data-theme="light"] .sce-panel{background:#fff;color:#211f2b;border-color:#dedbe4}body[data-theme="light"] .sce-head{border-color:#e8e5ec}body[data-theme="light"] .sce-head p,body[data-theme="light"] .sce-field>span{color:#65616f}body[data-theme="light"] .sce-field select,body[data-theme="light"] .sce-lesson,body[data-theme="light"] .sce-target{background:#faf9fc;color:#211f2b;border-color:#dedbe4}body[data-theme="light"] .sce-lesson small,body[data-theme="light"] .sce-target small{color:#65616f}body[data-theme="light"] .sce-small{background:#f2f0f5;color:#211f2b;border-color:#dedbe4}body[data-theme="light"] .sce-cancel{color:#211f2b;border-color:#d3ceda}body[data-theme="light"] .sce-note{color:#4b4756}'+
    '@media(max-width:620px){#'+DIALOG_ID+'{padding:8px}.sce-panel{max-height:96vh;border-radius:14px}.sce-head,.sce-body{padding-left:14px;padding-right:14px}.sce-targets{grid-template-columns:1fr}.sce-actions{position:sticky;bottom:0;padding-top:10px;background:inherit}.sce-actions button{flex:1}}';
  document.head.appendChild(style);
}

function closeDialog(){
  var node=document.getElementById(DIALOG_ID);
  if(node)node.remove();
  document.documentElement.style.overflow='';
}

async function openDialog(){
  addStyle();
  closeDialog();
  var overlay=document.createElement('div');
  overlay.id=DIALOG_ID;
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label','Export to StudyCore');
  overlay.innerHTML='<section class="sce-panel"><header class="sce-head"><div><div class="sce-kicker">StudyCore handoff</div><h2>Export lessons to StudyCore</h2><p>Choose one course and exactly the lessons you want. CS & AI Mastery will download one StudyCore-ready Markdown file containing only the lessons you select.</p></div><button class="sce-close" type="button" aria-label="Close">×</button></header><div class="sce-body"><label class="sce-field"><span>Course</span><select data-sce-course><option value="">Loading courses…</option></select></label><div class="sce-toolbar"><strong data-sce-count>0 lessons selected</strong><button class="sce-small" type="button" data-sce-all>Select whole course</button><button class="sce-small" type="button" data-sce-clear>Clear</button></div><div class="sce-lessons" data-sce-lessons><div class="sce-note">Choose a course to load its lessons.</div></div><div class="sce-targets"><label class="sce-target"><input type="radio" name="sce-target" value="flashcards" checked><span><b>Flashcards</b><small>Import the file into StudyCore and generate flashcards from only these selected lessons.</small></span></label><label class="sce-target"><input type="radio" name="sce-target" value="materials"><span><b>Materials only</b><small>Import the file into StudyCore as course material without automatically generating flashcards.</small></span></label></div><div class="sce-note">For accuracy, exports stay one course at a time. The downloaded .md file can be imported directly into StudyCore.</div><div class="sce-status" data-sce-status aria-live="polite"></div><div class="sce-actions"><button class="sce-cancel" type="button">Cancel</button><button class="sce-go" type="button" data-sce-go disabled>Download StudyCore file</button></div></div></section>';
  document.body.appendChild(overlay);
  document.documentElement.style.overflow='hidden';

  var courseSelect=overlay.querySelector('[data-sce-course]');
  var lessonHost=overlay.querySelector('[data-sce-lessons]');
  var countNode=overlay.querySelector('[data-sce-count]');
  var status=overlay.querySelector('[data-sce-status]');
  var go=overlay.querySelector('[data-sce-go]');
  var loadedCourse=null;

  function selectedIds(){return Array.from(lessonHost.querySelectorAll('input[data-sce-lesson]:checked')).map(function(input){return input.value})}
  function updateCount(){var n=selectedIds().length;countNode.textContent=n+' '+(n===1?'lesson':'lessons')+' selected';go.disabled=!loadedCourse||!n}

  async function loadCourse(id){
    loadedCourse=null; go.disabled=true; status.textContent='';
    if(!id){lessonHost.innerHTML='<div class="sce-note">Choose a course to load its lessons.</div>';updateCount();return}
    lessonHost.innerHTML='<div class="sce-note">Loading lessons…</div>';
    try{
      var value=await course(id);
      loadedCourse=value;
      if(!value.lessons.length){lessonHost.innerHTML='<div class="sce-note">This course does not contain exportable lessons yet.</div>';updateCount();return}
      lessonHost.innerHTML=value.lessons.map(function(lesson,index){
        var id=safeId(lesson.id||'');
        if(!id)return'';
        return'<label class="sce-lesson"><input type="checkbox" data-sce-lesson value="'+esc(id)+'"><span><b>'+esc((index+1)+'. '+(lesson.title||id))+'</b><small>'+esc((lesson.estimatedMinutes?lesson.estimatedMinutes+' min · ':'')+(Array.isArray(lesson.concepts)&&lesson.concepts.length?lesson.concepts.slice(0,3).join(' · '):'Lesson content'))+'</small></span></label>';
      }).join('');
      updateCount();
    }catch(error){
      lessonHost.innerHTML='<div class="sce-note">Could not load this course. Try again.</div>';
      status.textContent=error&&error.message?error.message:String(error);
      updateCount();
    }
  }

  overlay.addEventListener('click',function(event){
    if(event.target===overlay||event.target.closest('.sce-close')||event.target.closest('.sce-cancel')){closeDialog();return}
    if(event.target.closest('[data-sce-all]')){lessonHost.querySelectorAll('input[data-sce-lesson]').forEach(function(input){input.checked=true});updateCount();return}
    if(event.target.closest('[data-sce-clear]')){lessonHost.querySelectorAll('input[data-sce-lesson]').forEach(function(input){input.checked=false});updateCount();return}
    if(event.target.closest('[data-sce-go]')){
      var ids=selectedIds(); if(!loadedCourse||!ids.length)return;
      var target=(overlay.querySelector('input[name="sce-target"]:checked')||{}).value||'flashcards';
      go.disabled=true; status.textContent='Checking the export release…';
      Promise.all([manifest()]).then(function(values){
              var m=values[0];
              var content=buildStudyCoreMarkdown(loadedCourse,ids,target,m);
              var fileName=exportFileName(loadedCourse,ids,target);
              downloadMarkdown(content,fileName);
              status.textContent='Downloaded '+fileName+'. '+(target==='flashcards'?'Import it into StudyCore and generate flashcards from the selected lessons.':'Import it into StudyCore.');
              go.disabled=false;
            }).catch(function(error){status.textContent=error&&error.message?error.message:String(error);go.disabled=false});
    }
  });
  overlay.addEventListener('change',function(event){
    if(event.target===courseSelect){void loadCourse(courseSelect.value);return}
    if(event.target.matches('input[data-sce-lesson]'))updateCount();
  });
  overlay.addEventListener('keydown',function(event){if(event.key==='Escape')closeDialog()});

  try{
    var cat=await catalog();
    var courses=cat.courses.filter(function(item){return item&&safeId(item.id)&&item.status!=='planned'});
    courseSelect.innerHTML='<option value="">Choose a course…</option>'+courses.map(function(item){return'<option value="'+esc(item.id)+'">'+esc((item.icon?item.icon+' ':'')+item.title)+'</option>'}).join('');
    courseSelect.focus();
  }catch(error){
    courseSelect.innerHTML='<option value="">Course list unavailable</option>';
    status.textContent=error&&error.message?error.message:String(error);
  }
}

function init(){
  if(document.getElementById(BUTTON_ID))return;
  var hub=document.getElementById('hub');
  if(!hub)return;
  var triggers=hub.querySelectorAll('.gs-trigger');
  var row=triggers.length?triggers[0].parentElement:null;
  if(!row)return;
  var button=document.createElement('button');
  button.id=BUTTON_ID;
  button.className='gs-trigger';
  button.type='button';
  button.setAttribute('aria-label','Export CS & AI Mastery lessons to StudyCore');
  button.innerHTML='<span class="sce-studycore-icon" aria-hidden="true">↗</span> Export to StudyCore';
  button.addEventListener('click',function(){void openDialog()});
  row.appendChild(button);
}

window.CSAIStudyCoreExport={buildStudyCoreMarkdown:buildStudyCoreMarkdown,exportFileName:exportFileName,uniqueIds:uniqueIds,open:openDialog};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
