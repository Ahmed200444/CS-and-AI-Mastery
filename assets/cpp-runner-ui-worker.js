(function(){
'use strict';

var CLIENT_URL='/assets/emception-vite/cpp-client.mjs?v=20260809-5';
var TOOLCHAIN_WORKER_URL='/assets/emception-vite/cpp-toolchain-worker.mjs?v=20260809-5';
var MANIFEST_URL='https://cdn.jsdelivr.net/npm/emception@3.8.0/cdn/manifest.json';
var clientPromise=null,orchestrator=null,toolWorker=null,runnerPromise=null,active=null,seq=0;
var artifactPromises=Object.create(null),artifacts=Object.create(null);
var warmTimer=0,warmAttempted=false,backgroundRunning=false,backgroundKey='';

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c];});}
function cppVariant(button){return button&&button.closest?button.closest('[data-lang-variant="cpp"]'):null;}
function outputFor(variant){return variant&&variant.querySelector('[data-csai-example-output]');}
function codeFor(variant){var pre=variant&&variant.querySelector('[data-csai-language-generated],.csai-language-code');return String(pre&&pre.textContent||'');}
function render(out,label,text,error){if(!out)return;out.innerHTML='<span class="'+(error?'bad':'ok')+'">'+esc(label)+'</span>\n'+esc(text||'');}
function progress(out,text){if(out)out.textContent=String(text||'Working…');}
function absolute(path){return new URL(path,window.location.href).href;}
function timeout(promise,ms,message){return new Promise(function(resolve,reject){var done=false,t=setTimeout(function(){if(done)return;done=true;reject(new Error(message));},ms);Promise.resolve(promise).then(function(value){if(done)return;done=true;clearTimeout(t);resolve(value);},function(error){if(done)return;done=true;clearTimeout(t);reject(error);});});}
function toolError(result,fallback){return String(result&&result.stderr||'')||String(result&&result.stdout||'')||fallback;}
function codeKey(code){var h=2166136261,s=String(code||'');for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36)+'-'+s.length;}
function courseId(){try{var n=document.getElementById('course-page-meta'),m=n?JSON.parse(n.textContent||'{}'):{};return String(m.id||location.pathname.split('/').pop()||'').replace(/\.html$/,'').toLowerCase();}catch(e){return String(location.pathname.split('/').pop()||'').replace(/\.html$/,'').toLowerCase();}}
function cppModeRequested(){
 var activeMode=document.querySelector('[data-lang-mode].active');
 if(activeMode){var a=activeMode.getAttribute('data-lang-mode');return a==='cpp'||a==='dual';}
 try{var m=localStorage.getItem('csai-course-language-v2:'+courseId());return m==='cpp'||m==='dual';}catch(e){return false;}
}
function setWarmNote(text){document.querySelectorAll('[data-lang-variant="cpp"] .csai-example-note').forEach(function(note){if(note.textContent!==text)note.textContent=text;});}
function firstWarmButton(){
 var buttons=Array.from(document.querySelectorAll('[data-lang-variant="cpp"] [data-run-language-example]'));
 if(!buttons.length)return null;
 var best=null,bestDistance=Infinity;
 buttons.forEach(function(button){
  var variant=cppVariant(button);if(!variant)return;
  try{var style=getComputedStyle(variant);if(style.display==='none'||style.visibility==='hidden')return;}catch(e){}
  var r=button.getBoundingClientRect(),distance=r.top>=0?r.top:Math.abs(r.bottom);
  if(r.bottom>-240&&r.top<(window.innerHeight||800)*2.2&&distance<bestDistance){best=button;bestDistance=distance;}
 });
 return best||buttons[0];
}

