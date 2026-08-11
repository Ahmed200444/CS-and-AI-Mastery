(function(){
'use strict';
var section=document.querySelector('.csai-oa-fallback-assessment');
if(!section)return;
var dataNode=document.getElementById('csai-assessment-data'),DATA={};
try{DATA=dataNode?JSON.parse(dataNode.textContent||'{}'):{} }catch(e){DATA={}}
var courseId=String(DATA.courseId||location.pathname.split('/').pop()||'course').replace(/\.html$/,'');
var exercises=Array.isArray(DATA.exercises)?DATA.exercises:[];
var DRAFT='csai-oa-fallback-draft:'+courseId+':';
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function slug(v){return String(v||'exercise').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'exercise'}
function key(task,i){return String(task&&task.getAttribute('data-task')||exercises[i]&&exercises[i].id||('exercise-'+i))}
function starter(title){return '#include <iostream>\nusing namespace std;\n\n// '+String(title||'Course exercise').replace(/\r?\n/g,' ')+'\n// Replace this starter with your solution.\nint main(){\n    cout << "Start your solution" << "\\n";\n    return 0;\n}\n'}
function saveDraft(k,v){try{localStorage.setItem(DRAFT+k,v)}catch(e){}}
function getDraft(k){try{return localStorage.getItem(DRAFT+k)||''}catch(e){return''}}
function removeDraft(k){try{localStorage.removeItem(DRAFT+k)}catch(e){}}
function mark(task){var solved=task.querySelector('[data-solved]');if(solved)solved.textContent='✓ solved';task.dispatchEvent(new CustomEvent('csai-oa-fallback-updated',{bubbles:true}))}
function restore(){Array.prototype.forEach.call(section.querySelectorAll('.oa-task'),function(task,i){var ed=task.querySelector('[data-editor]'),saved=getDraft(key(task,i));if(ed&&saved)ed.value=saved})}
section.addEventListener('input',function(e){if(!e.target.matches('[data-csai-oa-cpp-editor]'))return;var task=e.target.closest('.oa-task'),i=Array.prototype.indexOf.call(section.querySelectorAll('.oa-task'),task);saveDraft(key(task,i),e.target.value)});
section.addEventListener('click',async function(e){
 var task=e.target.closest('.oa-task');if(!task)return;var tasks=section.querySelectorAll('.oa-task'),i=Array.prototype.indexOf.call(tasks,task),item=exercises[i]||{},k=key(task,i),ed=task.querySelector('[data-editor]'),out=task.querySelector('[data-output]'),msg=task.querySelector('[data-msg]');
 if(e.target.closest('[data-csai-oa-reset]')){if(ed)ed.value=starter(item.title||task.getAttribute('data-title'));removeDraft(k);if(out)out.textContent='Reset.';task.dispatchEvent(new CustomEvent('csai-oa-fallback-updated',{bubbles:true}));return}
 if(e.target.closest('[data-csai-oa-mark]')){mark(task);return}
 if(e.target.closest('[data-csai-oa-publish]')){if(!ed)return;ed.focus();var path='student-code/practice/'+courseId+'/'+slug(item.title||k)+'.cpp';if(window.CSAIMasteryGitHub&&typeof window.CSAIMasteryGitHub.publish==='function'){if(msg)msg.textContent='Publishing…';window.CSAIMasteryGitHub.publish(path);setTimeout(function(){if(msg)msg.textContent='Use the GitHub status bar for publishing status.'},450)}else if(msg)msg.textContent='GitHub connection is still loading…';return}
 var btn=e.target.closest('[data-csai-oa-cpp-run]');if(!btn||!ed||!out)return;e.preventDefault();btn.disabled=true;btn.textContent=window.CSAICppRunner&&window.CSAICppRunner.isReady&&window.CSAICppRunner.isReady()?'Running C++…':'Preparing C++…';out.textContent='Preparing C++ runner…';
 try{if(!window.CSAICppRunner||typeof window.CSAICppRunner.runSource!=='function')throw new Error('C++ runner is still loading. Try again in a moment.');var result=await window.CSAICppRunner.runSource(ed.value,out);out.innerHTML='<span class="'+(result.error?'bad':'ok')+'">'+(result.error?'Run error':'Run complete')+'</span>\n'+esc(result.text||'(no output)')+'\n\n'+(result.warm?'Warm C++ run: ':'C++ first run: ')+result.milliseconds+' ms';task.dispatchEvent(new CustomEvent('csai-oa-fallback-updated',{bubbles:true}))}catch(error){out.innerHTML='<span class="bad">Runner error</span>\n'+esc(error.message||String(error))}finally{btn.disabled=false;btn.textContent='▶ Run code'}
});
restore();
})();
