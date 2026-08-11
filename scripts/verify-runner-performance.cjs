const fs=require('fs');
const path=require('path');
const root=process.cwd(),failures=[];
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function req(label,ok){if(!ok)failures.push(label);}
const adaptive=read('assets/adaptive-practice-layer.js');
const guard=read('assets/runner-performance-guard.js');
req('Python runtime must cache one Pyodide instance',/var pyInstance=null,pyPromise=null/.test(adaptive)&&/if\(pyInstance\)return pyInstance/.test(adaptive));
req('Python runtime must reuse an in-flight load promise',/if\(!pyPromise\)/.test(adaptive)&&/return pyPromise/.test(adaptive));
req('Python runtime must recover from a failed first load',/pyPromise=null;throw error/.test(adaptive));
req('Python run timing must be measured',/performance\.now\(\)/.test(adaptive)&&/milliseconds:Math\.max\(1,Math\.round\(performance\.now\(\)-start\)\)/.test(adaptive));
req('Python package loading must be import-aware',/loadPackagesFromImports\(code\)/.test(adaptive));
req('Python must have an explicit prewarm path',/function prewarmPython\(\)/.test(adaptive));
req('Python runner must expose a shared cached API',/window\.CSAIPythonRunner=\{prewarm:prewarmPython,runSource:runPython/.test(adaptive));
req('Runner CDN preconnect must be installed',/rel='preconnect'/.test(guard)&&/cdn\.jsdelivr\.net/.test(guard));
req('Python warm-up must be user-intent based',/pointerover/.test(guard)&&/focusin/.test(guard)&&/function warm\(\)/.test(guard));
req('Runner guard must not auto-load Pyodide at page startup',!(/requestIdleCallback|setTimeout\([^\n]*warm/.test(guard)));
req('Shared Python runtime must not render lesson UI',!(/MutationObserver|querySelectorAll\('\.lesson'\)|data-adaptive-lab|adaptive-tab/.test(adaptive)));
req('Adaptive practice must not expose language switching',!(/data-adaptive-mode|data-lang-mode|\bDual\b|C\+\+/.test(adaptive)));
if(failures.length){console.error('Runner performance verification failed:');failures.forEach(x=>console.error(' - '+x));process.exit(1);}
console.log('Runner performance verified: one cached Pyodide instance, import-aware execution, measured run time, intent-based warm-up, and no page-load Python or legacy lesson renderer.');
