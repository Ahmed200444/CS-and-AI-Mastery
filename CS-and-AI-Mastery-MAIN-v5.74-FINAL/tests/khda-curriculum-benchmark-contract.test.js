const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const audit=JSON.parse(fs.readFileSync(path.join(root,'KHDA_CURRICULUM_BENCHMARK.json'),'utf8'));
const courses=JSON.parse(fs.readFileSync(path.join(root,'assets','coursedata-source.json'),'utf8'));
const courseMap=new Map(courses.map(c=>[c.id,c]));
assert.equal(audit.version,'5.47');
assert.equal(audit.courses_total,62);
assert.equal(audit.rows.length,62,'every course needs a benchmark audit row');
assert.equal(new Set(audit.rows.map(r=>r.course_id)).size,62,'duplicate/missing course audit rows');
assert.equal(audit.lessons_total,800,'lesson count must remain intact');
assert.ok(audit.additions_count>=80,'benchmark should contain meaningful professional additions');
assert.ok(audit.notes.includes('does not claim'),'evidence-level caution must be explicit');
for(const row of audit.rows){
  assert.ok(courseMap.has(row.course_id),`unknown audited course ${row.course_id}`);
  assert.equal(row.status,'verified',`${row.course_id}: unverified audit row`);
  assert.ok(/Only skills with a plausible build\/debug\/test\/design\/deploy\/operate\/secure\/optimize\/analyze\/evaluate use/.test(row.company_use_gate),`${row.course_id}: company-use gate missing`);
  assert.ok(row.evidence&&row.evidence.length>30,`${row.course_id}: evidence note too weak`);
}
const byCourse=new Map();
for(const row of audit.rows)for(const ch of row.added||[]){
  const c=courseMap.get(row.course_id); const lesson=(c.lessons||[]).find(l=>l.id===ch.lesson);
  assert.ok(lesson,`${row.course_id}/${ch.lesson}: added lesson missing from master data`);
  const mirror=JSON.parse(fs.readFileSync(path.join(root,'assets','course-data',row.course_id+'.json'),'utf8'));
  const mirrorLesson=(mirror.lessons||[]).find(l=>l.id===ch.lesson);
  assert.ok(mirrorLesson,`${row.course_id}/${ch.lesson}: lesson missing from course-data mirror`);
  const html=fs.readFileSync(path.join(root,'courses',row.course_id+'.html'),'utf8');
  assert.ok(html.includes(`data-lesson="${ch.lesson}"`),`${row.course_id}/${ch.lesson}: lesson missing from static page`);
  for(const concept of ch.added_concepts||[]){
    assert.ok((lesson.concepts||[]).includes(concept),`${row.course_id}/${ch.lesson}: master missing ${concept}`);
    assert.ok((mirrorLesson.concepts||[]).includes(concept),`${row.course_id}/${ch.lesson}: mirror missing ${concept}`);
    const escaped=concept.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    assert.ok(html.includes(escaped)||html.includes(concept),`${row.course_id}/${ch.lesson}: static page missing ${concept}`);
    const key=row.course_id+'\0'+ch.lesson+'\0'+concept; byCourse.set(key,{course:row.course_id,title:lesson.title,concept});
  }
}
assert.equal(byCourse.size,audit.additions_count,'every declared addition must resolve exactly once');

const study=fs.readFileSync(path.join(root,'assets','study-examples.js'),'utf8');
assert.ok(study.includes('v5.47 KHDA-benchmarked company-use professional-readiness override'));
assert.ok(study.includes("cs.map(function(c){return{label:c,kind:'Concept example'};})"),'every key concept must still map to an example card');
let runnable=study.replace(/\}\)\(\);\s*$/,"globalThis.__khdaAudit={professionalScenario,professionalBehavior};})();");
const sandbox={document:{readyState:'loading',addEventListener(){},getElementById(){return null;}},location:{pathname:'/courses/dsa.html'},window:{},setTimeout(){},clearTimeout(){},MutationObserver:function(){this.observe=function(){}},console};
vm.createContext(sandbox); vm.runInContext(runnable,sandbox);
for(const {course,title,concept} of byCourse.values()){
  const spec=sandbox.__khdaAudit.professionalScenario(course,title,concept,0);
  assert.ok(spec&&String(spec.example||'').length>=90,`${course}/${concept}: example too weak`);
  assert.ok(String(spec.check||'').length>=60,`${course}/${concept}: success check too weak`);
  assert.ok(!String(spec.example).startsWith('In the “'),`${course}/${concept}: generic fallback reached`);
  assert.ok(String(spec.example).includes('Practice move:'),`${course}/${concept}: practice move missing`);
  assert.ok(sandbox.__khdaAudit.professionalBehavior(course,title,concept).length>=55,`${course}/${concept}: behavior explanation too weak`);
}
assert.ok(!courses.some(c=>/linear algebra|calculus|statistics/i.test(c.title)&&/math/i.test(c.category||'')),'do not add a standalone theory-only math course');
console.log(`KHDA curriculum benchmark PASS — 62 courses / 800 lessons audited; ${audit.additions_count} job-use concepts persisted in master, mirrors and static pages, each with a professional example contract.`);
