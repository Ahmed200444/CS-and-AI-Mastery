const fs=require('fs');
const path=require('path');
const root=process.cwd(),failures=[];
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function req(label,ok){if(!ok)failures.push(label)}
const adaptive=read('assets/adaptive-practice-layer.js');
const cpp=read('assets/cpp-runner-ui-worker.js');
const guard=read('assets/runner-performance-guard.js');
req('Python runtime must cache one Pyodide instance',/var pyInstance=null,pyPromise=null/.test(adaptive)&&/if\(pyInstance\)return pyInstance/.test(adaptive));
req('Python runtime must reuse an in-flight load promise',/if\(!pyPromise\)/.test(adaptive)&&/return pyPromise/.test(adaptive));
req('Python run timing must be measured',/performance\.now\(\)/.test(adaptive)&&/milliseconds:Math\.max\(1,Math\.round\(performance\.now\(\)-start\)\)/.test(adaptive));
req('Python package loading must be import-aware',/loadPackagesFromImports\(code\)/.test(adaptive));
req('Python must have an explicit prewarm path',/function prewarmPython\(\)/.test(adaptive));
req('Dual-language pages must auto-trigger Python warm-up',/data-adaptive-mode="python"/.test(guard)&&/dispatchEvent\(new Event\('pointerover'/.test(guard));
req('Runner CDN preconnect must be installed',/rel='preconnect'/.test(guard)&&/cdn\.jsdelivr\.net/.test(guard));
req('C++ runner must reuse one orchestrator',/if\(orchestrator\)return orchestrator/.test(cpp));
req('C++ runner must reuse one in-flight boot promise',/if\(!runnerPromise\)/.test(cpp)&&/return await runnerPromise/.test(cpp));
req('C++ must detect supported course content',/function cppCapable\(root\)/.test(cpp)&&/data-adaptive-mode="cpp"/.test(cpp)&&/data-adaptive-mode="dual"/.test(cpp));
req('C++ must schedule automatic course/content prewarm',/function scheduleAutoPrewarm\(reason\)/.test(cpp)&&/scheduleAutoPrewarm\('course-load'\)/.test(cpp)&&/scheduleAutoPrewarm\('course-content'\)/.test(cpp));
req('C++ must show preparing/ready state',/Preparing C\+\+ compiler/.test(cpp)&&/C\+\+ ready/.test(cpp));
req('C++ compile/link/run timing must be measured',/milliseconds:Math\.max\(1,Math\.round\(now\(\)-started\)\)/.test(cpp));
req('C++ must avoid redundant smoke compilation',!(/CSAI_CPP_OK|smokeTest\(/.test(cpp)));
req('C++ must use clang++ directly',/orch\.run\('clang\+\+',compileArgv\)/.test(cpp));
req('C++ must link directly with wasm-ld',/orch\.run\('wasm-ld',linkArgv\)/.test(cpp));
req('C++ must run with wasi-run',/orch\.run\('wasi-run'/.test(cpp));
if(failures.length){console.error('Runner performance verification failed:');failures.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('Runner performance verified: Python preloads and caches Pyodide; C++ auto-prewarms, reuses one compiler, avoids smoke builds, and both runners expose measured run time.');
