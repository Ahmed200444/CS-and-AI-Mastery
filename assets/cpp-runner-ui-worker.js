(function(){
'use strict';

var CLIENT_URL='/assets/emception-vite/cpp-client.mjs?v=20260810-7';
var TOOLCHAIN_WORKER_URL='/assets/emception-vite/cpp-toolchain-worker.mjs?v=20260810-7';
var MANIFEST_URL='https://cdn.jsdelivr.net/npm/emception@3.8.0/cdn/manifest.json';
var clientPromise=null,orchestrator=null,toolWorker=null,runnerPromise=null,active=null,seq=0;
var warmStartedAt=0,warmReadyAt=0,warmReason='';

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function cppVariant(button){return button&&button.closest?button.closest('[data-lang-variant="cpp"]'):null;}
function outputFor(variant){return variant&&variant.querySelector('[data-csai-example-output]');}
function codeFor(variant){var pre=variant&&variant.querySelector('[data-csai-language-generated],.csai-language-code');return String(pre&&pre.textContent||'');}
function render(out,label,text,error){if(!out)return;out.innerHTML='<span class="'+(error?'bad':'ok')+'">'+esc(label)+'</span>\n'+esc(text||'');}
function progress(out,text){if(out)out.textContent=String(text||'Working…');}
function absolute(path){return new URL(path,window.location.href).href;}
function timeout(promise,ms,message){return new Promise(function(resolve,reject){var done=false,t=setTimeout(function(){if(done)return;done=true;reject(new Error(message));},ms);Promise.resolve(promise).then(function(value){if(done)return;done=true;clearTimeout(t);resolve(value);},function(error){if(done)return;done=true;clearTimeout(t);reject(error);});});}
function toolError(result,fallback){return String(result&&result.stderr||'')||String(result&&result.stdout||'')||fallback;}
function now(){return typeof performance!=='undefined'&&performance.now?performance.now():Date.now();}
function timingNote(variant,text){if(!variant)return;var note=variant.querySelector('.csai-example-note');if(note)note.textContent=text;}

async function resetRunner(){
 var old=orchestrator,w=toolWorker;
 orchestrator=null;toolWorker=null;runnerPromise=null;warmStartedAt=0;warmReadyAt=0;warmReason='';
 try{if(old&&typeof old.dispose==='function')await old.dispose(new Error('C++ runner reset'));}catch(e){}
 try{if(w)w.terminate();}catch(e){}
}
async function getClient(){
 if(!clientPromise){clientPromise=import(absolute(CLIENT_URL)).then(function(mod){
  if(!mod||typeof mod.WorkerOrchestrator!=='function'||typeof mod.workerTransport!=='function')throw new Error('C++ worker client module did not load correctly.');
  return mod;
 });}
 return clientPromise;
}
async function compileSource(orch,src,out,outNode){
 var obj=out+'.o';
 progress(outNode,'Compiling your C++…');
 var compileArgv=['clang++','-x','c++','-std=c++17','--target=wasm32-unknown-emscripten','--sysroot=/usr','-isystem','/usr/include/compat',src,'-c','-o',obj];
 var compile=await timeout(orch.run('clang++',compileArgv),45000,'Your C++ compilation took too long. Please press Run example to retry.');
 if(!compile||compile.exitCode!==0)throw new Error(toolError(compile,'C++ compilation failed.'));
 progress(outNode,'Linking your C++…');
 var linkArgv=['wasm-ld',obj,'-o',out,'-L/usr/lib/emscripten/cache-lib/wasm32-emscripten','-lc++-noexcept','-lc++abi-noexcept','-lc','-ldlmalloc','-lcompiler_rt','--entry=main','--export=__wasm_call_ctors','--allow-undefined'];
 var link=await timeout(orch.run('wasm-ld',linkArgv),30000,'Your C++ link step took too long. Please press Run example to retry.');
 if(!link||link.exitCode!==0)throw new Error(toolError(link,'C++ linking failed.'));
 return link;
}
async function getRunner(outNode){
 if(orchestrator)return orchestrator;
 if(!runnerPromise){runnerPromise=(async function(){
  if(!warmStartedAt)warmStartedAt=now();
  progress(outNode,'Loading the C++ compiler…');
  var mod=await getClient();
  var worker=new Worker(absolute(TOOLCHAIN_WORKER_URL),{type:'module',name:'csai-emception-toolchain'});
  var orch=new mod.WorkerOrchestrator(mod.workerTransport(worker),{onTransportError:function(error){console.error('[C++ runner]',error);}});
  toolWorker=worker;orchestrator=orch;
  try{
   await timeout(orch.boot(MANIFEST_URL,{origin:window.location.origin}),45000,'The C++ compiler took too long to initialize.');
   warmReadyAt=now();
   document.documentElement.setAttribute('data-csai-cpp-ready','1');
   window.dispatchEvent(new CustomEvent('csai-cpp-runner-ready',{detail:{milliseconds:Math.round(warmReadyAt-warmStartedAt),reason:warmReason||'run'}}));
   return orch;
  }catch(error){await resetRunner();throw error;}
 })();}
 try{return await runnerPromise;}catch(error){runnerPromise=null;throw error;}
}
function prewarm(reason){
 if(orchestrator||runnerPromise)return runnerPromise||Promise.resolve(orchestrator);
 warmReason=String(reason||'intent');warmStartedAt=now();
 document.documentElement.setAttribute('data-csai-cpp-warming','1');
 return getRunner(null).then(function(orch){document.documentElement.removeAttribute('data-csai-cpp-warming');return orch;},function(error){document.documentElement.removeAttribute('data-csai-cpp-warming');console.warn('[C++ runner prewarm]',error);return null;});
}
async function runSource(code,outNode){
 var started=now(),wasWarm=!!orchestrator;
 try{
  var orch=await getRunner(outNode||null);
  var stamp=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),src='/home/user/csai-'+stamp+'.cpp',out='/home/user/csai-'+stamp+'.wasm';
  await orch.writeFile(src,new TextEncoder().encode(String(code||'')));
  await compileSource(orch,src,out,outNode||null);
  progress(outNode||null,'Running your C++…');
  var result=await timeout(orch.run('wasi-run',['wasi-run',out]),20000,'Your C++ program took too long to run.');
  return{error:!result||result.exitCode!==0,text:String(result&&result.stdout||'')+String(result&&result.stderr||''),milliseconds:Math.max(1,Math.round(now()-started)),warm:wasWarm};
 }catch(error){
  var message=error&&error.message||String(error);
  if(/timed out|worker|transport|initialize|boot/i.test(message))await resetRunner();
  return{error:true,text:message,milliseconds:Math.max(1,Math.round(now()-started)),warm:wasWarm};
 }
}
async function runCode(button,variant){
 var outNode=outputFor(variant),code=codeFor(variant);if(!outNode||!code.trim())return;
 if(active){progress(outNode,'Another C++ example is already running. Wait for it to finish, then press Run example.');return;}
 var token='cpp-'+(++seq);active=token;button.disabled=true;button.textContent='Running C++…';
 try{
  var result=await runSource(code,outNode);if(active!==token)return;
  render(outNode,result.error?'Run error':'Output',result.text||'(no output)',result.error);
  timingNote(variant,(result.warm?'Warm C++ run: ':'C++ first run: ')+result.milliseconds+' ms');
  variant.setAttribute('data-csai-cpp-last-ms',String(result.milliseconds));
 }finally{
  if(active===token)active=null;
  button.disabled=false;button.textContent='▶ Run example';
 }
}

function intentTarget(node){return node&&node.closest&&node.closest('[data-lang-mode="cpp"],[data-lang-mode="dual"],[data-lang-variant="cpp"],[data-run-language-example],[data-adaptive-mode="cpp"],[data-adaptive-mode="dual"]');}
document.addEventListener('pointerover',function(event){var t=intentTarget(event.target);if(t)prewarm('pointer-intent');},true);
document.addEventListener('focusin',function(event){var t=intentTarget(event.target);if(t)prewarm('keyboard-intent');},true);
document.addEventListener('click',function(event){
 var mode=event.target&&event.target.closest&&event.target.closest('[data-lang-mode="cpp"],[data-lang-mode="dual"],[data-adaptive-mode="cpp"],[data-adaptive-mode="dual"]');
 if(mode){prewarm('language-mode');}
 var button=event.target&&event.target.closest&&event.target.closest('[data-run-language-example]');if(!button)return;
 var variant=cppVariant(button);if(!variant)return;
 event.preventDefault();event.stopPropagation();if(event.stopImmediatePropagation)event.stopImmediatePropagation();runCode(button,variant);
},true);
window.CSAICppRunner={prewarm:prewarm,runSource:runSource,isReady:function(){return!!orchestrator;},warmupMilliseconds:function(){return warmReadyAt&&warmStartedAt?Math.round(warmReadyAt-warmStartedAt):null;}};
window.addEventListener('pagehide',function(){active=null;resetRunner();});
})();
