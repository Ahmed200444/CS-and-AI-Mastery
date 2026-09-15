const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),ok=(c,m)=>{if(!c)throw new Error(m)};
const guard=read('assets/runner-performance-guard.js');
ok(/requestIdleCallback/.test(guard)&&/timeout:1100/.test(guard)&&/setTimeout\(attempt,1500\)/.test(guard),'runner warm-up must wait for browser idle time while retaining a bounded fallback');
ok(/single-worker-early/.test(guard),'Python must identify early single-worker prewarm');
ok(/prewarmSources/.test(guard)&&/slice\(0,2\)/.test(guard),'only the current lesson\'s first two Python sources should be prewarmed');
ok(/var current=activeLesson\(\);warmLessonSources\(current\);return true;/.test(guard),'only the currently open lesson should prewarm example sources');
ok(/CSAISQLRunner/.test(guard),'SQL must prewarm');
ok(/CSAIJSRunner/.test(guard),'persistent JS must prewarm');
ok(/CSAICppRunner/.test(guard)&&/timeout:220/.test(guard),'C++ fast runner and early idle full compiler prewarm must exist');
ok(/\/runtime\/pyodide\/pyodide\.js/.test(guard)&&/\/runtime\/sql\/sql-wasm\.js/.test(guard),'local runtime assets must be hinted');
ok(/editTimer/.test(guard)&&/},220\);/.test(guard)&&/pythonEditor\(target\)/.test(guard)&&/prewarmSource/.test(guard),'editing must debounce source preparation, wake Python only for Python editors, and prepare edited code before Run');

const pythonPage=read('courses/python.html');
ok(/data-csai-head-preload="calmfast2"/.test(pythonPage)&&/\/runtime\/pyodide\/pyodide\.js/.test(pythonPage)&&/python-terminal-worker\.js/.test(pythonPage),'Python course must hint the heavy runtime from the document head before deferred runner startup');
const sqlRunner=read('assets/lesson-example-runner.js');ok(/getSqlSeed/.test(sqlRunner)&&/seedSnapshot:true/.test(sqlRunner),'SQL runner must clone a prebuilt seed snapshot instead of replaying seed SQL every run');
const sqlPage=read('courses/sql.html');
ok(/data-csai-head-preload="calmfast2"/.test(sqlPage)&&/\/runtime\/sql\/sql-wasm\.wasm/.test(sqlPage),'SQL course must hint its runtime from the document head');
const cppPage=read('courses/cpp-dsa.html');
ok(/data-csai-head-preload="calmfast2"/.test(cppPage)&&/\/runtime\/cpp\/JSCPP\.es5\.min\.js/.test(cppPage),'C++ course must hint the lightweight compiler from the document head');
const worker=read('assets/python-terminal-worker.js');ok(/PYODIDE_BASE='\/runtime\/pyodide\/'/.test(worker),'Python worker must use local runtime cache');ok(/prewarm-sources/.test(worker),'Python worker must batch source prewarm');ok(/_CSAI_CODE_CACHE/.test(worker)&&/_csai_compiled/.test(worker)&&/_csai_prepare/.test(worker),'Python worker must precompile and cache edited source before repeated runs');
const terminal=read('assets/python-inline-terminal.js');ok(/singleRuntime:true/.test(terminal),'Python must use one shared runtime');ok(/worker-immediate/.test(terminal)&&/compiledSourceCache:true/.test(terminal),'Python worker must start immediately on Python courses and advertise compiled-source caching');ok(/testSource:testSource/.test(terminal),'assessment tests must share the same worker runtime');
const local=read('local-server.js');ok(/runtimeCache\.route/.test(local)&&/warmMaximum/.test(local),'local server must proxy/cache and background-warm runtimes');ok(/max-age=31536000, immutable/.test(local),'versioned static assets must use long browser caching');ok(/},25\);/.test(local),'local server should start background runtime warming almost immediately');
const installer=read('INSTALL_ON_MY_COMPUTER.bat');ok(/runtime-cache-prepare\.js/.test(installer),'installer must pre-cache heavy runtimes');
const js=read('assets/fast-js-runner.js');ok(/new Worker/.test(js)&&/window\.CSAIJSRunner/.test(js),'persistent JavaScript worker missing');ok(/__cache=new Map/.test(js)&&/compiledSourceCache:true/.test(js)&&/prewarmSource/.test(js)&&/t:'prepare'/.test(js),'JavaScript runner must precompile and cache edited functions before Run');
const cppTools=read('assets/example-learning-tools.js');ok(/cppCompileCache=new Map/.test(cppTools)&&/compiledBinaryCache:true/.test(cppTools),'full C++ runner must reuse compiled binaries for unchanged source');
for(const f of fs.readdirSync(path.join(root,'courses')).filter(f=>f.endsWith('.html'))){const h=read('courses/'+f);ok(/runner-performance-guard\.js\?v=20260822-v567/.test(h),f+': missing accelerator tag');ok(/calm-study-flow\.js\?v=20260822-v567/.test(h),f+': missing calm study layer');}
console.log('Maximum automatic run acceleration contracts passed.');
