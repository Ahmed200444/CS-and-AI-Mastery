(function(){
'use strict';

import('/assets/project-path-normalizer.js');

var WORKER_URL='/assets/python-terminal-worker.js';
var worker=null,active=null,runSeq=0;

function isInteractive(card){
 var lang=card.querySelector('[data-project-lang]');
 var editor=card.querySelector('[data-project-editor]');
 return !!(lang&&editor&&String(lang.value).toLowerCase()==='python'&&/\binput\s*\(/.test(String(editor.value||'')));
}

function addStyle(){
 if(document.getElementById('csai-python-project-terminal-style'))return;
 var s=document.createElement('style');
 s.id='csai-python-project-terminal-style';
 s.textContent='.project-terminal-input{display:none;align-items:center;gap:8px;padding:10px 13px;border-top:1px solid var(--border);background:#0d1520}.project-terminal-input.active{display:flex}.project-terminal-prompt{color:#8bc3ff;font:900 14px/1 ui-monospace,SFMono-Regular,Consolas,monospace}.project-terminal-field{flex:1;min-width:0;border:1px solid #45586e;border-radius:7px;outline:0;background:#09111b;color:#e8eef6;padding:8px 10px;font:500 14px/1.3 ui-monospace,SFMono-Regular,Consolas,monospace}.project-terminal-send{border:1px solid #17649a;border-radius:7px;background:#17649a;color:#fff;padding:8px 11px;font-weight:800;cursor:pointer}.project-terminal-send:disabled{opacity:.55;cursor:not-allowed}';
 document.head.appendChild(s);
}

function ensureTerminal(card){
 addStyle();
 var wrap=card.querySelector('.project-output-wrap');
 if(!wrap)return null;
 var row=wrap.querySelector('[data-project-terminal-input]');
 if(!row){
  row=document.createElement('div');
  row.className='project-terminal-input';
  row.setAttribute('data-project-terminal-input','');
  row.innerHTML='<span class="project-terminal-prompt">›</span><input class="project-terminal-field" data-project-stdin autocomplete="off" spellcheck="false" aria-label="Program input" placeholder="Type input and press Enter"><button type="button" class="project-terminal-send" data-project-send>Send</button>';
  wrap.appendChild(row);
 }
 return {row:row,input:row.querySelector('[data-project-stdin]'),send:row.querySelector('[data-project-send]')};
}

function refreshCard(card){
 var run=card.querySelector('[data-project-run],[data-project-run-interactive]');
 if(!run)return;
 if(isInteractive(card)){
  if(run.hasAttribute('data-project-run'))run.removeAttribute('data-project-run');
  run.setAttribute('data-project-run-interactive','');
 }else{
  if(run.hasAttribute('data-project-run-interactive'))run.removeAttribute('data-project-run-interactive');
  run.setAttribute('data-project-run','');
 }
}

function refreshAll(){Array.from(document.querySelectorAll('.project-card')).forEach(refreshCard);}

function append(state,text){
 if(!state||!state.out)return;
 if(!state.hasOutput){state.out.textContent='';state.hasOutput=true;}
 state.out.textContent+=String(text||'');
 state.out.scrollTop=state.out.scrollHeight;
}

function finish(state){
 if(!state)return;
 state.ui.row.classList.remove('active');
 state.ui.input.disabled=true;
 state.ui.send.disabled=true;
 state.runButton.textContent=state.oldRunText;
 state.runButton.disabled=false;
 if(active&&active.runId===state.runId)active=null;
}

function getWorker(){
 if(worker)return worker;
 worker=new Worker(WORKER_URL);
 worker.onmessage=function(event){
  var d=event.data||{};
  if(!active||d.runId!==active.runId)return;
  if(d.type==='stdout'||d.type==='stderr'){append(active,d.text||'');return;}
  if(d.type==='input-request'){
   active.ui.row.classList.add('active');
   active.ui.input.disabled=false;
   active.ui.send.disabled=false;
   active.ui.input.focus();
   return;
  }
  if(d.type==='error')append(active,'\n'+String(d.text||'Python execution failed.')+'\n');
  if(d.type==='done'||d.type==='error')finish(active);
 };
 worker.onerror=function(event){if(active){append(active,'\nRunner error: '+(event.message||'Interactive Python worker failed.')+'\n');finish(active);}};
 return worker;
}

function stopActive(){
 if(!active)return;
 var state=active;
 try{Atomics.store(state.control,0,3);Atomics.notify(state.control,0,1);}catch(e){}
 if(worker){worker.terminate();worker=null;}
 append(state,'\nExecution stopped.\n');
 finish(state);
}

function submitInput(state){
 if(!state||!active||active.runId!==state.runId||Atomics.load(state.control,0)!==1)return;
 var bytes=new TextEncoder().encode(state.ui.input.value);
 if(bytes.length>state.data.length)return;
 state.data.fill(0);state.data.set(bytes);
 append(state,state.ui.input.value+'\n');
 state.ui.input.value='';
 state.ui.row.classList.remove('active');
 state.ui.input.disabled=true;
 state.ui.send.disabled=true;
 Atomics.store(state.control,1,bytes.length);
 Atomics.store(state.control,0,2);
 Atomics.notify(state.control,0,1);
}

function start(card,button){
 var out=card.querySelector('[data-project-output]');
 var editor=card.querySelector('[data-project-editor]');
 var ui=ensureTerminal(card);
 if(!out||!editor||!ui)return;
 if(!window.crossOriginIsolated||typeof SharedArrayBuffer==='undefined'){
  out.textContent='Interactive terminal unavailable. Reload the deployed site after the terminal security headers are active.';
  return;
 }
 if(active)stopActive();
 var controlBuffer=new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT*2);
 var dataBuffer=new SharedArrayBuffer(4096);
 active={runId:++runSeq,card:card,out:out,ui:ui,runButton:button,oldRunText:button.textContent,control:new Int32Array(controlBuffer),data:new Uint8Array(dataBuffer),hasOutput:false};
 ui.row.classList.remove('active');ui.input.value='';ui.input.disabled=true;ui.send.disabled=true;
 out.textContent='Loading interactive Python terminal…';
 button.textContent='Stop';
 getWorker().postMessage({type:'run',runId:active.runId,code:String(editor.value||''),controlBuffer:controlBuffer,dataBuffer:dataBuffer});
}

document.addEventListener('click',function(e){
 var run=e.target.closest&&e.target.closest('[data-project-run-interactive]');
 if(run){
  e.preventDefault();
  var card=run.closest('.project-card');
  if(active&&active.card===card)stopActive();else start(card,run);
  return;
 }
 var send=e.target.closest&&e.target.closest('[data-project-send]');
 if(send&&active&&send.closest('.project-card')===active.card){e.preventDefault();submitInput(active);}
});

document.addEventListener('keydown',function(e){
 if(e.key==='Enter'&&e.target.matches&&e.target.matches('[data-project-stdin]')&&active&&e.target.closest('.project-card')===active.card){e.preventDefault();submitInput(active);}
});

document.addEventListener('input',function(e){if(e.target.matches&&e.target.matches('[data-project-editor]'))refreshCard(e.target.closest('.project-card'));});
document.addEventListener('change',function(e){if(e.target.matches&&e.target.matches('[data-project-lang]'))refreshCard(e.target.closest('.project-card'));});

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refreshAll);else refreshAll();
setTimeout(refreshAll,500);
new MutationObserver(function(){setTimeout(refreshAll,20);}).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pagehide',function(){if(worker)worker.terminate();worker=null;active=null;});
})();
