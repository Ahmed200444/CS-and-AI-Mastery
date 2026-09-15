const fs=require('fs');
const path=require('path');
const assert=require('assert');
const root=path.resolve(__dirname,'..');
const js=fs.readFileSync(path.join(root,'assets','study-examples.js'),'utf8');
const courses=fs.readdirSync(path.join(root,'courses')).filter(f=>f.endsWith('.html'));
assert.strictEqual(courses.length,62,'expected all 62 course pages');
for(const f of courses){
  const h=fs.readFileSync(path.join(root,'courses',f),'utf8');
  assert(h.includes('study-examples.js?v=20260824-v574'),`${f}: must load the v5.66 concept-specific example layer`);
}
for(const phrase of [
  'A Python reference is the connection from a variable name to an object',
  'Identity asks whether two names refer to the exact same object',
  'Aliasing happens when two or more names refer to the same object',
  'Mutation means changing an existing object',
  'Automatic memory management means Python tracks object lifetime'
]) assert(js.includes(phrase),`missing concept-specific definition: ${phrase}`);
assert(!js.includes('return shortSentences(base,280);'),'concept definitions must not fall back to one shared lesson sentence');
assert(js.includes("program(label,index+1,course)"),'concept generation must try the concept label before the lesson title');
assert(js.includes('conceptCodeBrief(b,label,programBehavior(code,\'python\'))'),'runnable concept cards must show a concise definition plus practical explanation');
for(const codeMarker of [
  "if(/^references?$|object references?|python references?/.test(t))return 'a = [1, 2]",
  "if(/^identity$|object identity/.test(t))return 'a = [1, 2]",
  "if(/^aliasing$|object aliasing/.test(t))return 'original = {\"status\": \"new\"}",
  "if(/^mutation$|mutability|mutable objects?/.test(t))return 'items = [1, 2]"
]) assert(js.includes(codeMarker),`missing practical concept code: ${codeMarker}`);
assert(js.includes("['comparch-os','digital-hardware','advanced-computer-organization','embedded-systems'].includes(cid)&&/cache|cpi|pipeline|latency|throughput|branch|memory|tlb|architecture/.test(t)"),'generic memory words must not accidentally create computer-architecture code in unrelated courses');
console.log('v5.66 concept-specific definitions/practical examples: OK across 62 courses');
