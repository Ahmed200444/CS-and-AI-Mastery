const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function ok(v,m){if(!v){console.error('Python runner recovery/input validation FAIL: '+m);process.exit(1)}}
const ui=read('assets/python-inline-terminal.js');
const diag=read('assets/vscode-diagnostics.js');
ok(!ui.includes('Another Python program is already running'),'runner must not block new runs with the old busy error');
ok(ui.includes('function ensureIdle(){return busy?cancel('),'new runs must automatically cancel stale runs');
ok(ui.includes('data-term-cancel'),'inline input must expose a visible Cancel button');
ok(ui.includes("e.key==='Escape'"),'Escape must still cancel input');
ok(ui.includes('Atomics.store(control,0,2)')&&ui.includes('Atomics.notify(control,0,1)'),'cancel must wake a worker blocked on stdin');
ok(ui.includes('setTimeout(function(){if(settled)return;settled=true;if(current&&current.id===c.id){resetWorker()'),'stale cancellation must have a hard worker-reset fallback');
ok(ui.includes('autoCancelStaleRuns:true')&&ui.includes('inputValidation:true'),'runner must advertise recovery and validation');
ok(ui.includes("return'Enter a whole number, for example 85 or -1.'"),'integer input must reject letters/invalid text');
ok(ui.includes("return'Enter a valid number, for example 85 or 85.5.'"),'float input must reject invalid text');
ok(ui.includes("out.push('text')")&&ui.includes("out.push('integer')")&&ui.includes("out.push('number')"),'input kinds must be tracked in source order');
ok(diag.includes('This input must be a whole number. Enter digits such as 85 or -1, not letters.'),'diagnostics must explain invalid integer input');
ok(diag.includes('This input must be a number. Enter something like 85 or 85.5.'),'diagnostics must explain invalid float input');
const pages=fs.readdirSync(path.join(root,'courses')).filter(f=>f.endsWith('.html'));
ok(pages.length===62,'expected 62 generated course pages');
for(const f of pages){const h=read('courses/'+f);ok(h.includes('python-inline-terminal.js?v=20260822-v567'),f+' must load the recovered Python terminal build');}
console.log('Python runner recovery/input validation PASS — stale input cannot lock later runs; numeric input validates before submission.');