async function resetRunner(){
 var old=orchestrator,w=toolWorker;
 orchestrator=null;toolWorker=null;runnerPromise=null;
 artifactPromises=Object.create(null);artifacts=Object.create(null);
 backgroundRunning=false;backgroundKey='';warmAttempted=false;
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
 // Use Emception's native clang++ tool directly. Put -x c++ before the input file
 // so Clang explicitly treats every generated example as C++ instead of inferring it.
 var compileArgv=['clang++','-x','c++','-std=c++17','--target=wasm32-unknown-emscripten','--sysroot=/usr','-isystem','/usr/include/compat',src,'-c','-o',obj];
 var compile=await timeout(orch.run('clang++',compileArgv),45000,'Your C++ compilation took too long. Please press Run example to retry.');
 if(!compile||compile.exitCode!==0)throw new Error(toolError(compile,'C++ compilation failed.'));

 progress(outNode,'Linking your C++…');
 // Emception's own ninja bypass links C++ objects this way because clang++ cannot
 // spawn wasm-ld inside the WASM sandbox. Calling wasm-ld directly is faster and reliable.
 var linkArgv=['wasm-ld',obj,'-o',out,'-L/usr/lib/emscripten/cache-lib/wasm32-emscripten','-lc++-noexcept','-lc++abi-noexcept','-lc','-ldlmalloc','-lcompiler_rt','--entry=main','--export=__wasm_call_ctors','--allow-undefined'];
 var link=await timeout(orch.run('wasm-ld',linkArgv),30000,'Your C++ link step took too long. Please press Run example to retry.');
 if(!link||link.exitCode!==0)throw new Error(toolError(link,'C++ linking failed.'));
 return link;
}
async function getRunner(outNode){
 if(orchestrator)return orchestrator;
 if(!runnerPromise){runnerPromise=(async function(){
  progress(outNode,'Loading the C++ compiler…');
  var mod=await getClient();
  var worker=new Worker(absolute(TOOLCHAIN_WORKER_URL),{type:'module',name:'csai-emception-toolchain'});
  var orch=new mod.WorkerOrchestrator(mod.workerTransport(worker),{
   onTransportError:function(error){console.error('[C++ runner]',error);}
  });
  toolWorker=worker;orchestrator=orch;
  try{
   await timeout(orch.boot(MANIFEST_URL,{origin:window.location.origin}),45000,'The C++ compiler took too long to initialize.');
   return orch;
  }catch(error){await resetRunner();throw error;}
 })();}
 try{return await runnerPromise;}catch(error){runnerPromise=null;throw error;}
}
async function ensureArtifact(code,outNode){
 var key=codeKey(code);
 if(artifacts[key])return artifacts[key];
 if(artifactPromises[key])return artifactPromises[key];
 var promise=(async function(){
  var orch=await getRunner(outNode),base='/home/user/csai-cache-'+key,src=base+'.cpp',out=base+'.wasm';
  await orch.writeFile(src,new TextEncoder().encode(code));
  await compileSource(orch,src,out,outNode);
  var artifact={key:key,orch:orch,out:out};
  artifacts[key]=artifact;
  return artifact;
 })();
 artifactPromises[key]=promise;
 try{return await promise;}catch(error){delete artifactPromises[key];throw error;}finally{if(artifacts[key])delete artifactPromises[key];}
}
function scheduleBackgroundWarmup(delay){
 if(warmAttempted||warmTimer||backgroundRunning||active||!cppModeRequested()||document.visibilityState==='hidden')return;
 setWarmNote('Preparing C++ in background…');
 // Start the compiler boot immediately in its Worker; do not wait for the learner to press Run.
 getRunner(null).then(function(){if(!backgroundRunning)setWarmNote('C++ compiler ready — preparing this example…');}).catch(function(error){setWarmNote('C++ will prepare when you press Run');console.warn('[C++ runner] background boot skipped:',error&&error.message||error);});
 warmTimer=setTimeout(function(){
  warmTimer=0;
  if(warmAttempted||backgroundRunning||active||!cppModeRequested()||document.visibilityState==='hidden')return;
  var button=firstWarmButton(),variant=cppVariant(button),code=codeFor(variant);if(!button||!variant||!code.trim())return;
  var key=codeKey(code);if(artifacts[key]||artifactPromises[key]){setWarmNote('C++ ready');return;}
  warmAttempted=true;backgroundRunning=true;backgroundKey=key;
  // Prepare the exact nearest C++ example silently in the dedicated Worker while the learner reads.
  // Pressing Run later reuses this already-linked WASM instead of cold-compiling first.
  ensureArtifact(code,null).then(function(){setWarmNote('C++ ready');}).catch(function(error){setWarmNote('C++ will prepare when you press Run');console.warn('[C++ runner] background preparation skipped:',error&&error.message||error);}).finally(function(){if(backgroundKey===key){backgroundRunning=false;backgroundKey='';}});
 },Math.max(0,delay||0));
}
async function runCode(button,variant){
 var outNode=outputFor(variant),code=codeFor(variant);if(!outNode||!code.trim())return;
 if(active){progress(outNode,'Another C++ example is already running. Wait for it to finish, then press Run example.');return;}
 if(warmTimer){clearTimeout(warmTimer);warmTimer=0;}
 var key=codeKey(code),token='cpp-'+(++seq);active=token;button.disabled=true;button.textContent='Running C++…';
 try{
  // If the background worker is preparing this exact example, reuse that same compile/link promise.
  // If it was preparing a different example, cancel that low-priority work so the learner's click wins.
  if(backgroundRunning&&backgroundKey&&backgroundKey!==key&&!artifacts[key])await resetRunner();
  if(artifactPromises[key]&&!artifacts[key])progress(outNode,'Finishing background C++ preparation…');
  var artifact=await ensureArtifact(code,artifactPromises[key]?null:outNode);
  if(active!==token)return;
  progress(outNode,'Running your C++…');
  var result=await timeout(artifact.orch.run('wasi-run',['wasi-run',artifact.out]),20000,'Your C++ program took too long to run.');
  var text=String(result&&result.stdout||'')+String(result&&result.stderr||'');
  render(outNode,result&&result.exitCode===0?'Output':'Run error',text||'(no output)',!result||result.exitCode!==0);
 }catch(error){
  var message=error&&error.message||String(error);
  render(outNode,'Run error',message,true);
  if(/timed out|worker|transport|initialize|boot/i.test(message))await resetRunner();
 }finally{
  if(active===token)active=null;
  button.disabled=false;button.textContent='▶ Run example';
 }
}

