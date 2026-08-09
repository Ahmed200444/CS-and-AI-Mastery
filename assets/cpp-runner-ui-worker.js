(function(){
'use strict';

var CLIENT_URL='/assets/emception-vite/cpp-client.mjs?v=20260809-5';
var TOOLCHAIN_WORKER_URL='/assets/emception-vite/cpp-toolchain-worker.mjs?v=20260809-5';
var MANIFEST_URL='https://cdn.jsdelivr.net/npm/emception@3.8.0/cdn/manifest.json';
var clientPromise=null,orchestrator=null,toolWorker=null,runnerPromise=null,active=null,seq=0;
var artifactPromises=Object.create(null),artifacts=Object.create(null);
var warmTimer=0,backgroundRunning=false,backgroundKey='',backgroundPromise=null,prebootStarted=false,firstPrewarmStarted=false,scrollTimer=0;

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
function normalizeCppOutput(text){return String(text||'').replace(/\r\n/g,'\n').replace(/\r/g,'\n').replace(/\n\n\n/g,'\n').replace(/\n+$/,'');}
function courseId(){try{var n=document.getElementById('course-page-meta'),m=n?JSON.parse(n.textContent||'{}'):{};return String(m.id||location.pathname.split('/').pop()||'').replace(/\.html$/,'').toLowerCase();}catch(e){return String(location.pathname.split('/').pop()||'').replace(/\.html$/,'').toLowerCase();}}
function cppModeRequested(){
 var activeMode=document.querySelector('[data-lang-mode].active');
 if(activeMode){var a=activeMode.getAttribute('data-lang-mode');return a==='cpp'||a==='dual';}
 try{var m=localStorage.getItem('csai-course-language-v2:'+courseId());return m==='cpp'||m==='dual';}catch(e){return false;}
}
function courseSupportsCpp(){return !!document.querySelector('[data-lang-mode="cpp"],[data-lang-mode="dual"]');}
function allCppButtons(){return Array.from(document.querySelectorAll('[data-lang-variant="cpp"] [data-run-language-example]'));}
function setVariantNote(variant,text){var note=variant&&variant.querySelector('.csai-example-note');if(note&&note.textContent!==text)note.textContent=text;}
function refreshNotes(){
 allCppButtons().forEach(function(button){
  var variant=cppVariant(button),key=codeKey(codeFor(variant));
  if(artifacts[key])setVariantNote(variant,'C++ ready');
  else if(artifactPromises[key])setVariantNote(variant,'Preparing this C++ example in background…');
  else if(orchestrator)setVariantNote(variant,'C++ compiler ready — example prepares as you scroll');
  else setVariantNote(variant,'C++ compiler warming in background…');
 });
}
function actuallyVisibleForWarmup(button,variant){
 if(!button||!variant)return false;
 var details=variant.closest&&variant.closest('details');
 if(details&&!details.open)return false;
 try{var style=getComputedStyle(variant);if(style.display==='none'||style.visibility==='hidden')return false;}catch(e){}
 // getClientRects() also catches hidden ancestors (including closed disclosure content),
 // which getComputedStyle(variant) alone does not reliably detect.
 try{if(!button.getClientRects().length)return false;}catch(e){return false;}
 var r=button.getBoundingClientRect();
 if(!r.width&&!r.height)return false;
 if(r.bottom<-400||r.top>(window.innerHeight||800)*1.8)return false;
 return true;
}
function nearestUnpreparedButton(allowHiddenFirst){
 var buttons=allCppButtons().filter(function(button){var code=codeFor(cppVariant(button)),key=codeKey(code);return code.trim()&&!artifacts[key]&&!artifactPromises[key];});
 if(!buttons.length)return null;
 var best=null,bestDistance=Infinity;
 buttons.forEach(function(button){
  var variant=cppVariant(button);if(!actuallyVisibleForWarmup(button,variant))return;
  var r=button.getBoundingClientRect();
  var distance=Math.abs(r.top-Math.min((window.innerHeight||800)*0.35,300));
  if(distance<bestDistance){best=button;bestDistance=distance;}
 });
 return best||(allowHiddenFirst?buttons[0]:null);
}

async function resetRunner(){
 var old=orchestrator,w=toolWorker;
 orchestrator=null;toolWorker=null;runnerPromise=null;
 artifactPromises=Object.create(null);artifacts=Object.create(null);
 backgroundRunning=false;backgroundKey='';backgroundPromise=null;prebootStarted=false;firstPrewarmStarted=false;
 try{if(old&&typeof old.dispose==='function')await old.dispose(new Error('C++ runner reset'));}catch(e){}
 try{if(w)w.terminate();}catch(e){}
 refreshNotes();
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
  progress(outNode,'Loading the C++ compiler…');refreshNotes();
  var mod=await getClient();
  var worker=new Worker(absolute(TOOLCHAIN_WORKER_URL),{type:'module',name:'csai-emception-toolchain'});
  var orch=new mod.WorkerOrchestrator(mod.workerTransport(worker),{
   onTransportError:function(error){console.error('[C++ runner]',error);}
  });
  toolWorker=worker;orchestrator=orch;
  try{
   await timeout(orch.boot(MANIFEST_URL,{origin:window.location.origin}),45000,'The C++ compiler took too long to initialize.');
   refreshNotes();return orch;
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
  var artifact={key:key,orch:orch,out:out};artifacts[key]=artifact;refreshNotes();return artifact;
 })();
 artifactPromises[key]=promise;refreshNotes();
 try{return await promise;}catch(error){delete artifactPromises[key];refreshNotes();throw error;}finally{if(artifacts[key])delete artifactPromises[key];}
}
function prepareButtonInBackground(button){
 if(!button||active||backgroundRunning||document.visibilityState==='hidden')return;
 var variant=cppVariant(button),code=codeFor(variant);if(!variant||!code.trim())return;
 var key=codeKey(code);if(artifacts[key]){setVariantNote(variant,'C++ ready');return;}if(artifactPromises[key])return;
 backgroundRunning=true;backgroundKey=key;setVariantNote(variant,'Preparing this C++ example in background…');
 backgroundPromise=ensureArtifact(code,null).then(function(){setVariantNote(variant,'C++ ready');}).catch(function(error){setVariantNote(variant,'C++ compiler ready — press Run to retry');console.warn('[C++ runner] background preparation skipped:',error&&error.message||error);}).finally(function(){backgroundRunning=false;backgroundKey='';backgroundPromise=null;if(cppModeRequested())scheduleBackgroundWarmup(180);});
}
function prewarmFirstExample(){
 if(firstPrewarmStarted||!courseSupportsCpp()||document.visibilityState==='hidden')return;
 var button=nearestUnpreparedButton(true);
 if(!button){setTimeout(prewarmFirstExample,350);return;}
 firstPrewarmStarted=true;prepareButtonInBackground(button);
}
function prebootCompiler(){
 if(prebootStarted||orchestrator||runnerPromise||!courseSupportsCpp()||document.visibilityState==='hidden')return;
 prebootStarted=true;refreshNotes();
 // Boot before C++ is selected, then precompile the first static C++ lesson example while the learner reads.
 getRunner(null).then(function(){refreshNotes();prewarmFirstExample();}).catch(function(error){prebootStarted=false;refreshNotes();console.warn('[C++ runner] background preboot skipped:',error&&error.message||error);});
}
function scheduleBackgroundWarmup(delay){
 if(warmTimer||backgroundRunning||active||!cppModeRequested()||document.visibilityState==='hidden')return;
 warmTimer=setTimeout(function(){warmTimer=0;if(backgroundRunning||active||!cppModeRequested()||document.visibilityState==='hidden')return;prepareButtonInBackground(nearestUnpreparedButton(false));},Math.max(0,delay||0));
}
async function runCode(button,variant){
 var outNode=outputFor(variant),code=codeFor(variant);if(!outNode||!code.trim())return;
 if(active){progress(outNode,'Another C++ example is already running. Wait for it to finish, then press Run example.');return;}
 if(warmTimer){clearTimeout(warmTimer);warmTimer=0;}
 var key=codeKey(code),token='cpp-'+(++seq);active=token;button.disabled=true;button.textContent='Running C++…';
 try{
  if(artifactPromises[key]&&!artifacts[key])progress(outNode,'Finishing this example’s background preparation…');
  else if(backgroundRunning&&backgroundKey!==key&&backgroundPromise){progress(outNode,'Finishing nearby C++ preparation…');await backgroundPromise.catch(function(){});}
  var artifact=await ensureArtifact(code,outNode);
  if(active!==token)return;
  progress(outNode,'Running your C++…');
  var result=await timeout(artifact.orch.run('wasi-run',['wasi-run',artifact.out]),20000,'Your C++ program took too long to run.');
  var text=normalizeCppOutput(String(result&&result.stdout||'')+String(result&&result.stderr||''));
  render(outNode,result&&result.exitCode===0?'Output':'Run error',text||'(no output)',!result||result.exitCode!==0);
 }catch(error){
  var message=error&&error.message||String(error);render(outNode,'Run error',message,true);
  if(/timed out|worker|transport|initialize|boot/i.test(message))await resetRunner();
 }finally{
  if(active===token)active=null;button.disabled=false;button.textContent='▶ Run example';refreshNotes();scheduleBackgroundWarmup(180);
 }
}

document.addEventListener('click',function(event){
 var button=event.target&&event.target.closest&&event.target.closest('[data-run-language-example]');if(!button)return;
 var variant=cppVariant(button);if(!variant)return;
 event.preventDefault();event.stopPropagation();if(event.stopImmediatePropagation)event.stopImmediatePropagation();runCode(button,variant);
},true);
document.addEventListener('pointerdown',function(event){var b=event.target&&event.target.closest&&event.target.closest('[data-lang-mode="cpp"],[data-lang-mode="dual"]');if(b)prebootCompiler();},true);
document.addEventListener('click',function(event){var b=event.target&&event.target.closest&&event.target.closest('[data-lang-mode]');if(!b)return;var mode=b.getAttribute('data-lang-mode');if(mode==='cpp'||mode==='dual')setTimeout(function(){refreshNotes();scheduleBackgroundWarmup(60);},20);},true);
window.addEventListener('csai-language-controller-applied',function(event){var mode=event&&event.detail&&event.detail.mode;refreshNotes();if(mode==='cpp'||mode==='dual')scheduleBackgroundWarmup(80);});
window.addEventListener('scroll',function(){if(scrollTimer)return;scrollTimer=setTimeout(function(){scrollTimer=0;scheduleBackgroundWarmup(80);},180);},{passive:true});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'){prebootCompiler();refreshNotes();scheduleBackgroundWarmup(80);}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(prebootCompiler,250);setTimeout(prewarmFirstExample,700);},{once:true});else{setTimeout(prebootCompiler,250);setTimeout(prewarmFirstExample,700);}
setTimeout(prebootCompiler,900);setTimeout(prewarmFirstExample,1400);
window.addEventListener('pagehide',function(){active=null;if(warmTimer)clearTimeout(warmTimer);if(scrollTimer)clearTimeout(scrollTimer);warmTimer=scrollTimer=0;resetRunner();});
})();
