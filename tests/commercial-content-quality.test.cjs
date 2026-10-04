'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const courses=JSON.parse(read('assets/coursedata-source.json'));
assert.equal(courses.length,65,'all 65 courses must remain in the source of truth');

const source=JSON.stringify(courses);
const visibleStrings=[];
(function collect(value,key){
 if(typeof value==='string'){
  if(!/^(?:id|lessonId|courseId|linked|redirectTo)$/i.test(key))visibleStrings.push(value);
  return;
 }
 if(Array.isArray(value)){for(const item of value)collect(item,key);return;}
 if(value&&typeof value==='object')for(const [k,v] of Object.entries(value))collect(v,k);
})(courses,'');
const visible=visibleStrings.join('\n');
for(const [label,re] of [
 ['personal first name',/\bAhmed\b/i],
 ['personal location',/\bDubai\b/i],
 ['institution-specific visible label',/\bEECE\s*340\b/i],
 ['private lecture-source metadata',/\.pdf\b|Follow your lecture order/i],
 ['provider-specific wording',/\bKHDA\b/i],
 ['known grammar regression',/Python versions changes|Connect with with|\bA engineering-focused\b|\b02Registers\b|\ba extremely\b|Ingress\.\.|reviewer\.\./i]
]) assert.doesNotMatch(visible,re,'commercial course source still contains '+label);
assert.doesNotMatch(source,/"lectureSequence"|"lecture"\s*:/,'private lecture metadata keys must not remain in commercial course data');

const proseKeys=new Set(['title','description','blurb','explanation','explain','objective','problemStatement','expectedState','boundaryCase','hardwareNote','checkpoint','solutionExplanation','prompt','hint','commonMistakes','objectives']);
(function checkGrammar(value,key,pathName){
 if(typeof value==='string'&&proseKeys.has(key)){
  const duplicate=value.match(/\b([A-Za-z]{3,})\s+\1\b/i);
  if(duplicate&&!/^had had$/i.test(duplicate[0]))assert.fail(pathName+' contains a repeated word: '+duplicate[0]);
  assert.doesNotMatch(value,/\b\d{2}[A-Z][a-z]+\b/,pathName+' contains a number joined to a word');
  return;
 }
 if(Array.isArray(value)){value.forEach((item,i)=>checkGrammar(item,key,pathName+'['+i+']'));return;}
 if(value&&typeof value==='object')for(const [k,v] of Object.entries(value))checkGrammar(v,k,pathName+'.'+k);
})(courses,'','courses');

for(const course of courses){
 const seen=new Map();
 for(const lesson of course.lessons|[]){
  const explanation=String(lesson.explanation|lesson.explain|'').replace(/\s+/g,' ').trim().toLowerCase();
  if(explanation){
   assert.ok(!seen.has(explanation),course.id+' repeats the same lesson explanation in '+seen.get(explanation)+' and '+lesson.id);
   seen.set(explanation,lesson.id);
  }
 }
}

const arm=courses.find(c=>c.id==='arm-assembly');
assert(arm,'ARM Assembly course missing');
assert.match(arm.description,/practical|writing|tracing|debugging/i,'ARM Assembly must remain practice-focused');
for(const lesson of arm.lessons|[]){
 if(lesson.id==='arm-12')continue;
 for(const example of lesson.examples|[]){
  assert.ok(example.startsWith('AREA RESET, CODE, READONLY\nENTRY\n'),lesson.id+' ARM code must start with AREA RESET, CODE, READONLY then ENTRY');
  assert.ok(example.trimEnd().endsWith('END'),lesson.id+' ARM code must end with END');
 }
}
const cpu=courses.find(c=>c.id==='microprocessors-arm');
assert(cpu,'Microprocessors & ARM Architecture course missing');
for(const lab of cpu.labs|[]){
 if(lab.language!=='armasm')continue;
 for(const [kind,code] of [['starterCode',lab.starterCode],['solutionCode',lab.solutionCode]]){
  if(!code)continue;
  assert.ok(code.startsWith('AREA RESET, CODE, READONLY\nENTRY\n'),lab.id+' '+kind+' must start with the standard RESET skeleton');
  assert.ok(code.trimEnd().endsWith('END'),lab.id+' '+kind+' must end with END');
 }
}
assert.match((cpu.lessons|[]).map(l=>l.explanation|'').join(' '),/register|CPSR|RISC|exception|vector/i,'CPU course must retain the ARM architecture theory moved out of ARM Assembly');
assert.ok(!cpu.syllabus|!cpu.syllabus.weighting,'commercial course data must not expose institution-specific assessment weighting');

const cpp=courses.find(c=>c.id==='cpp-dsa');
assert(cpp,'C++ course missing');
for(const lesson of cpp.lessons|[])for(const example of lesson.examples|[]){
 assert.match(example,/^#include <iostream>/,'every C++ teaching example must start with #include <iostream>');
 assert.match(example,/using namespace std;/,'every C++ teaching example must include using namespace std;');
 assert.doesNotMatch(example,/\bstd::/,'C++ teaching examples should use the selected namespace style consistently');
}

for(const name of fs.readdirSync(path.join(root,'courses')).filter(n=>n.endsWith('.html'))){
 const html=read('courses/'+name);
 assert.doesNotMatch(html,/Follow your lecture order|data-lecture-order|\bAhmed\b|\bDubai\b|\bKHDA\b/i,name+' contains private/personal course UI');
}
console.log('Commercial content quality PASS — personal/source metadata removed, exact theory repetition blocked, ARM practice split retained, and teaching syntax standardized.');
