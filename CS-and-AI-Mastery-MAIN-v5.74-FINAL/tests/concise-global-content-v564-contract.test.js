'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const pages=fs.readdirSync(path.join(root,'courses')).filter(f=>f.endsWith('.html')).sort();
assert.equal(pages.length,62,'expected 62 course pages');
let lessonSections=0;
for(const f of pages){
  const h=fs.readFileSync(path.join(root,'courses',f),'utf8');
  assert.ok(h.includes('study-examples.js?v=20260824-v574'),`${f}: v5.64 study examples missing`);
  assert.ok(h.includes('practice-guidance.js?v=20260823-v573'),`${f}: v5.64 guidance missing`);
  const sections=[...h.matchAll(/<section class="lesson-main-explanation"[^>]*>\s*<h3>Explanation<\/h3>\s*<p>([\s\S]*?)<\/p>\s*<\/section>/gi)];
  lessonSections+=sections.length;
  for(const m of sections){
    const plain=m[1].replace(/<[^>]+>/g,'').replace(/&[^;]+;/g,'x').replace(/\s+/g,' ').trim();
    assert.ok(plain.length>20,`${f}: lesson explanation is too short to teach the idea`);
    assert.ok(plain.length<=380,`${f}: lesson explanation is still too wordy (${plain.length})`);
  }
  assert.ok(!/<section class="lesson-main-explanation"[\s\S]*?<h3>Worked scenario<\/h3>/i.test(h),`${f}: worked-scenario coaching remains in lesson explanation`);
}
assert.equal(lessonSections,800,'expected concise explanation for all 800 lessons');

const dataDir=path.join(root,'assets','course-data');
let dataLessons=0;
for(const f of fs.readdirSync(dataDir).filter(f=>f.endsWith('.json'))){
  const d=JSON.parse(fs.readFileSync(path.join(dataDir,f),'utf8'));
  for(const l of d.lessons||[]){
    dataLessons++;
    const x=String(l.explanation||l.explain||'').replace(/\s+/g,' ').trim();
    assert.ok(x.length>20,`${d.id}/${l.id||l.title}: missing explanation`);
    assert.ok(x.length<=380,`${d.id}/${l.id||l.title}: explanation still too wordy (${x.length})`);
  }
}
assert.equal(dataLessons,800,'course-data lesson count drift');

const study=fs.readFileSync(path.join(root,'assets','study-examples.js'),'utf8');
for(const banned of ['Company task —','Specific responsibility:','Scenario angle:','Practice move:','Behavior to explain:','This example shows only the scenario written below.','Applied scenario:']){
  assert.ok(!study.includes(banned),`study examples still contain verbose framing: ${banned}`);
}
assert.ok(study.includes('<b>Definition</b>'),'concept-only cards must show a short definition');
assert.ok(study.includes('conceptDefinition(b,label)'),'concept cards must use the concise definition helper');
assert.ok(study.includes("programBehavior(code,'python')"),'code examples must describe the actual program');

const guidance=fs.readFileSync(path.join(root,'assets','practice-guidance.js'),'utf8');
const guideFn=(guidance.match(/function guideElement\(g,kind\)\{[\s\S]*?\n\}/)||[''])[0];
assert.ok(/questionOnlyElement/.test(guidance)&&/kind==='example'\|\|kind==='quiz'/.test(guideFn),'practice guidance must render only the new compact question for lessons/exercises/projects while avoiding duplicate example/quiz panels');
assert.ok(!/csai-guide-required[^\n]*>/.test(guideFn),'the compact question must not render a Required badge');
const expanded=fs.readFileSync(path.join(root,'assets','assessment-expanded-descriptions.js'),'utf8');
const enhanceFn=(expanded.match(/function enhance\(\)\{[\s\S]*?\n\}/)||[''])[0];
assert.ok(/return;/.test(enhanceFn),'duplicate assessment task/result/requirements panels must stay suppressed');

const editable=fs.readFileSync(path.join(root,'assets','universal-editable-code.js'),'utf8');
assert.ok(editable.includes("getAttribute('data-reference-only')==='true')return false"),'concept/reference text must never become an editable-code box');
assert.ok(!editable.match(/PRE_FALLBACK=\[[\s\S]*?pre\[data-reference-only="true"\]/),'reference-only blocks must not be in editable-code targets');

const canonical=JSON.parse(fs.readFileSync(path.join(root,'assets','coursedata-source.json'),'utf8'));
for(const c of canonical){
  for(const l of c.lessons||[]){
    const mistakes=Array.isArray(l.commonMistakes)?l.commonMistakes.join(' '):String(l.commonMistakes||'');
    assert.ok(mistakes.length<=200,`${c.id}/${l.id||l.title}: common-mistake note still too wordy (${mistakes.length})`);
  }
  for(const e of c.exercises||[]){
    assert.ok(!/realistic engineering scenario|State the assumptions, show the key artifact/i.test(String(e.prompt||'')),`${c.id}/${e.id||e.title}: generic exercise scenario framing remains`);
  }
  for(const p of c.projects||[]) assert.ok(String(p.description||'').length<=220,`${c.id}/${p.id||p.title}: project description is still too wordy`);
}

console.log('v5.64 concise global content contract PASS — 62 courses / 800 lessons use short explanations and no verbose scenario framing.');
