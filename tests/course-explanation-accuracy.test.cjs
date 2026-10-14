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
assert.match(api.explain('namespace app {','cpp')[0].purpose,/namespace `app`/);
assert.match(api.explain('auto [distance, node] = queue.top();','cpp')[0].purpose,/structured binding/);
assert.equal(api.inferLanguage('const text = "print(42)";','javascript'),'javascript');
assert.equal(api.inferLanguage('#!/bin/bash\nFOLDER=$1',''),'shell');
for(const [lang,source] of [['python','values = [1, 2]\ntotal = values[0] + values[1]'],['cpp','int total = 1 + 2;']]){
 const commented=api.commentedCode(source,lang);assert.notEqual(commented,source);
 const stripped=api.stripGeneratedComments(commented);
 if(lang==='cpp')assert.equal(stripped,'#include <iostream>\nusing namespace std;\n\nint total = 1 + 2;','C++ teaching view standardizes the iostream/namespace header');
 else assert.equal(stripped,source);
 assert.equal(api.commentedCode(commented,lang),commented,'comments must not accumulate');
}
assert.ok(api.syntaxUsedEntries('print("a % b; yield; lambda")','python').every(x=>!['Modulo `%`','Generator function'].includes(x.name)));
function decode(s){return s.replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));}
let examples=0,lines=0;
const pages=fs.readdirSync('courses').filter(n=>n.endsWith('.html'));
assert.equal(pages.length,62);
for(const name of pages){
 const html=fs.readFileSync('courses/'+name,'utf8');assert.match(html,/line-by-line-explanations\.js\?[^"']+learning=20261003-v584/);
 let local=0;
 for(const m of html.matchAll(/<pre\b([^>]*\bclass="[^"]*\bcode\b[^"]*"[^>]*)>([\s\S]*?)<\/pre>/g)){
  const code=decode(m[2]),label=(m[1].match(/data-language="([^"]+)"/)||[])[1]||'',lang=api.inferLanguage(code,label),rows=api.explain(code,lang);
  assert.equal(rows.length,code.split(/\r?\n/).length);examples++;local++;lines+=rows.length;
  for(const [i,row] of rows.entries()){
   assert.equal(row.code,code.split(/\r?\n/)[i]);assert.equal(row.number,i+1);assert.ok(row.purpose&&row.syntax.length,name+' missing line teaching');
   assert.doesNotMatch(row.purpose,/^This (?:C\+\+|Java|Python|JavaScript) line/,name+' has a generic executable fallback');
  }
 }
 assert.ok(local>0,name+' must include audited examples');
}
assert.ok(examples>=935&&lines>=5026,'all existing static examples must remain covered');
console.log(`Explanation accuracy passed: ${pages.length} courses, ${examples} code/reference blocks, ${lines} source lines.`);
