// Course projects v1 contract: every course page loads the projects layer exactly once, after the layers it depends on,
// and the layer stays read-only (it must never write learner progress or inject dynamic HTML).
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const js=read('assets/course-projects-v1.js'),css=read('assets/pro-polish-v6.css');
const count=(s,re)=>(s.match(re)||[]).length;
const pages=fs.readdirSync(path.join(root,'courses')).filter(f=>f.endsWith('.html'));
assert.strictEqual(pages.length,63,'expected 63 course pages');
for(const f of pages){
  const h=read('courses/'+f);
  assert.strictEqual(count(h,/<script\b[^>]*course-projects-v1\.js/g),1,f+': course-projects-v1.js must be loaded exactly once');
  for(const dep of ['course-sidebar.js','scroll-performance-v561.js','course-project-workspace.js']){
    assert(h.indexOf(dep)>-1&&h.indexOf(dep)<h.indexOf('course-projects-v1.js'),f+': projects layer must load after '+dep);
  }
  assert(/id="course-page-meta"/.test(h),f+': course-page-meta is required by the projects layer');
}
assert(!/localStorage\s*\.\s*(setItem|removeItem|clear)|sessionStorage/.test(js),'course-projects-v1.js must not write browser storage');
assert(!/\beval\(|document\.write\(|innerHTML|insertAdjacentHTML|outerHTML/.test(js),'course-projects-v1.js must build DOM with textContent only');
assert(/csai-project-draft-v1:/.test(js)&&/csai_activity_v1/.test(js),'status must come from the existing draft and activity keys');
assert(/\.cp1-row/.test(css)&&/\.cp1-nav/.test(css),'projects styles must ship in pro-polish-v6.css');
assert(read('netlify.toml').includes('scripts/inject-course-projects.cjs'),'Netlify build must inject the projects layer');
assert(JSON.parse(read('package.json')).scripts.test.includes('tests/course-projects-v1-contract.test.cjs'),'npm test must run this contract');
console.log('Course projects v1 contract: PASS across '+pages.length+' course pages.');
