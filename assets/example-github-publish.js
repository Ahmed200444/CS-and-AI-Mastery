(function(){
'use strict';
var STATUS_URL='/api/github/status';
var FILE_URL='/api/github/file';
var STORE_KEY='csai-github-preferred-repo';

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function slug(v){return String(v||'example').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'example';}
function meta(){try{var n=document.getElementById('course-page-meta');return n?JSON.parse(n.textContent||'{}'):{};}catch(e){return{};}}
function courseId(){var m=meta();return slug(m.id||location.pathname.split('/').pop()||'course');}
function languageFor(variant){var lang=String(variant.getAttribute('data-lang-variant')||'').toLowerCase();return lang==='cpp'?'cpp':lang==='python'?'python':'';}
function languageLabel(lang){return lang==='cpp'?'C++':'Python';}
function folder(lang){return lang==='cpp'?'C++':'Python';}
function extension(lang){return lang==='cpp'?'cpp':'py';}
function codeFor(variant){var pre=variant.querySelector('[data-csai-language-generated],.csai-language-code');return String(pre&&pre.textContent||'').trimEnd();}
function lessonTitle(variant){
 var lesson=variant.closest('.lesson,details,[data-lesson]');
 var h=lesson&&lesson.querySelector('summary .title,summary h2,summary h3,summary,h2,h3');
 var text=String(h&&h.textContent||variant.getAttribute('data-example-title')||'example').replace(/\s+/g,' ').trim();
 return text||'example';
}
function examplePath(variant,lang){return 'student-code/'+folder(lang)+'/'+courseId()+'/examples/'+slug(lessonTitle(variant))+'-example.'+extension(lang);}
async function status(){
 var r=await fetch(STATUS_URL,{credentials:'same-origin',cache:'no-store'});
 var d=await r.json().catch(function(){return{};});
 if(!r.ok)throw new Error(d.error||'Could not check GitHub connection');
 if(!d.connected)throw new Error('GitHub is not connected');
 return d;
}
function chooseRepo(d){
 var repos=Array.isArray(d.repositories)?d.repositories:[],preferred='';
 try{preferred=localStorage.getItem(STORE_KEY)||'';}catch(e){}
 var found=repos.find(function(r){return r.full_name===preferred;})||repos.find(function(r){return r.full_name==='Ahmed200444/CS-and-AI-Mastery';})||repos[0];
 return found&&found.full_name;
}
function show(variant,text,kind){
 var n=variant.querySelector('[data-example-github-status]');if(!n)return;
 n.textContent=text||'';n.style.color=kind==='ok'?'#16805b':kind==='err'?'#d65363':'';n.style.fontWeight=kind?'800':'';
}
async function publish(button,variant){
 var lang=languageFor(variant),code=codeFor(variant);if(!lang||!code)return;
 var title=lessonTitle(variant),path=examplePath(variant,lang),old=button.textContent;
 button.disabled=true;button.textContent='Publishing…';show(variant,'Publishing '+path+'…','');
 try{
  var d=await status(),repository=chooseRepo(d);if(!repository)throw new Error('No GitHub repository is available');
  var r=await fetch(FILE_URL,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSAI-CSRF':d.csrf},body:JSON.stringify({repository:repository,path:path,content:code+'\n',message:'Update '+title+' example ('+languageLabel(lang)+') from CS & AI Mastery'})});
  var result=await r.json().catch(function(){return{};});if(!r.ok)throw new Error(result.error||'GitHub publish failed');
  button.textContent='Published ✓';show(variant,'Published ✓  '+path,'ok');
  setTimeout(function(){button.disabled=false;button.textContent=old;},1800);
 }catch(error){button.disabled=false;button.textContent=old;show(variant,error.message||String(error),'err');}
}
function addStyle(){if(document.getElementById('csai-example-github-style'))return;var s=document.createElement('style');s.id='csai-example-github-style';s.textContent='.csai-example-publish{border:1px solid var(--border);border-radius:8px;background:var(--panel);color:var(--text);padding:8px 12px;font:800 13px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer}.csai-example-publish:hover{filter:brightness(1.06)}.csai-example-publish:disabled{opacity:.58;cursor:wait}.csai-example-github-status{font-size:.74rem;line-height:1.3;color:var(--muted);font-weight:700;flex-basis:100%}';document.head.appendChild(s);}
function enhance(variant){
 if(variant.hasAttribute('data-example-github-ready'))return;
 var lang=languageFor(variant);if(!lang)return;
 var actions=variant.querySelector('.csai-example-actions'),run=actions&&actions.querySelector('[data-run-language-example]'),code=codeFor(variant);if(!actions||!run||!code)return;
 variant.setAttribute('data-example-github-ready','1');
 var button=document.createElement('button');button.type='button';button.className='csai-example-publish';button.setAttribute('data-publish-language-example',lang);button.textContent='Publish '+languageLabel(lang)+' to GitHub';
 var statusNode=document.createElement('span');statusNode.className='csai-example-github-status';statusNode.setAttribute('data-example-github-status','');
 run.insertAdjacentElement('afterend',button);actions.appendChild(statusNode);
 button.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();publish(button,variant);});
}
function scan(){document.querySelectorAll('[data-lang-variant="python"],[data-lang-variant="cpp"]').forEach(enhance);}
addStyle();scan();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){scan();setTimeout(scan,250);setTimeout(scan,900);},{once:true});
var observer=new MutationObserver(function(records){if(records.some(function(r){return r.addedNodes&&r.addedNodes.length;}))setTimeout(scan,0);});
observer.observe(document.documentElement,{childList:true,subtree:true});
})();
