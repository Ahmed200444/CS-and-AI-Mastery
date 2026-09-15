const fs=require('fs');const path=require('path');const root=path.join(__dirname,'..');
function read(p){return fs.readFileSync(path.join(root,p),'utf8')}
let bad=[];
const terminal=read('assets/python-inline-terminal.js');
const worker=read('assets/python-terminal-worker.js');
const adaptive=read('assets/adaptive-practice-layer.js');
const assessment=read('assets/assessment-practice.js');
if(!/singleRuntime:true/.test(terminal))bad.push('inline terminal must advertise a single shared Python runtime');
for(const marker of ['runSource:runSource','testSource:testSource','prewarmSources:prewarmSources'])if(!terminal.includes(marker))bad.push('shared worker API missing '+marker);
if(!worker.includes("d.type==='test'"))bad.push('Python worker must execute assessment tests in the same runtime');
if(!worker.includes("d.type==='prewarm-sources'"))bad.push('Python worker must batch prewarm visible/next lesson imports');
if(!worker.includes('_CSAI_CODE_CACHE')||!worker.includes('_csai_compiled'))bad.push('Python worker must cache compiled source for repeated runs');
if(/window\.CSAIPythonRunner\s*=/.test(adaptive))bad.push('adaptive practice must not create a second Python runtime');
if(!adaptive.includes('sharedPythonRunner'))bad.push('adaptive practice must delegate to the single Python worker');
if(!assessment.includes("typeof window.CSAIPythonRunner.testSource==='function'"))bad.push('assessment tests must reuse the shared Python worker');
for(const f of ['lesson-example-runner.js','example-learning-tools.js','course-project-workspace.js','evergreen-learning-engine.js','assessment-practice.js']){
 const t=read('assets/'+f);
 if(!t.includes("window.CSAIPythonRunner&&typeof window.CSAIPythonRunner.runSource==='function'"))bad.push(f+' does not prefer shared Python runner');
}
if(bad.length){console.error('Shared Python runner contract FAIL\n- '+bad.join('\n- '));process.exit(1)}
console.log('Shared Python runner contract PASS — one worker handles examples, exercises, tests, and projects.');
