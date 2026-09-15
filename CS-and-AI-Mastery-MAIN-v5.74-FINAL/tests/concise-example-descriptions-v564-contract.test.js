'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const ROOT=path.resolve(__dirname,'..');
const pages=fs.readdirSync(path.join(ROOT,'courses')).filter(f=>f.endsWith('.html')).sort();
assert.equal(pages.length,62,'expected 62 course pages');
for(const f of pages){
  const h=fs.readFileSync(path.join(ROOT,'courses',f),'utf8');
  assert(h.includes('study-examples.js?v=20260824-v574'),`${f}: concise study-example build missing`);
  assert(h.includes('practice-guidance.js?v=20260823-v573'),`${f}: concise practice-guidance build missing`);
  assert(h.includes('purpose-first-prompts.js?v=20260822-v567'),`${f}: concise purpose cleanup build missing`);
}
const study=fs.readFileSync(path.join(ROOT,'assets','study-examples.js'),'utf8');
assert(study.includes('What the program does'),'study examples must show the concise description heading');
for(const forbidden of ['REQUIRED — what this example demonstrates','REQUIRED — what to learn from this example','Before running it, predict','Predict the result or effect first','Example idea:</b>','Why it is here:</b>']){
  assert(!study.includes(forbidden),`study-example renderer still contains verbose/duplicate copy: ${forbidden}`);
}
const purpose=fs.readFileSync(path.join(ROOT,'assets','purpose-first-prompts.js'),'utf8');
for(const forbidden of ['Company problem before ','Company-style ticket:','Your first move:','Definition of done:','Question before you look at the solution:','Why this example exists:']){
  assert(!purpose.includes(forbidden),`purpose layer still renders: ${forbidden}`);
}
const guidance=fs.readFileSync(path.join(ROOT,'assets','practice-guidance.js'),'utf8');
assert(guidance.includes('questionOnlyElement'),'practice guidance should render only the compact always-visible Question block');
assert(!guidance.includes('<span class=\"csai-guide-required\">Required</span>'),'Question block must not display a Required badge');
console.log('Concise example descriptions v5.64 contract PASS — 62 course pages use the minimal example UI.');
