(function(){
'use strict';

var WORKER_URL='/assets/cpp-example-runner-worker.mjs?v=20260809-1';
var worker=null,seq=0,pending=new Map();

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function cppVariant(button){var variant=button&&button.closest&&button.closest('[data-lang-variant="cpp"]');return variant||null;}
function outputFor(variant){return variant&&variant.querySelector('[data-csai-example-output]');}
function codeFor(variant){var pre=variant&&variant.querySelector('[data-csai-language-generated],.csai-language-code');return String(pre&&pre.textContent||'');}
function render(out,label,text,error){if(!out)return;out.innerHTML='<span class="'+(error?'bad':'ok')+'">'+esc(label)+'</span>\n'+esc(text||'');}
function setProgress(out,text){if(out)out.textContent=String(text||'Working…');}

function stopWorker(message){
 var w=worker;worker=null;
 if(w){try{w.postMessage({type:'dispose'});}catch(e){}try{w.terminate();}catch(e){}}
 pending.forEach(function(item){clearTimeout(item.timer);item.button.disabled=false;item.button.textContent='▶ Run example';render(item.out,'Run error',message||'C++ runner was restarted.',true);});
 pending.clear();
}
function ensureWorker(){
 if(worker)return worker;
 var url=new URL(WORKER_URL,window.location.href).href;
 var w=new Worker(url,{type:'module',name:'csai-cpp-runner'});
 w.onmessage=function(event){
  var data=event.data||{},item=pending.get(data.id);if(!item)return;
  if(data.type==='progress'){setProgress(item.out,data.message||'Working…');return;}
  if(data.type==='result'){
   clearTimeout(item.timer);pending.delete(data.id);item.button.disabled=false;item.button.textContent='▶ Run example';
   render(item.out,data.error?'Run error':'Output',data.text||'(no output)',!!data.error);
  }
 };
 w.onerror=function(event){stopWorker((event&&event.message)||'C++ compiler worker failed.');};
 w.onmessageerror=function(){stopWorker('C++ compiler worker returned unreadable data.');};
 worker=w;return w;
}
function run(button,variant){
 var out=outputFor(variant),code=codeFor(variant);if(!out||!code.trim())return;
 var id='cpp-ui-'+(++seq),w;
 try{w=ensureWorker();}catch(error){render(out,'Run error',error.message||String(error),true);return;}
 button.disabled=true;button.textContent='Loading C++…';setProgress(out,'Starting the C++ compiler in the background…');
 var timer=setTimeout(function(){
  var item=pending.get(id);if(!item)return;
  pending.delete(id);item.button.disabled=false;item.button.textContent='▶ Run example';
  try{w.terminate();}catch(e){}worker=null;
  render(item.out,'Run error','The C++ compiler took too long, so it was safely restarted. The page stayed responsive; press Run example to try again.',true);
 },120000);
 pending.set(id,{button:button,out:out,timer:timer});
 w.postMessage({type:'run',id:id,code:code});
}

document.addEventListener('click',function(event){
 var button=event.target&&event.target.closest&&event.target.closest('[data-run-language-example]');if(!button)return;
 var variant=cppVariant(button);if(!variant)return;
 event.preventDefault();event.stopPropagation();if(event.stopImmediatePropagation)event.stopImmediatePropagation();
 run(button,variant);
},true);
window.addEventListener('pagehide',function(){stopWorker('Page closed.');});
})();
