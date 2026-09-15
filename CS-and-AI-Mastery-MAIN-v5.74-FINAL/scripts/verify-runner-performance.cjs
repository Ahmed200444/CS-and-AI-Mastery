const fs=require('fs');
const path=require('path');
const root=process.cwd(),failures=[];
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function req(label,ok){if(!ok)failures.push(label)}
const terminal=read('assets/python-inline-terminal.js');
const worker=read('assets/python-terminal-worker.js');
const adaptive=read('assets/adaptive-practice-layer.js');
const assessment=read('assets/assessment-practice.js');
const guard=read('assets/runner-performance-guard.js');
req('Python must use one shared worker runtime',/singleRuntime:true/.test(terminal)&&/testSource:testSource/.test(terminal));
req('Python runtime must reuse an in-flight worker warm promise',/if\(warmPromise\)return warmPromise/.test(terminal));
req('Python run timing must be measured inside the worker',/performance\.now\(\)/.test(worker)&&/milliseconds:Math\.max\(1,Math\.round\(performance\.now\(\)-start\)\)/.test(worker));
req('Python package loading must be import-aware and memoized',/prepareImports/.test(worker)&&/preparedImports/.test(worker));
req('Python source preparation must support small batches',/prewarm-sources/.test(worker)&&/prewarmSources/.test(terminal));
req('Adaptive practice must delegate instead of loading a second Pyodide',/sharedPythonRunner/.test(adaptive)&&!/loadPyodide/.test(adaptive));
req('Assessment tests must reuse the same worker',/CSAIPythonRunner\.testSource/.test(assessment));
req('Python course pages must auto-trigger early warm-up',/single-worker-early/.test(guard)&&/prewarm/.test(guard));
req('Only current/next lesson examples should prewarm',/slice\(0,2\)/.test(guard)&&/nextLesson/.test(guard));
req('Local runtime preload/prefetch must be installed',/localHints/.test(guard)&&/\/runtime\/pyodide\/pyodide\.js/.test(guard)&&/\/runtime\/sql\/sql-wasm\.js/.test(guard));
if(failures.length){console.error('Runner performance verification failed:');failures.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('Runner performance verified: one Python worker, batched current/next lesson prewarm, local runtime cache, early startup, and persistent lightweight runners.');
