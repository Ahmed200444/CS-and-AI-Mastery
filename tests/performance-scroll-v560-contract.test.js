const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const quality=read('assets/final-quality-layer.css');
const adaptive=read('assets/adaptive-v4-live.css');
const vscode=read('assets/vscode-diagnostics.js');
const line=read('assets/line-by-line-explanations.js');
const index=read('index.html');
const dsa=read('courses/dsa.html');

assert.ok(quality.includes('v5.60 scroll-smoothness fix'),'global course scroll fix must be present');
assert.match(quality,/\.csai-study-example[\s\S]*content-visibility:visible!important/,'study examples must be pre-laid-out instead of activated during scrolling');
assert.match(quality,/\.oa-task[\s\S]*content-visibility:visible!important/,'assessment tasks must not defer layout into the scroll path');
assert.ok(adaptive.includes('v5.60: do not virtualize catalog/path cards'),'catalog/path scroll fix must be present');
assert.match(quality,/\.app::before[\s\S]*display:none!important/,'fixed decorative course gradients must not repaint during scrolling');
assert.match(quality,/\.side,[\s\S]*backdrop-filter:none!important/,'course sidebars must not use backdrop blur while scrolling');
assert.match(quality,/body\.av4-course-page \.lesson[\s\S]*box-shadow:none!important/,'long course blocks must avoid large scrolling shadows');

assert.match(adaptive,/#coursesTrack \.cx-card[\s\S]*content-visibility:visible!important/,'catalog cards must not activate layout during scrolling');
assert.ok(!vscode.includes("rootMargin:'500px 0px'"),'editor diagnostics must not be triggered by viewport scrolling');
assert.ok(vscode.includes("document.addEventListener('focusin'"),'editor diagnostics must still activate when the learner focuses an editor');
assert.ok(vscode.includes("document.addEventListener('input'"),'editor diagnostics must still activate while editing');
assert.ok(!line.includes("rootMargin:'900px 0px'"),'closed-lesson line explanations must not be built merely by scrolling near them');
assert.ok(line.includes("e.target.matches&&e.target.matches('.lesson')&&e.target.open"),'line explanations must still activate when a lesson is opened');
assert.ok(index.includes('20260822-v567'),'main shell must bust v5.59 browser cache');
assert.ok(dsa.includes('20260822-v567'),'generated course pages must bust v5.59 browser cache');
console.log('v5.60 scroll performance contract PASS');
