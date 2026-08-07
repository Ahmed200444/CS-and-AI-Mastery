(function(){
'use strict';

function addStyle(){
  if(document.getElementById('csai-universal-run-output-style'))return;
  var s=document.createElement('style');
  s.id='csai-universal-run-output-style';
  s.textContent=`
    .oa-output-wrap{border-top:1px solid var(--border);background:color-mix(in srgb,var(--bg) 82%,var(--panel))}
    .oa-output-label{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 13px 0;color:var(--muted);font:850 11px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:.08em;text-transform:uppercase}
    .oa-output-wrap .oa-output{border-top:0!important;background:transparent!important}
    .oa-btn.universal-run{background:#17649a;color:#fff;border-color:#17649a}
    .oa-output .run-ok{color:#16805b;font-weight:850}.oa-output .run-bad{color:#c44152;font-weight:850}
  `;
  document.head.appendChild(s);
}

function ensureOutput(task){
  var out=task.querySelector('[data-output]');
  if(!out){
    out=document.createElement('div');
    out.className='oa-output';
    out.setAttribute('data-output','');
    out.textContent='Ready.';
    var work=task.querySelector('.oa-work')||task;
    work.appendChild(out);
  }
  if(!out.parentElement.classList.contains('oa-output-wrap')){
    var wrap=document.createElement('div');
    wrap.className='oa-output-wrap';
    var label=document.createElement('div');
    label.className='oa-output-label';
    label.innerHTML='<span>Output</span><span>Run the exercise to see results here</span>';
    out.parentNode.insertBefore(wrap,out);
    wrap.appendChild(label);
    wrap.appendChild(out);
  }
  return out;
}

function toolbarFor(task){
  return task.querySelector('.oa-toolbar')||task.querySelector('.oa-response-actions');
}

function ensureRunButton(task){
  var existing=task.querySelector('[data-run],[data-compare],[data-universal-run]');
  if(existing){
    if(existing.hasAttribute('data-compare'))existing.textContent='▶ Run / Check';
    return existing;
  }
  var toolbar=toolbarFor(task);
  if(!toolbar)return null;
  var btn=document.createElement('button');
  btn.type='button';
  btn.className='oa-btn universal-run';
  btn.setAttribute('data-universal-run','');
  btn.textContent='▶ Run / Check';
  toolbar.insertBefore(btn,toolbar.firstChild);
  return btn;
}

function textFor(task){
  var editor=task.querySelector('[data-editor]');
  return editor?String(editor.value||editor.textContent||'').trim():'';
}

function runGeneric(task){
  var out=ensureOutput(task);
  var value=textFor(task);
  if(!value){
    out.innerHTML='<span class="run-bad">Nothing to run yet.</span>\nWrite your answer or code first, then press Run / Check again.';
    return;
  }
  var file=(task.querySelector('[data-file-label]')||{}).textContent||'';
  var lang=(task.querySelector('[data-lang]')||{}).value||'';
  if(!lang){
    if(/\.py$/i.test(file))lang='python';
    else if(/\.js$/i.test(file))lang='javascript';
    else if(/\.sql$/i.test(file))lang='sql';
    else if(/\.html?$/i.test(file))lang='html';
    else lang='text';
  }
  if(lang==='html'){
    out.innerHTML='';
    var frame=document.createElement('iframe');
    frame.setAttribute('sandbox','allow-scripts');
    frame.style.cssText='width:100%;height:230px;border:1px solid var(--border);border-radius:8px;background:white';
    frame.srcdoc=value;
    out.appendChild(frame);
    return;
  }
  if(lang==='javascript'){
    try{
      var logs=[];
      var fakeConsole={log:function(){logs.push(Array.from(arguments).map(String).join(' '))}};
      new Function('console',value)(fakeConsole);
      out.innerHTML='<span class="run-ok">Run complete.</span>\n'+(logs.length?logs.join('\n'):'No console output. Add console.log(...) if you want to display a value.');
    }catch(error){
      out.innerHTML='<span class="run-bad">Run error.</span>\n'+String(error&&error.message||error);
    }
    return;
  }
  if(lang==='python'||lang==='sql'){
    out.innerHTML='<span class="run-ok">Ready to run.</span>\nThis exercise uses the course runner above. Use its Run button to execute the '+lang.toUpperCase()+' code.';
    return;
  }
  out.innerHTML='<span class="run-ok">Response captured.</span>\nYour response is ready for review. Use Reveal solution to compare your reasoning with the model answer.';
}

function enhanceTask(task){
  if(task.dataset.universalRunReady==='1')return;
  task.dataset.universalRunReady='1';
  ensureOutput(task);
  ensureRunButton(task);
}

function enhanceQuiz(card){
  if(card.dataset.universalRunReady==='1')return;
  card.dataset.universalRunReady='1';
  var feedback=card.querySelector('[data-quiz-feedback]');
  if(feedback&&!feedback.previousElementSibling?.classList.contains('oa-output-label')){
    var label=document.createElement('div');
    label.className='oa-output-label';
    label.style.padding='10px 0 4px';
    label.innerHTML='<span>Output</span><span>Check your answer to see feedback</span>';
    feedback.parentNode.insertBefore(label,feedback);
  }
}

function run(){
  addStyle();
  document.querySelectorAll('.assessment-stack .oa-task').forEach(enhanceTask);
  document.querySelectorAll('.quiz-card').forEach(enhanceQuiz);
}

document.addEventListener('click',function(e){
  var btn=e.target.closest('[data-universal-run]');
  if(!btn)return;
  var task=btn.closest('.oa-task');
  if(task)runGeneric(task);
});

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
setTimeout(run,250);
setTimeout(run,800);
var observer=new MutationObserver(function(){run()});
observer.observe(document.documentElement,{childList:true,subtree:true});
})();
