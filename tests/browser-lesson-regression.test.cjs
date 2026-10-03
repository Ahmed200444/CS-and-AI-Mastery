'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
function load(file,document){const window={};vm.runInNewContext(fs.readFileSync(file,'utf8'),{document,window,console,setTimeout(){},clearTimeout(){},MutationObserver:class{observe(){}}});return window;}
// A detached example can be prepared without losing the question or throwing.
const dormant={readyState:'loading',addEventListener(){}};
const study=load('assets/study-examples.js',dormant);
for(const language of ['armasm','matlab']){
 const card={querySelector(){return null;},querySelectorAll(){return [];},closest(){return null;},getAttribute(n){return n==='data-language'?language:'Register transfer';}};
 const question=study.CSAIStudyExampleContent.studyQuestionFor(card,0);
 assert.match(question,language==='armasm'?/register, flag, memory/:/MATLAB/);
 assert.doesNotMatch(question,/Python/);
}
// The active course enhancer must work on a real course shape and settle after
// its first pass. Rewriting an unchanged heading would feed its own observer.
let headingWrites=0,spans=[];
const heading={get textContent(){return 'ARM Assembly';},set textContent(v){headingWrites++;}};
const meta={querySelector(s){return spans.find(n=>s==='[data-adaptive-total]'&&n.attributes['data-adaptive-total']!==undefined)||null;},appendChild(n){spans.push(n);}};
const hero={querySelector(s){return s==='.meta'?meta:s==='h1'?heading:null;}};
const b={querySelector(){return null;},querySelectorAll(){return [{},{}];}};
const course={readyState:'complete',documentElement:{},head:{appendChild(){}},createElement(){return {attributes:{},setAttribute(k,v){this.attributes[k]=v;}};},getElementById(id){return id==='course-page-meta'?{textContent:'{"id":"arm-assembly"}'}:id==='csai-adaptive-practice-style'?{}:null;},querySelector(s){return s==='.hero'?hero:null;},querySelectorAll(){return [{querySelector(){return b;}}];},addEventListener(){}};
load('assets/adaptive-practice-layer.js',course);
assert.equal(spans.length,1);assert.equal(spans[0].textContent,'2 examples');assert.equal(headingWrites,0);
// Re-enhancing an editable PRE must retain its adjacent question, rather than
// adding another question on every mutation/timer.
let inserts=0,previous=null;
const pre={nodeType:1,matches(s){return s==='pre.code'||s.includes('.lesson .body pre.code');},closest(){return null;},classList:{contains(){return false;}},querySelector(){return null;},querySelectorAll(){return [];},get previousElementSibling(){return previous;},getAttribute(){return 'armasm';},textContent:'MOV r0, #5',insertAdjacentElement(_,q){inserts++;previous=q;q.nextElementSibling=this;}};
const doc={...dormant,getElementById(){return {};},createElement(){return {setAttribute(){},matches(s){return s==='.csai-learning-question';}};}};
const questions=load('assets/program-questions-v574.js',doc).CSAIProgramQuestions;
questions.enhance(pre);questions.enhance(pre);questions.enhance(pre);
assert.equal(inserts,1);assert.match(previous.innerHTML,/ARM/);
console.log('Browser lesson regressions passed: detached examples, active hero, repeated question enhancement.');
// Standalone pages save partial progress maps. The catalog must preserve those
// lesson records and count them without requiring exercise/quiz records.
const catalog=fs.readFileSync('assets/runtime-inline/index-064.js','utf8');
const csFunction=catalog.slice(catalog.indexOf('  function cs(id)'),catalog.indexOf('  var esc'));
const countsFunction=catalog.slice(catalog.indexOf('  function counts(c)'),catalog.indexOf('  window.counts'));
const fixture={cxstate:{arm:{lessons:{'arm-01':true}}},isAvailable(){return true;}};
vm.createContext(fixture);vm.runInContext(csFunction+countsFunction,fixture);
const progress=fixture.counts({id:'arm',lessons:[{id:'arm-01'},{id:'arm-02'}],exercises:[{}],quiz:[{}],projects:[]});
assert.equal(progress.lDone,1);assert.equal(progress.eDone,0);assert.equal(progress.qDone,0);assert.equal(progress.pct,25);assert.equal(fixture.cxstate.arm.lessons['arm-01'],true);
// Header synchronization must reach a fixed point so its observer does not
// perpetually schedule animation frames and starve catalog interaction.
const shell=fs.readFileSync('assets/adaptive-v4-live.js','utf8');
const syncFunction=shell.slice(shell.indexOf('function sync()'),shell.indexOf('function queue()'));
let crumbWrites=0,crumbText='Dashboard';
const crumb={get textContent(){return crumbText;},set textContent(v){crumbWrites++;crumbText=v;}};
const frame={scheduled:false,ensureShell(){},rebuildHome(){},catalog(){},polish(){},active(){return 'courses';},count(){return 64;},document:{querySelector(){return crumb;},querySelectorAll(){return [];}}};
vm.createContext(frame);vm.runInContext(syncFunction,frame);frame.sync();frame.sync();frame.sync();
assert.equal(crumbText,'All 64 Courses');assert.equal(crumbWrites,1);
console.log('Catalog regressions passed: partial saved progress and settling header observer.');
// Toolbar normalization must not detach and reappend every button on each
// observer pass once their order is correct.
const toolbarSource=fs.readFileSync('assets/final-exercise-toolbar.js','utf8');
const ordering=toolbarSource.slice(toolbarSource.indexOf('function appendInOrder('),toolbarSource.indexOf('function normalizeTask('));
let moves=0;const actions=[{id:'run'},{id:'submit'},{id:'publish'}];const toolbar={children:actions.slice(),appendChild(btn){moves++;this.children=this.children.filter(x=>x!==btn);this.children.push(btn);}};
const orderingContext={};vm.createContext(orderingContext);vm.runInContext(ordering,orderingContext);
orderingContext.appendInOrder(toolbar,actions);orderingContext.appendInOrder(toolbar,actions);assert.equal(moves,0);
toolbar.children.reverse();orderingContext.appendInOrder(toolbar,actions);assert.deepEqual(toolbar.children,actions);assert.equal(moves,3);
console.log('Toolbar observer regression passed: stable order performs no DOM mutations.');
// The catalog decorator also observes its own catalog subtree. It must not
// replace an identical eyebrow text node and reschedule itself indefinitely.
const redesign=fs.readFileSync('assets/product-redesign-v2.js','utf8');
const decorator=redesign.slice(redesign.indexOf('function decorateCatalog()'),redesign.indexOf('function activeKey()'));
let eyeWrites=0,eyeText='Legacy catalog';const eye={get textContent(){return eyeText;},set textContent(v){eyeWrites++;eyeText=v;}};
const head={querySelector(s){return s==='.cx-cat-eyebrow'?eye:null;}};
const view={querySelector(s){return s==='.cx-cat-head'?head:null;}};
const track={querySelector(){return view;}};
const redesignContext={document:{getElementById(){return track;}}};vm.createContext(redesignContext);vm.runInContext(decorator,redesignContext);
redesignContext.decorateCatalog();redesignContext.decorateCatalog();redesignContext.decorateCatalog();assert.equal(eyeWrites,1);
console.log('Catalog decoration regression passed: identical eyebrow text stays untouched.');
// Wrapping a PRE in both an editor and runner can leave one question outside
// and one inside. Keep a single owner-scoped question after re-enhancement.
let removedQuestions=0;const outerQuestion={matches(){return true;}};
let remainingQuestions=[];const innerQuestion={remove(){removedQuestions++;remainingQuestions=[];}};remainingQuestions=[innerQuestion];
const owner={querySelectorAll(){return remainingQuestions;},previousElementSibling:outerQuestion};
const wrappedPre={...pre,closest(selector){return selector==='.csai-editor-shell,.lesson-run-card'?owner:null;},insertAdjacentElement(){throw Error('Must reuse the existing question');}};
questions.enhance(wrappedPre);questions.enhance(wrappedPre);assert.equal(removedQuestions,1);
console.log('Nested editor/runner question duplication regression passed.');
