(function(){
'use strict';

var STATUS_URL='/api/github/status';
var FILE_URL='/api/github/file';
var STORE_KEY='csai-github-preferred-repo';
var dataNode=document.getElementById('csai-assessment-data');
var DATA={};
try{DATA=dataNode?JSON.parse(dataNode.textContent||'{}'):{};}catch(e){DATA={};}
var courseId=String(DATA.courseId||'course');

function slug(v){return String(v||'practice').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'practice';}
function mainEditor(task){return task&&task.querySelector('textarea[data-editor]:not(.oa-answer)');}
function titleFor(task){return String(task.getAttribute('data-title')||(task.querySelector('.oa-prompt h3')||{}).textContent||(task.querySelector('h3')||{}).textContent||'exercise').trim();}
function isDual(task){return String(task&&task.getAttribute('data-csai-active-language')||'').toLowerCase()==='dual';}
function looksCpp(code){code=String(code||'');return /#include\s*[<"]|\bstd::|\bcout\s*<<|\bcin\s*>>|\bvector\s*</.test(code)||/\bint\s+main\s*\(/.test(code);}
function looksPython(code){code=String(code||'');return /(^|\n)\s*(def\s+|class\s+|from\s+|import\s+|for\s+\w+\s+in\s+|while\s+.+:|if\s+.+:|elif\s+.+:|print\s*\()/.test(code)||/\brange\s*\(|\blen\s*\(/.test(code);}
function folderFor(lang){return lang==='cpp'?'C++':'Python';}
function extFor(lang){return lang==='cpp'?'cpp':'py';}
function messageNode(task){var n=task.querySelector('[data-msg]');if(n)return n;n=document.createElement('span');n.className='gh-inline-msg';n.setAttribute('data-msg','');var toolbar=task.querySelector('.oa-toolbar,.oa-response-actions');if(toolbar)toolbar.appendChild(n);return n;}
function show(task,text,kind){var n=messageNode(task);if(!n)return;n.textContent=text;n.style.color=kind==='ok'?'#16805b':kind==='err'?'#d65363':'';n.style.fontWeight=kind?'800':'';}
function mismatch(lang,code){if(lang==='cpp'&&looksPython(code)&&!looksCpp(code))return'This looks like Python. Use “Publish to Python” or rewrite it as C++ first.';if(lang==='python'&&looksCpp(code))return'This looks like C++. Use “Publish to C++” or rewrite it as Python first.';return'';}
function pathFor(task,lang){return 'student-code/'+folderFor(lang)+'/'+slug(courseId)+'/'+slug(titleFor(task))+'.'+extFor(lang);}

function removeSecondEditor(task){task.querySelectorAll('[data-dual-cpp-pane],[data-dual-cpp-editor]').forEach(function(n){n.remove();});}
function dualControls(task){
 var toolbar=task.querySelector('.oa-toolbar,.oa-response-actions');if(!toolbar)return null;
 var controls=toolbar.querySelector('[data-dual-publish-controls]');
 if(!controls){
   controls=document.createElement('span');controls.setAttribute('data-dual-publish-controls','');controls.style.display='contents';
   var py=document.createElement('button');py.type='button';py.className='oa-btn publish';py.setAttribute('data-dual-publish-language','python');py.textContent='Publish to Python';
   var cpp=document.createElement('button');cpp.type='button';cpp.className='oa-btn publish';cpp.setAttribute('data-dual-publish-language','cpp');cpp.textContent='Publish to C++';
   controls.appendChild(py);controls.appendChild(cpp);toolbar.appendChild(controls);
 }
 return controls;
}
function setFileLabel(task,dual){var label=task.querySelector('[data-file-label]');if(!label||!dual)return;var next=slug(titleFor(task))+'.py / '+slug(titleFor(task))+'.cpp';if(label.textContent!==next)label.textContent=next;}
function setupTask(task){
 if(!task||!mainEditor(task))return;
 removeSecondEditor(task);
 var generic=task.querySelector('[data-publish]');
 var controls=task.querySelector('[data-dual-publish-controls]');
 if(isDual(task)){
   if(generic){generic.hidden=true;generic.setAttribute('aria-hidden','true');}
   dualControls(task);setFileLabel(task,true);
   task.setAttribute('data-csai-dual-single-editor','true');
 }else{
   if(generic){generic.hidden=false;generic.removeAttribute('aria-hidden');}
   if(controls)controls.remove();
   task.removeAttribute('data-csai-dual-single-editor');
 }
}
function refresh(){document.querySelectorAll('.oa-task').forEach(setupTask);}

async function status(){var r=await fetch(STATUS_URL,{credentials:'same-origin',cache:'no-store'});var d=await r.json().catch(function(){return{};});if(!r.ok)throw new Error(d.error||'Could not check GitHub connection');if(!d.connected)throw new Error('GitHub is not connected');return d;}
function chooseRepo(d){var repos=Array.isArray(d.repositories)?d.repositories:[],preferred='';try{preferred=localStorage.getItem(STORE_KEY)||'';}catch(e){}var found=repos.find(function(r){return r.full_name===preferred;})||repos.find(function(r){return r.full_name==='Ahmed200444/CS-and-AI-Mastery';})||repos[0];return found&&found.full_name;}
async function publish(task,button,lang){
 var editor=mainEditor(task),content=String(editor&&editor.value||'').trimEnd();
 if(!content){show(task,'Write your solution first.','err');return;}
 var problem=mismatch(lang,content);if(problem){show(task,problem,'err');return;}
 var title=titleFor(task),folder=folderFor(lang),path=pathFor(task,lang),old=button.textContent;
 button.disabled=true;button.textContent='Publishing…';show(task,'Publishing '+path+'…','');
 try{
   var d=await status(),repository=chooseRepo(d);if(!repository)throw new Error('No GitHub repository is available');
   var r=await fetch(FILE_URL,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSAI-CSRF':d.csrf},body:JSON.stringify({repository:repository,path:path,content:content+'\n',message:'Update '+title+' ('+folder+') from CS & AI Mastery'})});
   var result=await r.json().catch(function(){return{};});if(!r.ok)throw new Error(result.error||'GitHub publish failed');
   button.textContent='Published ✓';show(task,'Published ✓  '+path,'ok');setTimeout(function(){button.textContent=old;button.disabled=false;},1800);
 }catch(error){button.textContent=old;button.disabled=false;show(task,error.message||String(error),'err');}
}

document.addEventListener('click',function(e){var button=e.target.closest&&e.target.closest('[data-dual-publish-language]');if(!button)return;var task=button.closest('.oa-task');if(!task||!isDual(task))return;e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();var lang=button.getAttribute('data-dual-publish-language')==='cpp'?'cpp':'python';publish(task,button,lang);},true);
window.addEventListener('csai-language-mode-change',function(){setTimeout(refresh,0);setTimeout(refresh,80);});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
setTimeout(refresh,120);setTimeout(refresh,600);setTimeout(refresh,1200);
var observer=new MutationObserver(function(){refresh();});observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['data-csai-active-language']});
})();
