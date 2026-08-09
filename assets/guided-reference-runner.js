(()=>{'use strict';
const clean=v=>String(v??'').trim();
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function describe(code){
  const notes=[];
  const imports=[...code.matchAll(/^\s*(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))/gm)].map(m=>(m[1]||m[2]||'').split('.')[0]).filter(Boolean);
  if(imports.length)notes.push(`Dependencies/context: ${[...new Set(imports)].join(', ')}.`);
  if(/https?:\/\//.test(code)||/\b(requests|httpx|fetch)\b/.test(code))notes.push('This example demonstrates a network/API interaction; a real result depends on a reachable service and its response.');
  if(/\b(model|fit|predict|transform|pipeline|Trainer|KMeans|Regression)\b/.test(code))notes.push('This example demonstrates a machine-learning/model workflow; real values depend on the model, data, and installed package.');
  if(/\b(for|while)\b/.test(code))notes.push('Follow the loop by tracking the value that changes on each iteration and the condition that eventually stops it.');
  if(/\b(if|elif|else|switch)\b/.test(code))notes.push('Trace the condition first, then follow only the branch whose condition is satisfied.');
  if(/\bclass\s+/.test(code))notes.push('Treat the class as a blueprint: identify the state it stores, then the behavior its methods provide.');
  if(/\b(def\s+|function\s+|\w+\s*\([^)]*\)\s*\{)/.test(code))notes.push('For each function, identify its inputs, the transformation it performs, and the value or side effect it produces.');
  if(!notes.length)notes.push('Read the example as input → operation → result, then connect each line to the concept described in the lesson.');
  return notes;
}
function guided(pre,out){
  const code=clean(pre.textContent),reason=clean(pre.getAttribute('data-reference-reason'))||'This block needs context that is not safely available as a standalone browser program.',notes=describe(code),first=clean(code.split(/\r?\n/).find(Boolean)||'example');
  out.innerHTML='<span class="ok">Guided check — contextual example</span>\n'+
    esc('Why real execution is not used here: '+reason)+'\n\n'+
    esc('What to focus on:\n'+notes.map((n,i)=>`${i+1}. ${n}`).join('\n'))+'\n\n'+
    esc('Start tracing from: '+first.slice(0,160))+'\n\n'+
    esc('How to think: identify the input/context → follow the operation in order → decide what state/value changes → identify the expected result. This is deliberately labeled as a guided check; no fake runtime result is claimed.');
}
document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-run-example]');if(!button)return;
  const card=button.closest('.lesson-run-card'),pre=card?.querySelector('pre.code[data-reference-only="true"]'),out=card?.querySelector('[data-example-output],.lesson-run-output');
  if(!pre||!out)return;
  event.preventDefault();event.stopImmediatePropagation();button.disabled=false;guided(pre,out);
},true);
})();
