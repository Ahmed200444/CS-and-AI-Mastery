(function(){
'use strict';

var CLIENT_URL='/assets/emception-vite/cpp-client.mjs?v=20260809-5';
var TOOLCHAIN_WORKER_URL='/assets/emception-vite/cpp-toolchain-worker.mjs?v=20260809-5';
var MANIFEST_URL='https://cdn.jsdelivr.net/npm/emception@3.8.0/cdn/manifest.json';
var clientPromise=null,orchestrator=null,toolWorker=null,runnerPromise=null,active=null,seq=0;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function cppVariant(button){return button&&button.closest?button.closest('[data-lang-variant="cpp"]'):null;}
function outputFor(variant){return variant&&variant.querySelector('[data-csai-example-output]');}
function codeFor(variant){var pre=variant&&variant.querySelector('[data-csai-language-generated],.csai-language-code');return String(pre&&pre.textContent||'');}
function render(out,label,text,error){if(!out)return;out.innerHTML='<span class="'+(error?'bad':'ok')+'">'+esc(label)+'</span>\n'+esc(text||'');}
function progress(out,text){if(out)out.textContent=String(text||'Working…');}
function absolute(path){return new URL(path,window.location.href).href;}
function timeout(promise,ms,message){return new Promise(function(resolve,reject){var done=false,t=setTimeout(function(){if(done)return;done=true;reject(new Error(message));},ms);Promise.resolve(promise).then(function(value){if(done)return;done=true;clearTimeout(t);resolve(value);},function(error){if(done)return;done=true;clearTimeout(t);reject(error);});});}
function toolError(result,fallback){return String(result&&result.stderr||'')||String(result&&result.stdout||'')||fallback;}

async function resetRunner(){
 var old=orchestrator,w=toolWorker;
 orchestrator=null;toolWorker=null;runnerPromise=null;
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
async function runCode(button,variant){
 var outNode=outputFor(variant),code=codeFor(variant);if(!outNode||!code.trim())return;
 if(active){progress(outNode,'Another C++ example is already running. Wait for it to finish, then press Run example.');return;}
 var token='cpp-'+(++seq);active=token;button.disabled=true;button.textContent='Running C++…';
 try{
  var orch=await getRunner(outNode);
  if(active!==token)return;
  var stamp=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),src='/home/user/csai-'+stamp+'.cpp',out='/home/user/csai-'+stamp+'.wasm';
  await orch.writeFile(src,new TextEncoder().encode(code));
  await compileSource(orch,src,out,outNode);
  progress(outNode,'Running your C++…');
  var result=await timeout(orch.run('wasi-run',['wasi-run',out]),20000,'Your C++ program took too long to run.');
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
window.addEventListener('pagehide',function(){active=null;resetRunner();});
})();
