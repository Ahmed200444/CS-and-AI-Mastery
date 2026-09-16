'use strict';
const fs=require('fs'), path=require('path'), assert=require('assert');
const root=path.resolve(__dirname,'..');
const courses=JSON.parse(fs.readFileSync(path.join(root,'assets','coursedata-source.json'),'utf8'));
assert.equal(courses.length,62,'expected 62 courses');
assert.equal(courses.reduce((n,c)=>n+(c.lessons||[]).length,0),800,'expected 800 lessons');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'assets','catalog-data.json'),'utf8'));
const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
for(const course of courses){
  assert(String(course.careerApplications||'').trim(),`${course.id}: missing careerApplications`);
  assert((course.quiz||[]).length>0,`${course.id}: course has no knowledge checks`);
  for(const lesson of course.lessons||[]){
    assert(String(lesson.commonMistakes||lesson.commonMistake||'').trim(),`${course.id}/${lesson.id}: missing common mistake`);
    assert(String(lesson.explanation||lesson.explain||'').trim(),`${course.id}/${lesson.id}: missing explanation`);
    assert((lesson.concepts||[]).length,`${course.id}/${lesson.id}: missing concepts`);
    const ex=lesson.examples||lesson.example;
    assert(Array.isArray(ex)?ex.length:Boolean(ex),`${course.id}/${lesson.id}: missing native example`);
  }
  const prompts=(course.exercises||[]).map(e=>normalize(e.prompt||e.description)).filter(Boolean);
  assert.equal(new Set(prompts).size,prompts.length,`${course.id}: repeated exercise prompt detected`);
  const mirror=JSON.parse(fs.readFileSync(path.join(root,'assets','course-data',course.id+'.json'),'utf8'));
  assert.deepStrictEqual(mirror,course,`${course.id}: course-data mirror drift`);
  const entry=(catalog.courses||[]).find(x=>x.id===course.id);
  assert(entry,`${course.id}: missing from catalog`);
  assert.equal(entry.counts.lessons,(course.lessons||[]).length,`${course.id}: catalog lesson count drift`);
  assert.equal(entry.counts.exercises,(course.exercises||[]).length,`${course.id}: catalog exercise count drift`);
  assert.equal(entry.counts.quiz,(course.quiz||[]).length,`${course.id}: catalog quiz count drift`);
}
for(const id of ['embedded-systems','systems-programming','advanced-computer-organization']){
  const c=courses.find(x=>x.id===id);
  assert.equal(c.quiz.length,24,`${id}: expected 24 curated knowledge checks`);
  assert(!c.exercises.some(e=>/(Embedded|Systems|Architecture) practice \d+/i.test(e.title||'')),`${id}: generic exercise title remains`);
  const page=fs.readFileSync(path.join(root,'courses',id+'.html'),'utf8');
  assert(page.includes('<h2>Knowledge checks</h2>'),`${id}: static course page has no visible knowledge-check host`);
  assert(page.includes('assessment-practice.js'),`${id}: static course page does not load knowledge-check renderer`);
  assert(page.includes('24 checkpoints'),`${id}: static course page checkpoint count is stale`);
}
const htmlFiles=[path.join(root,'index.html'),path.join(root,'bytedance-2027-prep.html'),...fs.readdirSync(path.join(root,'courses')).filter(x=>x.endsWith('.html')).map(x=>path.join(root,'courses',x))];
for(const file of htmlFiles){
  const html=fs.readFileSync(file,'utf8');
  for(const m of html.matchAll(/<button\b[^>]*data-theme-toggle[^>]*>/gi)) assert(/aria-label\s*=|aria-labelledby\s*=/i.test(m[0]),`${path.basename(file)}: theme button missing accessible name`);
  for(const m of html.matchAll(/<textarea\b[^>]*>/gi)) assert(/aria-label\s*=|aria-labelledby\s*=|placeholder\s*=/i.test(m[0]),`${path.basename(file)}: textarea missing accessible label/hint`);
}
console.log('v5.52 baseline general audit contract PASS — curriculum completeness, unique assessments, mirrors/catalog, and static accessibility verified.');
