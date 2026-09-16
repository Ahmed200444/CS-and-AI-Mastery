const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
function read(p){return fs.readFileSync(path.join(root,p),'utf8')}
function ok(c,m){if(!c){console.error('Interactive input contract FAIL: '+m);process.exit(1)}}
const ui=read('assets/python-inline-terminal.js'),worker=read('assets/python-terminal-worker.js'),server=read('local-server.js'),netlify=read('netlify.toml');
ok(ui.includes("inputMode:'inline-terminal'"),'must advertise inline-terminal input');
ok(ui.includes('data-term-input'),'must render in-page input field');
ok(ui.includes("e.key==='Enter'"),'Enter must submit input');
ok(!ui.includes('prompt('),'must not use browser prompt');
ok(worker.includes('setStdin'),'worker must connect Python stdin');
ok(worker.includes('Atomics.wait(control,0,0)'),'worker must wait for in-page input');
ok(worker.includes("send('input-request'"),'worker must request in-page input');
ok(server.includes("'Cross-Origin-Opener-Policy':'same-origin'"),'local server must enable COOP');
ok(server.includes("'Cross-Origin-Embedder-Policy':'require-corp'"),'local server must enable COEP');
ok(netlify.includes('Cross-Origin-Opener-Policy = "same-origin"'),'Netlify must enable COOP');
const pages=fs.readdirSync(path.join(root,'courses')).filter(f=>f.endsWith('.html'));ok(pages.length===62,'expected 62 course pages');
for(const f of pages){const t=read('courses/'+f);ok(t.includes('python-inline-terminal.js'),f+' must load inline terminal');ok(t.includes('runner-performance-guard.js'),f+' must load the performance guard');ok(t.indexOf('python-inline-terminal.js')<t.indexOf('adaptive-practice-layer.js'),f+' must start the single Python worker before adaptive lesson tooling');}
for(const f of ['adaptive-practice-layer.js','lesson-example-runner.js','evergreen-learning-engine.js','course-project-workspace.js','assessment-practice.js','example-learning-tools.js']){const t=read('assets/'+f);ok(!t.includes('_csai_window.prompt'),f+' must not fall back to a browser popup for Python input');}
console.log('Interactive Python inline-terminal contract PASS');
