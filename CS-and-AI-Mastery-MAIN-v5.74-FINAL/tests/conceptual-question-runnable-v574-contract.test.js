'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const pages=fs.readdirSync(path.join(root,'courses')).filter(f=>f.endsWith('.html')).sort();
assert.equal(pages.length,62,'v5.74 expects all 62 course pages');
for(const f of pages){
  const h=read('courses/'+f);
  for(const tag of [
    '../assets/study-examples.js?v=20260824-v574',
    '../assets/conceptual-examples-v574.js?v=20260824-v574',
    '../assets/program-questions-v574.js?v=20260824-v574'
  ]) assert.ok(h.includes(tag),`${f}: missing v5.74 concept/question asset ${tag}`);
}
const home=read('index.html');
for(const tag of [
  'assets/study-examples.js?v=20260824-v574',
  'assets/conceptual-examples-v574.js?v=20260824-v574',
  'assets/program-questions-v574.js?v=20260824-v574'
]) assert.ok(home.includes(tag),`homepage missing ${tag}`);

const concepts=read('assets/conceptual-examples-v574.js');
for(const marker of [
  'Conceptual examples',
  'data-csai-conceptual-examples',
  'Short situations that show when each key idea is useful.',
  '<b>Example:</b>',
  '<b>Question:</b>',
  "querySelectorAll('.pill')",
  "e.target.matches&&e.target.matches('.lesson')&&e.target.open",
  "querySelectorAll('.lesson[open]')"
]) assert.ok(concepts.includes(marker),`conceptual-example layer missing: ${marker}`);
assert.ok(!/\bRequired\b/.test(concepts),'conceptual examples must not show a Required label');
assert.ok(!/\boptional\b/i.test(concepts),'conceptual examples must not be presented as optional');
assert.ok(concepts.includes('window.CSAIStudyExampleContent'),'conceptual examples should reuse the rich existing per-concept use mappings');

const questions=read('assets/program-questions-v574.js');
for(const marker of [
  '.lesson-run-card',
  '.lesson .body pre.code',
  "data-csai-learning-question','program'",
  "code.insertAdjacentElement('beforebegin',node)",
  'Create a singly linked list containing 1 → 2 → 3',
  'build a prefix-sum list that starts with 0',
  'count how many times each value appears',
  'reverse it in place by swapping values from the two ends'
]) assert.ok(questions.includes(marker),`program-question layer missing: ${marker}`);
assert.ok(!/\bRequired\b/.test(questions),'program questions must not show a Required label');
assert.ok(!/\boptional\b/i.test(questions),'program questions must not be optional');
assert.ok(questions.includes("if(root.matches&&root.matches('pre.code')&&root.closest&&root.closest('.lesson-run-card'))return"),'raw code scan must avoid duplicating questions inside runner cards');
assert.ok(questions.includes('.csai-study-example-lazy-body > .csai-learning-question'),'program-question layer must reuse the generated question after lazy study-card hydration instead of duplicating it');

const study=read('assets/study-examples.js');
assert.ok(study.includes('window.CSAIStudyExampleContent={'),'study-example concept/question helper API must be exported');
assert.ok(study.includes("version:'5.74'"),'study-example helper API must identify v5.74');
assert.ok(study.includes('ensureStudyQuestion(card,i)'),'generated concept/code cards must keep their own always-visible question');
assert.ok(study.includes("node.innerHTML='<b>Question</b><p>'"),'generated code questions must remain visible text');

const dsa=read('courses/dsa.html');
const linked=dsa.match(/<pre class="code"[^>]*>class Node:\s*\n\s*def __init__\(self, value\):[\s\S]*?# 1 -&gt; 2 -&gt; 3[\s\S]*?<\/pre>/);
assert.ok(linked,'linked-list 1 -> 2 -> 3 teaching program missing');
assert.ok(!/data-reference-only="true"/.test(linked[0]),'valid linked-list teaching program must not be reference-only');
assert.ok(/data-example-audit="candidate"/.test(linked[0]),'valid linked-list program should be a runnable candidate');
assert.ok(linked[0].includes('print(head.value, head.next.value, head.next.next.value)'),'linked-list program should visibly prove the 1 -> 2 -> 3 links when run');

assert.equal(JSON.parse(read('package.json')).version,'5.74.0','package version must be v5.74.0');
assert.ok(read('local-server.js').includes("RELEASE='5.74'"),'local server must identify v5.74');
assert.ok(read('desktop-launcher.js').includes("RELEASE = '5.74'"),'desktop launcher must identify v5.74');
assert.ok(read('sw.js').includes('csai-v5-74-concepts-questions-runners'),'service worker cache must identify the v5.74 learning layer');
console.log('v5.74 concept/question/runnable contract PASS — conceptual examples restored, questions sit above programs, and valid linked-list code is runnable across the current 62-course build.');
