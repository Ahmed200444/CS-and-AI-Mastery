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
function looksCpp(code){return /#include\s*[<"]|\bstd::|\bcout\s*<<|\bcin\s*>>|\bvector\s*</.test(code)||/\bint\s+main\s*\(/.test(code);}
function languageLabel(lang){return lang==='cpp'?'C++':lang==='python'?'Python':lang==='javascript'?'JavaScript':lang==='sql'?'SQL':lang==='html'?'HTML':'Other';}
function extForLanguage(lang){return lang==='cpp'?'cpp':lang==='python'?'py':lang==='javascript'?'js':lang==='sql'?'sql':lang==='html'?'html':'txt';}
function selectedLanguage(task){
  var mode=String(task.getAttribute('data-csai-active-language')||'').toLowerCase();
  if(mode==='cpp')return'cpp';
  if(mode==='python')return'python';
  if(mode==='dual'){
    var dual=String(task.getAttribute('data-csai-dual-publish-language')||'').toLowerCase();
    return dual==='cpp'?'cpp':'python';
  }
  var select=task.querySelector('[data-lang]');
  var lang=select&&String(select.value||'').toLowerCase();
  if(lang==='c++')lang='cpp';
  if(['cpp','python','javascript','sql','html'].includes(lang))return lang;
  var editor=task.querySelector('[data-editor]');
  var code=String(editor&&editor.value||'');
  if(looksCpp(code))return'cpp';
  if(/\b(def|class|import|from)\b/.test(code)||/^\s*print\s*\(/m.test(code))return'python';
  if(/\b(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE)\b/i.test(code))return'sql';
  if(/\b(const|let|function|=>)\b/.test(code))return'javascript';
  if(/<[a-z][\s\S]*>/i.test(code))return'html';
  return'text';
}
function editorFor(task,lang){
  if(lang==='cpp'){
    var dualCpp=task.querySelector('[data-dual-cpp-editor]');
    if(dualCpp)return dualCpp;
  }
  return task.querySelector('[data-editor]');
}
function extension(task,lang){
  if(lang)return extForLanguage(lang);
  var label=task.querySelector('[data-file-label]');
  var m=label&&String(label.textContent||'').match(/\.([a-z0-9+]+)$/i);
  if(m){var ext=m[1].toLowerCase();if(ext==='cpp'||ext==='cc'||ext==='cxx')return'cpp';return ext;}
  return extForLanguage(selectedLanguage(task));
}
function languageFolder(ext){
  if(ext==='cpp')return'C++';
  if(ext==='py')return'Python';
  if(ext==='js')return'JavaScript';
  if(ext==='sql')return'SQL';
  if(ext==='html')return'HTML';
  return'Other';
}
function titleFor(task){return String(task.getAttribute('data-title')||task.querySelector('.oa-prompt h3')?.textContent||task.querySelector('h3')?.textContent||'exercise').trim();}
function exercisePath(task,lang){
  var title=titleFor(task);
  var ext=extension(task,lang);
  return 'student-code/'+languageFolder(ext)+'/'+slug(courseId)+'/'+slug(title)+'.'+ext;
}
function messageNode(task){
  var n=task.querySelector('[data-msg]');
  if(n)return n;
  n=document.createElement('span');
  n.className='gh-inline-msg';
  n.setAttribute('data-msg','');
  var toolbar=task.querySelector('.oa-toolbar,.oa-response-actions');
  if(toolbar)toolbar.appendChild(n);
  return n;
}
function show(task,text,kind){
  var n=messageNode(task);if(!n)return;
  n.textContent=text;
  n.style.color=kind==='ok'?'#16805b':kind==='err'?'#d65363':'';
  n.style.fontWeight=kind?'800':'';
}
function refreshPublishLabel(task){
  if(String(task.getAttribute('data-csai-active-language')||'').toLowerCase()!=='dual')return;
  var button=task.querySelector('[data-publish]');
  if(!button||button.disabled)return;
  var lang=selectedLanguage(task);
  button.textContent='Publish '+languageLabel(lang)+' to GitHub';
}
function rememberDualEditor(target){
  if(!target||!target.matches)return;
  var task=target.closest('.oa-task');if(!task)return;
  if(String(task.getAttribute('data-csai-active-language')||'').toLowerCase()!=='dual')return;
  if(target.matches('[data-dual-cpp-editor]'))task.setAttribute('data-csai-dual-publish-language','cpp');
  else if(target.matches('textarea[data-editor]:not(.oa-answer)'))task.setAttribute('data-csai-dual-publish-language','python');
  else return;
  refreshPublishLabel(task);
}
async function status(){
  var r=await fetch(STATUS_URL,{credentials:'same-origin',cache:'no-store'});
  var d=await r.json().catch(function(){return{};});
  if(!r.ok)throw new Error(d.error||'Could not check GitHub connection');
  if(!d.connected)throw new Error('GitHub is not connected');
  return d;
}
function chooseRepo(d){
  var repos=Array.isArray(d.repositories)?d.repositories:[];
  var preferred='';
  try{preferred=localStorage.getItem(STORE_KEY)||'';}catch(e){}
  var found=repos.find(function(r){return r.full_name===preferred;})||repos.find(function(r){return r.full_name==='Ahmed200444/CS-and-AI-Mastery';})||repos[0];
  return found&&found.full_name;
}
async function publish(task,button){
  var lang=selectedLanguage(task);
  var editor=editorFor(task,lang);
  var content=String(editor&&editor.value||'').trimEnd();
  if(!content){show(task,'Write your '+languageLabel(lang)+' solution first.','err');return;}
  var title=titleFor(task);
  var ext=extension(task,lang);
  var folder=languageFolder(ext);
  var path=exercisePath(task,lang);
  var old=button.textContent;
  button.disabled=true;button.textContent='Publishing…';show(task,'Publishing '+path+'…','');
  try{
    var d=await status();
    var repository=chooseRepo(d);
    if(!repository)throw new Error('No GitHub repository is available');
    var r=await fetch(FILE_URL,{
      method:'POST',credentials:'same-origin',
      headers:{'Content-Type':'application/json','X-CSAI-CSRF':d.csrf},
      body:JSON.stringify({repository:repository,path:path,content:content+'\n',message:'Update '+title+' ('+folder+') from CS & AI Mastery'})
    });
    var result=await r.json().catch(function(){return{};});
    if(!r.ok)throw new Error(result.error||'GitHub publish failed');
    button.textContent='Published ✓';show(task,'Published ✓  '+path,'ok');
    setTimeout(function(){button.textContent=old;button.disabled=false;refreshPublishLabel(task);},1800);
  }catch(error){
    button.textContent=old;button.disabled=false;refreshPublishLabel(task);show(task,error.message||String(error),'err');
  }
}

document.addEventListener('input',function(e){rememberDualEditor(e.target);},true);
document.addEventListener('csai-language-mode-change',function(){setTimeout(function(){document.querySelectorAll('.oa-task').forEach(refreshPublishLabel);},80);});
setTimeout(function(){document.querySelectorAll('.oa-task').forEach(refreshPublishLabel);},600);

document.addEventListener('click',function(e){
  var button=e.target.closest&&e.target.closest('[data-publish]');
  if(!button)return;
  var task=button.closest('.oa-task');
  if(!task)return;
  e.preventDefault();
  e.stopPropagation();
  if(e.stopImmediatePropagation)e.stopImmediatePropagation();
  publish(task,button);
},true);
})();
