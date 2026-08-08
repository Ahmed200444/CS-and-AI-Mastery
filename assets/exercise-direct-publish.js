(function(){
'use strict';

var STATUS_URL='/api/github/status';
var FILE_URL='/api/github/file';
var STORE_KEY='csai-github-preferred-repo';
var LANGUAGE_KEY='csai-primary-language-v1';
var dataNode=document.getElementById('csai-assessment-data');
var DATA={};
try{DATA=dataNode?JSON.parse(dataNode.textContent||'{}'):{};}catch(e){DATA={};}
var courseId=String(DATA.courseId||'course');

function slug(v){return String(v||'practice').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'practice';}
function primaryMode(){try{return localStorage.getItem(LANGUAGE_KEY)||'python';}catch(e){return'python';}}
function looksCpp(code){return /#include\s*[<"]|\bstd::|\bcout\s*<<|\bcin\s*>>|\bvector\s*</.test(code)||/\bint\s+main\s*\(/.test(code);}
function extension(task){
  var select=task.querySelector('[data-lang]');
  var lang=select&&String(select.value||'').toLowerCase();
  if(lang==='cpp'||lang==='c++')return'cpp';
  if(lang==='python')return'py';
  if(lang==='javascript')return'js';
  if(lang==='sql')return'sql';
  if(lang==='html')return'html';

  var label=task.querySelector('[data-file-label]');
  var m=label&&String(label.textContent||'').match(/\.([a-z0-9+]+)$/i);
  if(m){var ext=m[1].toLowerCase();if(ext==='cpp'||ext==='cc'||ext==='cxx')return'cpp';return ext;}

  var editor=task.querySelector('[data-editor]');
  var code=String(editor&&editor.value||'');
  if(looksCpp(code))return'cpp';
  if(/\b(def|class|import|from)\b/.test(code)||/^\s*print\s*\(/m.test(code))return'py';
  if(/\b(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE)\b/i.test(code))return'sql';
  if(/\b(const|let|function|=>)\b/.test(code))return'js';
  if(/<[a-z][\s\S]*>/i.test(code))return'html';

  if(primaryMode()==='cpp')return'cpp';
  return'txt';
}
function titleFor(task){return String(task.getAttribute('data-title')||task.querySelector('.oa-prompt h3')?.textContent||task.querySelector('h3')?.textContent||'exercise').trim();}
function exercisePath(task){
  var title=titleFor(task);
  return 'student-code/practice/'+slug(courseId)+'/'+slug(title)+'.'+extension(task);
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
  var editor=task.querySelector('[data-editor]');
  var content=String(editor&&editor.value||'').trimEnd();
  if(!content){show(task,'Write your solution first.','err');return;}
  var title=titleFor(task);
  var path=exercisePath(task);
  var ext=extension(task);
  var old=button.textContent;
  button.disabled=true;button.textContent='Publishing…';show(task,'Publishing '+path+'…','');
  try{
    var d=await status();
    var repository=chooseRepo(d);
    if(!repository)throw new Error('No GitHub repository is available');
    var r=await fetch(FILE_URL,{
      method:'POST',credentials:'same-origin',
      headers:{'Content-Type':'application/json','X-CSAI-CSRF':d.csrf},
      body:JSON.stringify({repository:repository,path:path,content:content+'\n',message:'Update '+title+' ('+ext+') from CS & AI Mastery'})
    });
    var result=await r.json().catch(function(){return{};});
    if(!r.ok)throw new Error(result.error||'GitHub publish failed');
    button.textContent='Published ✓';show(task,'Published ✓  '+path,'ok');
    setTimeout(function(){button.textContent=old;button.disabled=false;},1800);
  }catch(error){
    button.textContent=old;button.disabled=false;show(task,error.message||String(error),'err');
  }
}

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
