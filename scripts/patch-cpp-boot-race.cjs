const fs=require('fs');
const path=require('path');
const file=path.join(process.cwd(),'assets','cpp-runner-ui-worker.js');
let src=fs.readFileSync(file,'utf8');

const old=`  toolWorker=worker;orchestrator=orch;\n  try{\n   await timeout(orch.boot(MANIFEST_URL,{origin:window.location.origin}),45000,'The C++ compiler took too long to initialize.');\n   refreshNotes();return orch;`;
const fixed=`  toolWorker=worker;\n  try{\n   await timeout(orch.boot(MANIFEST_URL,{origin:window.location.origin}),45000,'The C++ compiler took too long to initialize.');\n   // Do not expose the orchestrator until boot() has fully completed. Calls that\n   // arrive during startup see orchestrator === null and await runnerPromise instead.\n   orchestrator=orch;refreshNotes();return orch;`;
if(src.includes(old))src=src.replace(old,fixed);
if(src.includes('toolWorker=worker;orchestrator=orch;'))throw new Error('C++ runner still exposes an unbooted orchestrator');
if(!/await timeout\(orch\.boot[\s\S]*?orchestrator=orch;refreshNotes\(\);return orch;/.test(src))throw new Error('C++ runner does not publish orchestrator only after boot completion');
fs.writeFileSync(file,src,'utf8');
console.log('C++ compiler boot race removed: concurrent warmups now await the shared boot promise before compiling.');
