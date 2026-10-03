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
