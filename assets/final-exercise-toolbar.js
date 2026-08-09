(function(){
'use strict';

function addStyle(){
  if(document.getElementById('csai-final-toolbar-style'))return;
  var s=document.createElement('style');
  s.id='csai-final-toolbar-style';
  s.textContent=`
    .oa-toolbar{display:flex!important;align-items:center!important;gap:12px!important;flex-wrap:nowrap!important;overflow-x:auto!important;padding:12px 14px!important;scrollbar-width:thin}
    .oa-toolbar .oa-btn{flex:0 0 auto!important;white-space:nowrap!important;margin-left:0!important}
    .oa-toolbar [data-publish]{margin-left:0!important}
    .csai-toolbar-status{display:block;padding:7px 14px 9px;border-bottom:1px solid var(--border);color:var(--muted);font-size:.78rem;min-height:0}
    .csai-toolbar-status:empty{display:none}
    .oa-output-wrap{clear:both}
    .lesson-run-toolbar{gap:10px!important}.lesson-run-btn{white-space:nowrap}
    .evergreen-toolbar{gap:10px!important}
    .evergreen-toolbar .evergreen-btn{white-space:nowrap}
    @media(max-width:620px){.oa-toolbar{gap:8px!important}.oa-toolbar .oa-btn{padding:8px 10px!important}}
  `;
  document.head.appendChild(s);
}

function one(nodes,preferred){
  var list=Array.from(nodes||[]);
  if(!list.length)return null;
  if(preferred){var p=list.find(preferred);if(p)return p;}
  return list[0];
}
function removeOthers(nodes,keep){Array.from(nodes||[]).forEach(function(n){if(n!==keep)n.remove()})}

function ensureRun(task,toolbar){
  var actual=task.querySelector('[data-run]');
  var universal=task.querySelector('[data-universal-run]');
  var compares=task.querySelectorAll('[data-compare]');
  var keep=actual||universal;

  if(!keep){
    removeOthers(compares,null);
    keep=document.createElement('button');
    keep.type='button';
    keep.className='oa-btn run universal-run';
    keep.setAttribute('data-universal-run','');
    toolbar.insertBefore(keep,toolbar.firstChild);
  }else{
    removeOthers(compares,null);
    if(actual)removeOthers(task.querySelectorAll('[data-universal-run]'),actual);
    else removeOthers(task.querySelectorAll('[data-universal-run]'),universal);
  }
  keep.classList.add('oa-btn','run');
  keep.textContent='▶ Run / Check';
  return keep;
}

function ensurePublish(task,toolbar){
  var buttons=task.querySelectorAll('[data-publish]');
  var publish=one(buttons);
  if(!publish){
    publish=document.createElement('button');
    publish.type='button';
    publish.className='oa-btn publish';
    publish.setAttribute('data-publish','');
    publish.textContent='Publish to GitHub';
    toolbar.appendChild(publish);
  }
  removeOthers(task.querySelectorAll('[data-publish]'),publish);
  publish.classList.add('oa-btn','publish');
  publish.textContent='Publish to GitHub';
  return publish;
}

function appendInOrder(toolbar,buttons){
  buttons.filter(Boolean).forEach(function(btn){
    if(btn.parentNode!==toolbar||toolbar.lastElementChild!==btn)toolbar.appendChild(btn);
  });
}

function normalizeTask(task,index){
  var toolbar=task.querySelector('.oa-toolbar')||task.querySelector('.oa-response-actions');
  if(!toolbar)return;
  var responseTask=task.dataset.responseTask==='1'||!!task.querySelector('textarea.oa-answer');
  if(responseTask)task.dataset.responseTask='1';
  toolbar.classList.remove('oa-response-actions');
  toolbar.classList.add('oa-toolbar');
  task.setAttribute('data-exercise-order',String(index+1));

  var run=null;
  if(responseTask){
    removeOthers(task.querySelectorAll('[data-run],[data-universal-run],[data-compare]'),null);
  }else{
    run=ensureRun(task,toolbar);
  }
  var submit=one(task.querySelectorAll('[data-submit],[data-mark]'),function(n){return n.hasAttribute('data-submit')});
  if(submit){
    submit.classList.add('oa-btn','submit');
    submit.textContent=responseTask&&submit.hasAttribute('data-mark')?'Mark complete':'Submit solution';
  }
  var reset=one(task.querySelectorAll('[data-reset]'));
  if(reset){reset.classList.add('oa-btn');reset.textContent='Reset'}
  var reveal=one(task.querySelectorAll('[data-reveal-solution]'));
  if(reveal){reveal.classList.add('oa-btn','reveal');if(!/hide/i.test(reveal.textContent))reveal.textContent='Reveal solution'}
  var publish=ensurePublish(task,toolbar);

  appendInOrder(toolbar,[run,submit,reset,reveal,publish]);

  var msg=task.querySelector('[data-msg]');
  if(msg){
    msg.classList.add('csai-toolbar-status');
    if(msg.previousElementSibling!==toolbar)toolbar.insertAdjacentElement('afterend',msg);
  }
  task.dataset.finalToolbar='1';
}

function normalizeExamples(){
  document.querySelectorAll('.lesson-run-card [data-run-example]').forEach(function(btn){btn.textContent='▶ Run / Check example'});
  document.querySelectorAll('[data-evergreen-run]').forEach(function(btn){btn.textContent='▶ Run / Check'});
  document.querySelectorAll('[data-evergreen-walk]').forEach(function(btn){btn.textContent='▶ Check walkthrough'});
}

function normalizePublishText(){
  document.querySelectorAll('[data-publish]').forEach(function(btn){btn.textContent='Publish to GitHub'});
}

function run(){
  addStyle();
  document.querySelectorAll('.assessment-stack .oa-task').forEach(normalizeTask);
  normalizeExamples();
  normalizePublishText();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
setTimeout(run,150);
setTimeout(run,500);
setTimeout(run,1200);
})();
