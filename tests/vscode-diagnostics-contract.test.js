const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const a=fs.readFileSync(path.join(root,'assets/vscode-diagnostics.js'),'utf8');
for(const token of ['csai-vscode-squiggle','csai-vscode-problems','csai-vscode-guide','csai-vscode-ln','parsePython','parseCpp']) assert(a.includes(token),`missing ${token}`);
assert(!a.includes("rootMargin:'500px 0px'"),'diagnostics must not initialize because an editor enters the viewport');
assert(a.includes("document.addEventListener('focusin'")&&a.includes("document.addEventListener('input'"),'diagnostics must initialize on editor interaction');
assert(a.includes("Name '")&&a.includes('is not defined in this editor'),'missing Python live undefined-call diagnostic');
const courses=fs.readdirSync(path.join(root,'courses')).filter(f=>f.endsWith('.html'));
assert.strictEqual(courses.length,62);
for(const f of courses){const h=fs.readFileSync(path.join(root,'courses',f),'utf8');assert(h.includes('../assets/vscode-diagnostics.js?v=20260822-v567'),`${f} missing diagnostics layer`);}
const cpp=fs.readFileSync(path.join(root,'assets/example-learning-tools.js'),'utf8');
assert(/fast&&!fast\.error/.test(cpp),'successful C++ fast path missing');
assert(/runCppEmception\(code\)/.test(cpp),'C++ error fallback must use the full compiler');
console.log(`VS Code diagnostics contract passed for ${courses.length} course pages.`);
