(()=>{'use strict';
const CLIENT_URL='/assets/emception-vite/cpp-client.mjs?v=20260809-5';
const WORKER_URL='/assets/emception-vite/cpp-toolchain-worker.mjs?v=20260809-5';
const MANIFEST_URL='https://cdn.jsdelivr.net/npm/emception@3.8.0/cdn/manifest.json';
const RECYCLE_AFTER_RUNS=2;
let clientPromise=null,runnerPromise=null,orchestrator=null,worker=null,active=null,seq=0,completedRuns=0;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
function absolute(p){return new URL(p,location.href).href;}
function looksCpp(code){return /#include\s*[<"]|\bstd::|\bcout\s*<<|\bcin\s*>>|\bvector\s*</.test(String(code||''))||/\bint\s+main\s*\(/.test(String(code||''));}
function looksPython(code){return /(^|\n)\s*(def\s+|class\s+|from\s+|import\s+|for\s+\w+\s+in\s+|while\s+.+:|if\s+.+:|elif\s+.+:|print\s*\()/.test(String(code||''))||/\brange\s*\(|\blen\s*\(/.test(String(code||''));}
function isCpp(task){
  const editor=task?.querySelector('textarea[data-editor]:not(.oa-answer)'),code=String(editor?.value||'');
  const activeMode=String(task?.getAttribute('data-csai-active-language')||'').toLowerCase();
  if(activeMode==='python')return false;
  if(activeMode==='cpp')return true;
  if(activeMode==='dual')return looksCpp(code)&&!looksPython(code);
  const selected=String(task?.querySelector('[data-lang]')?.value||'').toLowerCase();
  if(selected==='python')return false;
  if(selected==='cpp'||selected==='c++')return true;
  const tagged=String(task?.getAttribute('data-csai-editor-language')||'').toLowerCase();
  return tagged==='cpp'&&looksCpp(code)&&!looksPython(code);
}
function output(task){return task?.querySelector('[data-output]');}
function progress(out,text){if(out)out.textContent=String(text||'Working…');}
function timeout(promise,ms,message){return new Promise((resolve,reject)=>{let done=false;const t=setTimeout(()=>{if(done)return;done=true;reject(new Error(message));},ms);Promise.resolve(promise).then(v=>{if(done)return;done=true;clearTimeout(t);resolve(v);},e=>{if(done)return;done=true;clearTimeout(t);reject(e);});});}
async function paint(){await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));}
async function reset(){const old=orchestrator,w=worker;orchestrator=null;worker=null;runnerPromise=null;completedRuns=0;try{await old?.dispose?.(new Error('C++ exercise runner reset'));}catch(e){}try{w?.terminate();}catch(e){}}
async function client(){if(!clientPromise)clientPromise=import(absolute(CLIENT_URL)).then(mod=>{if(typeof mod?.WorkerOrchestrator!=='function'||typeof mod?.workerTransport!=='function')throw new Error('C++ worker client did not load correctly.');return mod;});return clientPromise;}
async function runner(out){
  if(completedRuns>=RECYCLE_AFTER_RUNS)await reset();
  if(orchestrator)return orchestrator;
  if(!runnerPromise)runnerPromise=(async()=>{progress(out,'Loading the C++ compiler…');const mod=await client(),w=new Worker(absolute(WORKER_URL),{type:'module',name:'csai-exercise-cpp'}),orch=new mod.WorkerOrchestrator(mod.workerTransport(w),{onTransportError:error=>console.error('[C++ exercise runner]',error)});worker=w;orchestrator=orch;try{await timeout(orch.boot(MANIFEST_URL,{origin:location.origin}),45000,'The C++ compiler took too long to initialize.');return orch;}catch(e){await reset();throw e;}})();
  try{return await runnerPromise;}catch(e){runnerPromise=null;throw e;}
}
async function execute(button,task){
  const editor=task.querySelector('textarea[data-editor]:not(.oa-answer)'),out=output(task),code=String(editor?.value||'');
  if(!out||!code.trim())return;
  if(active){progress(out,'Another C++ exercise is already running.');return;}
  const token='exercise-cpp-'+(++seq);active=token;button.disabled=true;progress(out,'Preparing C++…');
  await paint();
  try{
    const orch=await runner(out);if(active!==token)return;
    const src='/home/user/exercise-current.cpp',obj='/home/user/exercise-current.o',wasm='/home/user/exercise-current.wasm';
    await orch.writeFile(src,new TextEncoder().encode(code));
    progress(out,'Compiling your C++…');
    const compile=await timeout(orch.run('clang++',['clang++','-x','c++','-std=c++17','--target=wasm32-unknown-emscripten','--sysroot=/usr','-isystem','/usr/include/compat',src,'-c','-o',obj]),45000,'C++ compilation timed out.');
    if(!compile||compile.exitCode!==0)throw new Error(String(compile?.stderr||compile?.stdout||'C++ compilation failed.'));
    progress(out,'Linking your C++…');
    const link=await timeout(orch.run('wasm-ld',['wasm-ld',obj,'-o',wasm,'-L/usr/lib/emscripten/cache-lib/wasm32-emscripten','-lc++-noexcept','-lc++abi-noexcept','-lc','-ldlmalloc','-lcompiler_rt','--entry=main','--export=__wasm_call_ctors','--allow-undefined']),30000,'C++ linking timed out.');
    if(!link||link.exitCode!==0)throw new Error(String(link?.stderr||link?.stdout||'C++ linking failed.'));
    progress(out,'Running your C++…');
    const result=await timeout(orch.run('wasi-run',['wasi-run',wasm]),20000,'C++ execution timed out.'),text=String(result?.stdout||'')+String(result?.stderr||'');
    out.innerHTML=`<span class="${result?.exitCode===0?'ok':'bad'}">${result?.exitCode===0?'Run complete':'Run error'}</span>\n${esc(text||'(no output — add cout)')}`;
    if(result?.exitCode===0)completedRuns++;
  }catch(e){const message=String(e?.message||e);out.innerHTML=`<span class="bad">Runner error</span>\n${esc(message)}`;if(/timeout|worker|transport|initialize|boot/i.test(message))await reset();}
  finally{if(active===token)active=null;button.disabled=false;}
}
document.addEventListener('click',event=>{
  const button=event.target.closest?.('.oa-task [data-run],.oa-task [data-universal-run]');if(!button)return;
  const task=button.closest('.oa-task');if(!task||!isCpp(task))return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();execute(button,task);
},true);
window.addEventListener('pagehide',()=>{active=null;reset();});
window.CSAIExerciseCppRunner={isCpp};
})();
