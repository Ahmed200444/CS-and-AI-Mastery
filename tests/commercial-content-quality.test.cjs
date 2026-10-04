'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const courses=JSON.parse(read('assets/coursedata-source.json'));
assert.equal(courses.length,65,'all 65 courses must remain in the source of truth');

const source=JSON.stringify(courses);
for(const [label,re] of [
 ['personal first name',/\bAhmed\b/i],
 ['personal location',/\bDubai\b/i],
 ['institution-specific visible label',/\bEECE\s*340\b/i],
 ['private lecture-source metadata',/"lectureSequence"|"lecture"\s*:|\.pdf\b|Follow your lecture order/i],
 ['provider-specific wording',/\bKHDA\b/i],
 ['known grammar regression',/Python versions changes|Connect with with|\bA engineering-focused\b|\b02Registers\b/i]
]) assert.doesNotMatch(source,re,'commercial course source still contains '+label);

for(const course of courses){
 const seen=new Map();
 for(const lesson of course.lessons||[]){
  const explanation=String(lesson.explanation||lesson.explain||'').replace(/\s+/g,' ').trim().toLowerCase();
  if(explanation){
   assert.ok(!seen.has(explanation),course.id+' repeats the same lesson explanation in '+seen.get(explanation)+' and '+lesson.id);
   seen.set(explanation,lesson.id);
  }
 }
}

const arm=courses.find(c=>c.id==='arm-assembly');
assert(arm,'ARM Assembly course missing');
assert.match(arm.description,/practical|writing|tracing|debugging/i,'ARM Assembly must remain practice-focused');
for(const lesson of arm.lessons||[]){
 if(lesson.id==='arm-12')continue;
 for(const example of lesson.examples||[]){
  assert.ok(example.startsWith('AREA RESET, CODE, READONLY\nENTRY\n'),lesson.id+' ARM code must start with AREA RESET, CODE, READONLY then ENTRY');
  assert.ok(example.trimEnd().endsWith('END'),lesson.id+' ARM code must end with END');
 }
}
const cpu=courses.find(c=>c.id==='microprocessors-arm');
assert(cpu,'Microprocessors & ARM Architecture course missing');
for(const lab of cpu.labs||[]){
 if(lab.language!=='armasm')continue;
 for(const [kind,code] of [['starterCode',lab.starterCode],['solutionCode',lab.solutionCode]]){
  if(!code)continue;
  assert.ok(code.startsWith('AREA RESET, CODE, READONLY\nENTRY\n'),lab.id+' '+kind+' must start with the standard RESET skeleton');
  assert.ok(code.trimEnd().endsWith('END'),lab.id+' '+kind+' must end with END');
 }
}
assert.match((cpu.lessons||[]).map(l=>l.explanation||'').join(' '),/register|CPSR|RISC|exception|vector/i,'CPU course must retain the ARM architecture theory moved out of ARM Assembly');

const cpp=courses.find(c=>c.id==='cpp-dsa');
assert(cpp,'C++ course missing');
for(const lesson of cpp.lessons||[])for(const example of lesson.examples||[]){
 if(!/#include|\bint\s+main\s*\(/.test(example))continue;
 assert.match(example,/^#include <iostream>/,'C++ teaching programs must start with #include <iostream>');
 assert.match(example,/using namespace std;/,'C++ teaching programs must include using namespace std;');
}

for(const name of fs.readdirSync(path.join(root,'courses')).filter(n=>n.endsWith('.html'))){
 const html=read('courses/'+name);
 assert.doesNotMatch(html,/Follow your lecture order|data-lecture-order|\bAhmed\b|\bDubai\b|\bKHDA\b/i,name+' contains private/personal course UI');
}
console.log('Commercial content quality PASS — personal/source metadata removed, exact theory repetition blocked, ARM practice split retained, and teaching syntax standardized.');
