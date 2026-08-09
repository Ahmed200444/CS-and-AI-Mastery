(()=>{'use strict';
const FLEXIBLE_IDS=['dsa','problem-solving','oop','algorithms','data-structures'];
const CLIENT_URL='/assets/emception-vite/cpp-client.mjs?v=20260809-5';
const WORKER_URL='/assets/emception-vite/cpp-toolchain-worker.mjs?v=20260809-5';
const MANIFEST_URL='https://cdn.jsdelivr.net/npm/emception@3.8.0/cdn/manifest.json';
let clientPromise=null,runnerPromise=null,orchestrator=null,worker=null,queued=false;
const clean=v=>String(v??'').trim();
const slug=v=>clean(v).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'project';
function meta(){try{return JSON.parse(document.getElementById('course-page-meta')?.textContent||'{}')||{};}catch(e){return{};}}
function courseId(){const m=meta();return clean(m.id||location.pathname.split('/').pop()?.replace(/\.html$/,'')).toLowerCase();}
function courseTitle(){const m=meta();return clean(m.title||document.querySelector('.hero h1,main h1')?.textContent).toLowerCase();}
function flexible(){const id=courseId(),title=courseTitle(),all=id+' '+title;if(/python|javascript|typescript|sql|html|css|react|node|java\b|c\+\+/.test(all))return false;return FLEXIBLE_IDS.some(x=>id===x||id.includes(x))||/data structures|algorithms|problem solving|object[ -]oriented/.test(title);}
function key(card,lang){return`csai-project-language-v1:${courseId()}:${card.dataset.project||slug(card.querySelector('h3')?.textContent)}:${lang}`;}
function get(card,lang){try{return localStorage.getItem(key(card,lang))||'';}catch(e){return'';}}
function set(card,lang,value){try{localStorage.setItem(key(card,lang),String(value||''));}catch(e){}}
function looksCpp(code){return/#include\s*[<"]|\bstd::|\bcout\s*<<|\bint\s+main\s*\(/.test(code);}
function looksPython(code){return/(^|\n)\s*(def\s+|class\s+|from\s+|import\s+|for\s+\w+\s+in\s+|print\s*\()/.test(code);}
function currentLang(card){const tagged=card.dataset.projectLanguage;if(tagged)return tagged;const select=card.querySelector('[data-project-lang]');if(select?.value)return select.value;const code=card.querySelector('[data-project-editor]')?.value||'';if(looksCpp(code))return'cpp';if(looksPython(code))return'python';return'python';}
function starter(card,lang){
  const title=clean(card.querySelector('h3')?.textContent||'Project');
  if(lang==='cpp')return`#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n\n// ${title}\nint main() {\n    cout << "Project workspace ready" << endl;\n    return 0;\n}\n`;
  return `# ${title}\n\n# Build your project here.\nprint("Project workspace ready")\n`;
}
function extension(lang){return lang==='cpp'?'cpp':lang==='python'?'py':lang==='javascript'?'js':lang==='sql'?'sql':lang==='html'?'html':lang==='json'?'json':lang==='shell'?'sh':'txt';}
function label(card,lang){const file=card.querySelector('[data-project-file]'),title=slug(card.querySelector('h3')?.textContent||card.dataset.project||'project');if(file)file.textContent=`${title}.${extension(lang)}`;}
function ensureCpp(select){if(!select||[...select.options].some(o=>o.value==='cpp'))return;const option=document.createElement('option');option.value='cpp';option.textContent='C++';const py=[...select.options].find(o=>o.value==='python');py?.after(option)||select.appendChild(option);}
function switchLanguage(card,next){
  const editor=card.querySelector('[data-project-editor]'),select=card.querySelector('[data-project-lang]');if(!editor||!select)return;
  const before=currentLang(card);if(editor.value)set(card,before,editor.value);
  let code=get(card,next);if(!code)code=starter(card,next);
  editor.value=code;select.value=next;card.dataset.projectLanguage=next;label(card,next);set(card,next,code);
  const out=card.querySelector('[data-project-output]');if(out)out.textContent=next==='cpp'?'C++ workspace ready.':'Python workspace ready.';
  editor.dispatchEvent(new Event('input',{bubbles:true}));
}
function enhanceCard(card){
  if(!flexible())return;
  const select=card.querySelector('[data-project-lang]'),editor=card.querySelector('[data-project-editor]');if(!select||!editor)return;
  ensureCpp(select);
  if(!card.dataset.projectLanguage)card.dataset.projectLanguage=select.value||'python';
  label(card,currentLang(card));
}
function enhance(){if(!flexible())return;document.querySelectorAll('.project-card').forEach(enhanceCard);}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance();});}
function absolute(p){return new URL(p,location.href).href;}
function timeout(p,ms,msg){return new Promise((resolve,reject)=>{let done=false;const t=setTimeout(()=>{if(done)return;done=true;reject(new Error(msg));},ms);Promise.resolve(p).then(v=>{if(done)return;done=true;clearTimeout(t);resolve(v);},e=>{if(done)return;done=true;clearTimeout(t);reject(e);});});}
async function getClient(){if(!clientPromise)clientPromise=import(absolute(CLIENT_URL));return clientPromise;}
async function resetRunner(){const o=orchestrator,w=worker;orchestrator=null;worker=null;runnerPromise=null;try{await o?.dispose?.(new Error('reset'));}catch(e){}try{w?.terminate();}catch(e){}}
async function getRunner(out){
  if(orchestrator)return orchestrator;
  if(!runnerPromise)runnerPromise=(async()=>{out.textContent='Loading the C++ compiler…';const mod=await getClient();if(typeof mod.WorkerOrchestrator!=='function')throw new Error('C++ worker client did not load.');const w=new Worker(absolute(WORKER_URL),{type:'module',name:'csai-project-cpp'}),orch=new mod.WorkerOrchestrator(mod.workerTransport(w));worker=w;orchestrator=orch;try{await timeout(orch.boot(MANIFEST_URL,{origin:location.origin}),45000,'The C++ compiler took too long to initialize.');return orch;}catch(e){await resetRunner();throw e;}})();
  try{return await runnerPromise;}catch(e){runnerPromise=null;throw e;}
}
async function runCpp(card,button){
  const editor=card.querySelector('[data-project-editor]'),out=card.querySelector('[data-project-output]');if(!editor||!out)return;
  button.disabled=true;out.textContent='Preparing C++…';
  try{
    const orch=await getRunner(out),stamp=Date.now().toString(36)+Math.random().toString(36).slice(2,6),src=`/home/user/project-${stamp}.cpp`,obj=`/home/user/project-${stamp}.o`,wasm=`/home/user/project-${stamp}.wasm`;
    await orch.writeFile(src,new TextEncoder().encode(editor.value));
    out.textContent='Compiling your C++…';
    const compile=await timeout(orch.run('clang++',['clang++','-x','c++','-std=c++17','--target=wasm32-unknown-emscripten','--sysroot=/usr','-isystem','/usr/include/compat',src,'-c','-o',obj]),45000,'C++ compilation timed out.');
    if(!compile||compile.exitCode!==0)throw new Error(String(compile?.stderr||compile?.stdout||'C++ compilation failed.'));
    out.textContent='Linking your C++…';
    const link=await timeout(orch.run('wasm-ld',['wasm-ld',obj,'-o',wasm,'-L/usr/lib/emscripten/cache-lib/wasm32-emscripten','-lc++-noexcept','-lc++abi-noexcept','-lc','-ldlmalloc','-lcompiler_rt','--entry=main','--export=__wasm_call_ctors','--allow-undefined']),30000,'C++ linking timed out.');
    if(!link||link.exitCode!==0)throw new Error(String(link?.stderr||link?.stdout||'C++ linking failed.'));
    out.textContent='Running your C++…';
    const result=await timeout(orch.run('wasi-run',['wasi-run',wasm]),20000,'C++ execution timed out.'),text=String(result?.stdout||'')+String(result?.stderr||'');
    out.innerHTML=`<span class="${result?.exitCode===0?'ok':'bad'}">${result?.exitCode===0?'Run complete':'Run error'}</span>\n${text||'(no output)'}`;
  }catch(e){out.innerHTML=`<span class="bad">Runner error</span>\n${String(e?.message||e)}`;if(/timeout|worker|initialize|boot/i.test(String(e?.message||e)))await resetRunner();}
  finally{button.disabled=false;}
}
document.addEventListener('change',event=>{const select=event.target.closest?.('[data-project-lang]');if(!select||!flexible())return;const card=select.closest('.project-card');if(!card)return;switchLanguage(card,select.value);},true);
document.addEventListener('input',event=>{const editor=event.target.closest?.('[data-project-editor]');if(!editor||!flexible())return;const card=editor.closest('.project-card');if(card)set(card,currentLang(card),editor.value);},true);
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-project-run]');if(!button)return;const card=button.closest('.project-card');if(!card||currentLang(card)!=='cpp')return;event.preventDefault();event.stopImmediatePropagation();runCpp(card,button);},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});else enhance();
new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true});
})();