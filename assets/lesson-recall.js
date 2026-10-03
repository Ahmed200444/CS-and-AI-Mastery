(function(){
'use strict';
var mounted=new WeakSet();
var id=(location.pathname.split('/').pop()||'').replace(/\.html$/,'');
function mount(lesson){
 if(mounted.has(lesson)||!lesson.open)return;var body=lesson.querySelector('.body');if(!body)return;
 var lessonId=lesson.getAttribute('data-lesson');if(!lessonId)return;mounted.add(lesson);
 var title=lesson.querySelector('summary .title'),heading=Array.from(body.querySelectorAll('h3')).find(function(h){return /what you will learn/i.test(h.textContent);});
 var list=heading&&heading.nextElementSibling,objectives=list&&list.matches('ul,ol')?Array.from(list.querySelectorAll('li')).map(function(n){return n.textContent.trim();}):[];
 var panel=document.createElement('details');panel.className='lesson-recall';var summary=document.createElement('summary');summary.textContent='Explain it yourself';panel.appendChild(summary);
 var prompt=document.createElement('p');prompt.textContent='Without copying the explanation, describe '+(title?title.textContent.trim():'this lesson')+' in your own words. Use one concrete example and explain why its result is correct.';panel.appendChild(prompt);
 if(objectives.length){var goals=document.createElement('ul');objectives.slice(0,4).forEach(function(o){var li=document.createElement('li');li.textContent=o;goals.appendChild(li);});panel.appendChild(goals);}
 var label=document.createElement('label');label.textContent='Your explanation';var input=document.createElement('textarea');input.className='lesson-recall-notes';input.rows=4;input.placeholder='Explain the concept, trace a result, then describe one change you would test.';label.appendChild(input);panel.appendChild(label);
 var key='csai-lesson-recall:v1:'+id+':'+lessonId,status=document.createElement('p');status.className='lesson-recall-status';status.setAttribute('role','status');panel.appendChild(status);
 try{input.value=localStorage.getItem(key)||'';status.textContent=input.value?'Restored from this device.':'Notes save on this device.';}catch(e){status.textContent='Storage unavailable. Copy your notes before leaving.';}
 input.addEventListener('input',function(){try{localStorage.setItem(key,input.value);status.textContent='Saved on this device.';}catch(e){status.textContent='Could not save. Copy your notes before leaving.';}});
 var check=document.createElement('p');check.textContent='Self-check: compare your explanation with the lesson above. Check the result and the common mistake. Completing a lesson records your choice; these notes are not automatically graded.';panel.appendChild(check);body.appendChild(panel);
}
function boot(){if(!/\/courses\/[^/]+\.html$/.test(location.pathname))return;var style=document.createElement('style');style.textContent='.lesson-recall{margin:18px 0 8px;padding:14px;border:1px solid var(--border);border-radius:9px;background:var(--panel);font-size:1rem}.lesson-recall>summary{font-weight:700;cursor:pointer}.lesson-recall label{display:block}.lesson-recall-notes{display:block;width:100%;min-height:110px;margin-top:6px;padding:10px;border:1px solid var(--border);border-radius:7px;color:var(--text);background:var(--bg);font:inherit;resize:vertical}.lesson-recall-status{font-size:14px;color:var(--muted)}';document.head.appendChild(style);document.querySelectorAll('.lesson[open]').forEach(mount);document.addEventListener('toggle',function(e){if(e.target.matches&&e.target.matches('.lesson')&&e.target.open)mount(e.target);},true);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
