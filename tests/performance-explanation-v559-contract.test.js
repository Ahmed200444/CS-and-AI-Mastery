const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const line=read('assets/line-by-line-explanations.js');
const routing=read('assets/course-practice-routing.js');
const pythonOnly=read('assets/python-only-ui.js');
const unified=read('assets/unified-learning-design.js');
const adaptive=read('assets/adaptive-v4-live.js');
const theme=read('assets/course-theme-toggle.js');
const study=read('assets/study-examples.js');
const qualityCss=read('assets/final-quality-layer.css');
const adaptiveCss=read('assets/adaptive-v4-live.css');
const index=read('index.html');

assert.ok(/line-by-line-explanations\.js\?v=/.test(index),'main website must load the versioned universal line explainer');
assert.ok(line.includes('Open this section to build the explanation.'),'line explanations must render lazily');
assert.ok(line.includes('data-csai-term-host'),'term glossary host must be present');
assert.ok(!line.includes("rootMargin:'900px 0px'"),'closed lessons must not initialize explanation UI just because they approach the viewport');

const sandbox={window:{},document:{readyState:'loading',addEventListener(){},getElementById(){return null;}},setTimeout(){return 1;},clearTimeout(){},MutationObserver:function(){this.observe=function(){};},WeakMap,console};
vm.createContext(sandbox);vm.runInContext(line,sandbox,{filename:'line-by-line-explanations.js'});
const api=sandbox.window.CSAILineExplainer;
assert.ok(api&&typeof api.glossaryTerms==='function','glossary API must be available');
const code=`import io, sys
buffer = io.StringIO()
old_stdout = sys.stdout
sys.stdout = buffer
buffer.write("hello")
buffer.seek(0)
text = buffer.read()
captured = buffer.getvalue()
sys.stdout = old_stdout`;
const rows=api.explain(code,'python');
assert.match(rows[0].purpose,/input\/output|I\/O/i);
assert.match(rows[1].purpose,/in-memory text stream|text file/i);
assert.match(rows[2].purpose,/standard output/i);
assert.match(rows[3].purpose,/print\(\).*instead of the normal screen/i);
assert.match(rows[4].purpose,/Writes/i);
assert.match(rows[5].purpose,/cursor/i);
assert.match(rows[6].purpose,/Reads text/i);
assert.match(rows[7].purpose,/captured/i);
const terms=api.glossaryTerms(code,'python');
const names=terms.map(t=>t.term);
for(const term of ['I/O','io module','sys module','StringIO','sys.stdout']) assert.ok(names.includes(term),'missing beginner glossary term '+term);

assert.ok(!routing.includes("observe(document.body,{childList:true,subtree:true,attributes:true"),'theme repair must not observe every style/class mutation');
assert.ok(routing.includes('pending.add(n)'),'practice routing must batch newly added subtrees');
assert.ok(pythonOnly.includes('batch.forEach(apply)'),'Python-only cleanup must process changed subtrees instead of rescanning the page');
assert.ok(unified.includes('if(!shellPage)return'),'home/path observer must not stay active on standalone course pages');
assert.ok(adaptive.includes("if(!document.getElementById('hub'))return"),'adaptive shell observer must not stay active on standalone course pages');
assert.ok(!theme.includes("attributeFilter:['data-theme','style','hidden','class']"),'theme toggle must not watch all style/class attribute changes');
assert.ok(study.includes("n.matches('.lesson')"),'study-example observer must ignore unrelated output/explanation mutations');
assert.ok(qualityCss.includes('content-visibility:auto'),'large off-screen course blocks must defer paint/layout work');
assert.ok(adaptiveCss.includes('backdrop-filter:none!important'),'fixed glass surfaces must avoid expensive blur repainting while scrolling');

console.log('v5.59 performance + beginner explanation contract PASS');
