'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const sandbox={window:{},document:{readyState:'loading',addEventListener(){},getElementById(){return null;}},setTimeout(){},clearTimeout(){},MutationObserver:function(){this.observe=function(){};},console};
vm.runInNewContext(fs.readFileSync('assets/line-by-line-explanations.js','utf8'),sandbox);
const api=sandbox.window.CSAILineExplainer;
const syntax=(code,lang)=>api.explain(code,lang)[0].syntax.join(' ');
assert.doesNotMatch(syntax('print("x == y; a % b; in; is")','python'),/compares|remainder|identity|membership/i);
assert.doesNotMatch(syntax('std::vector<int> values;','cpp'),/greater than|less than/);
assert.doesNotMatch(syntax('double value = 1.5;','cpp'),/property|attribute/);
assert.doesNotMatch(syntax('query -> retrieve -> answer','text'),/compares|assignment/);
assert.doesNotMatch(syntax('const square = n => n ** 2;','javascript'),/in Python|`==`/);
assert.doesNotMatch(syntax('const square = n => n ** 2;','javascript'),/compares/);
assert.doesNotMatch(syntax('return <button>{count}</button>;','javascript'),/compares/);
assert.doesNotMatch(syntax('cout << value;','cpp'),/compares/);
assert.match(syntax('y = x .* x; % square each entry','matlab'),/corresponding array elements/);
assert.match(syntax('y2(k) = cos(xv);','matlab'),/indices start at 1/);
assert.match(syntax("y = [1 2]'; % column",'matlab'),/transposes/);
assert.doesNotMatch(syntax('A = [1 2]; % 50% note','matlab'),/remainder/);
assert.match(api.explain('y2(k) = cos(xv);','matlab')[0].purpose,/MATLAB indices start at 1/);
assert.match(api.explain('BLT loop','armasm')[0].purpose,/N differs from V/);
assert.match(api.explain('SUBS r1, r0, #5','armasm')[0].purpose,/r0.*-.*#5.*r1.*updates flags/);
assert.match(api.explain('namespace app {','cpp')[0].purpose,/namespace `app`/);
assert.match(api.explain('auto [distance, node] = queue.top();','cpp')[0].purpose,/structured binding/);
assert.equal(api.inferLanguage('function y = f(x)\ny=x;\nend','matlab'),'matlab');
assert.equal(api.inferLanguage('MOV r0, #5','armasm'),'armasm');
assert.equal(api.inferLanguage('const text = "print(42)";','javascript'),'javascript');
assert.equal(api.inferLanguage('#!/bin/bash\nFOLDER=$1',''),'shell');
for(const [lang,source] of [['matlab',"A = [1 2]';\ny = A .* A;"],['armasm','MOV r0, #5\nADD r1, r0, #2']]){
 const commented=api.commentedCode(source,lang);assert.notEqual(commented,source);
 const stripped=api.stripGeneratedComments(commented);
 if(lang==='armasm')assert.equal(stripped,'MOV R0, #5\nADD R1, R0, #2','ARM lecture view intentionally normalizes instruction/register casing while preserving executable semantics');
 else assert.equal(stripped,source);
 assert.equal(api.commentedCode(commented,lang),commented,'comments must not accumulate');
}
assert.ok(api.syntaxUsedEntries('print("a % b; yield; lambda")','python').every(x=>!['Modulo `%`','Generator function'].includes(x.name)));
assert.ok(api.syntaxUsedEntries('y = x .* x;','matlab').some(x=>x.name==='Element-wise operators'));
assert.ok(api.syntaxUsedEntries('LDR r0, [r1, #4]','armasm').some(x=>x.name==='Word addressing'));
function decode(s){return s.replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));}
let examples=0,lines=0;
const pages=fs.readdirSync('courses').filter(n=>n.endsWith('.html'));
assert.equal(pages.length,65);
for(const name of pages){
 const html=fs.readFileSync('courses/'+name,'utf8');assert.match(html,/line-by-line-explanations\.js\?[^"']+learning=20261003-v584/);
 let local=0;
 for(const m of html.matchAll(/<pre\b([^>]*\bclass="[^"]*\bcode\b[^"]*"[^>]*)>([\s\S]*?)<\/pre>/g)){
  const code=decode(m[2]),label=(m[1].match(/data-language="([^"]+)"/)||[])[1]||'',lang=api.inferLanguage(code,label),rows=api.explain(code,lang);
  assert.equal(rows.length,code.split(/\r?\n/).length);examples++;local++;lines+=rows.length;
  for(const [i,row] of rows.entries()){
   assert.equal(row.code,code.split(/\r?\n/)[i]);assert.equal(row.number,i+1);assert.ok(row.purpose&&row.syntax.length,name+' missing line teaching');
   assert.doesNotMatch(row.purpose,/^This (?:MATLAB|C\+\+|Java|Python|JavaScript) line|^This ARM instruction|^MATLAB reference/,name+' has a generic executable fallback');
  }
 }
 assert.ok(local>0,name+' must include audited examples');
}
assert.ok(examples>=967&&lines>=5194,'all existing static examples must remain covered');
const courses=JSON.parse(fs.readFileSync('assets/arm-course-additions.json','utf8'));
const arm=courses.find(c=>c.id==='arm-assembly');
const expected=['arm-01','arm-02','arm-09','arm-05','arm-06','arm-07','arm-04','arm-03','arm-08','arm-10','arm-11','arm-12'];
assert.deepEqual(arm.lessons.map(l=>l.id),expected);
const page=fs.readFileSync('courses/arm-assembly.html','utf8');assert.deepEqual([...page.matchAll(/<details class="lesson" data-lesson="([^"]+)"/g)].map(m=>m[1]),expected);
const matlab=JSON.parse(fs.readFileSync('assets/matlab-course-addition.json','utf8'));
for(const c of [...courses,matlab]){
 let previous=0;for(const lesson of c.lessons){assert.ok(lesson.lecture.order>=previous);previous=lesson.lecture.order;assert.ok(lesson.lecture.file.endsWith('.pdf'));assert.ok(lesson.lecture.slides[0]<=lesson.lecture.slides[1]);}
 assert.ok(fs.readFileSync('courses/'+c.id+'.html','utf8').includes('Follow your lecture order'));
}
console.log(`Explanation accuracy passed: ${pages.length} courses, ${examples} code/reference blocks, ${lines} source lines; ARM/MATLAB lecture order preserved.`);
