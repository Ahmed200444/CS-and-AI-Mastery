(function(){
'use strict';
var meta={};try{var n=document.getElementById('course-page-meta');meta=n?JSON.parse(n.textContent||'{}'):{};}catch(e){}
if(String(meta.id||'').toLowerCase()!=='cpp')return;

function enhanceLessonCards(){
 document.querySelectorAll('.lesson-run-card').forEach(function(card){
  if(card.getAttribute('data-cpp-course-ready')==='1')return;
  var pre=card.querySelector('pre.code');
  var toolbar=card.querySelector('.lesson-run-toolbar');
  var oldButton=toolbar&&toolbar.querySelector('[data-run-example],.lesson-run-btn');
  var out=card.querySelector('[data-example-output],.lesson-run-output');
  if(!pre||!toolbar||!oldButton||!out)return;
  card.setAttribute('data-lang-variant','cpp');
  card.setAttribute('data-cpp-course-ready','1');
  pre.classList.add('csai-language-code');
  pre.setAttribute('data-csai-language-generated','');
  toolbar.classList.add('csai-example-actions');
  var button=oldButton.cloneNode(true);
  oldButton.replaceWith(button);
  button.removeAttribute('data-run-example');
  button.setAttribute('data-run-language-example','');
  button.classList.add('csai-example-run');
  button.textContent='▶ Run example';
  var label=toolbar.querySelector('.lesson-run-lang');if(label)label.textContent='C++';
  var ready=toolbar.querySelector('.csai-example-note');
  if(!ready){ready=document.createElement('span');ready.className='csai-example-note';ready.textContent='C++ compiler warming in background…';toolbar.appendChild(ready);}
  out.setAttribute('data-csai-example-output','');
  out.classList.add('csai-example-output');
 });
}

function forceCppAssessment(){
 var data=document.getElementById('csai-assessment-data');
 var payload={};try{payload=data?JSON.parse(data.textContent||'{}'):{};}catch(e){}
 if(String(payload.courseId||'')!=='cpp')return;
 var note=document.querySelector('.assess-note');
 if(note)note.textContent='C++ assessment workspace: write, compile, run, reveal solutions, and publish your .cpp work to GitHub.';
 document.querySelectorAll('.oa-task').forEach(function(task){
  if(!task.querySelector('.oa-editor'))return;
  task.setAttribute('data-csai-active-language','cpp');
  var select=task.querySelector('[data-lang]');
  if(select){var span=document.createElement('span');span.textContent='C++';select.replaceWith(span);}
  var label=task.querySelector('[data-file-label]');if(label){var title=String(task.getAttribute('data-title')||'exercise').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'exercise';label.textContent=title+'.cpp';}
 });
}

function runExerciseThroughCpp(task,button){
 var editor=task.querySelector('.oa-editor[data-editor]'),out=task.querySelector('[data-output]');
 if(!editor||!out)return;
 var old=task.querySelector('[data-cpp-assessment-runner]');if(old)old.remove();
 var host=document.createElement('div');host.setAttribute('data-cpp-assessment-runner','');host.setAttribute('data-lang-variant','cpp');host.style.display='none';
 var pre=document.createElement('pre');pre.className='csai-language-code';pre.setAttribute('data-csai-language-generated','');pre.textContent=editor.value;
 var proxyOut=document.createElement('pre');proxyOut.setAttribute('data-csai-example-output','');
 var proxyButton=document.createElement('button');proxyButton.type='button';proxyButton.setAttribute('data-run-language-example','');proxyButton.textContent='▶ Run example';
 host.append(pre,proxyButton,proxyOut);task.appendChild(host);
 button.disabled=true;out.textContent='Sending your C++ to the compiler…';
 var observer=new MutationObserver(function(){
  var text=String(proxyOut.textContent||'');
  if(!/Output|Run error/.test(text)){
   if(text&&text!=='Ready.')out.textContent=text;
   return;
  }
  observer.disconnect();
  out.innerHTML=proxyOut.innerHTML;
  button.disabled=false;
  host.remove();
 });
 observer.observe(proxyOut,{childList:true,subtree:true,characterData:true});
 proxyButton.click();
 setTimeout(function(){if(document.contains(host)){observer.disconnect();button.disabled=false;out.textContent='C++ run did not finish. Press Run code to retry.';host.remove();}},125000);
}

document.addEventListener('click',function(e){
 var button=e.target&&e.target.closest&&e.target.closest('.oa-task [data-run]');if(!button)return;
 var task=button.closest('.oa-task');if(!task||String(task.getAttribute('data-csai-active-language'))!=='cpp')return;
 e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();
 runExerciseThroughCpp(task,button);
},true);

function scan(){enhanceLessonCards();forceCppAssessment();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){scan();setTimeout(scan,100);setTimeout(scan,500);setTimeout(scan,1200);},{once:true});else{scan();setTimeout(scan,100);setTimeout(scan,500);}
new MutationObserver(function(records){if(records.some(function(r){return r.addedNodes&&r.addedNodes.length;}))setTimeout(scan,0);}).observe(document.documentElement,{childList:true,subtree:true});
})();