document.addEventListener('click',function(event){
 var button=event.target&&event.target.closest&&event.target.closest('[data-run-language-example]');if(!button)return;
 var variant=cppVariant(button);if(!variant)return;
 event.preventDefault();event.stopPropagation();if(event.stopImmediatePropagation)event.stopImmediatePropagation();
 runCode(button,variant);
},true);
document.addEventListener('pointerdown',function(event){var b=event.target&&event.target.closest&&event.target.closest('[data-lang-mode="cpp"],[data-lang-mode="dual"]');if(b)getRunner(null).catch(function(){});},true);
document.addEventListener('click',function(event){
 var modeButton=event.target&&event.target.closest&&event.target.closest('[data-lang-mode]');if(!modeButton)return;
 var mode=modeButton.getAttribute('data-lang-mode');if(mode==='cpp'||mode==='dual')setTimeout(function(){scheduleBackgroundWarmup(80);},20);
},true);
window.addEventListener('csai-language-controller-applied',function(event){var mode=event&&event.detail&&event.detail.mode;if(mode==='cpp'||mode==='dual')scheduleBackgroundWarmup(100);});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')scheduleBackgroundWarmup(100);});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(function(){scheduleBackgroundWarmup(100);},150);},{once:true});else setTimeout(function(){scheduleBackgroundWarmup(100);},150);
setTimeout(function(){scheduleBackgroundWarmup(100);},800);
setTimeout(function(){scheduleBackgroundWarmup(100);},1800);
window.addEventListener('pagehide',function(){active=null;if(warmTimer)clearTimeout(warmTimer);warmTimer=0;resetRunner();});
})();
