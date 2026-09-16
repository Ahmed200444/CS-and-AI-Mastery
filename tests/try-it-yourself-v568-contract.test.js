const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const asset=fs.readFileSync(path.join(root,'assets','try-it-yourself-v568.js'),'utf8');
assert(asset.includes("var VERSION='5.68'"),'v5.68 practice layer version missing');
assert(asset.includes('Try it yourself'),'practice label missing');
assert(asset.includes('Write your own version from scratch'),'blank-practice instruction missing');
assert(asset.includes('data-csai-try-editor'),'practice editor missing');
assert(asset.includes('data-csai-try-run'),'practice run control missing');
assert(asset.includes("waitFor('CSAIPythonRunner'"),'shared Python runner missing');
assert(asset.includes("waitFor('CSAIJSRunner'"),'shared JavaScript runner missing');
assert(asset.includes("waitFor('CSAISQLRunner'"),'shared SQL runner missing');
assert(asset.includes("waitFor('CSAICppRunner'"),'shared C++ runner missing');
assert(asset.includes("document.querySelectorAll('.lesson[open]')"),'closed lessons must not be eagerly expanded/scanned for practice UI');
assert(asset.includes("if(p.open)materialize"),'practice editor must be lazy-created on open');
assert(!/editor\.value\s*=\s*textOf\(node\)/.test(asset),'practice editor must start blank, not copy the worked solution');
const courses=fs.readdirSync(path.join(root,'courses')).filter(f=>f.endsWith('.html'));
assert(courses.length>=60,'expected full course catalog');
for(const f of courses){
  const h=fs.readFileSync(path.join(root,'courses',f),'utf8');
  assert(h.includes('../assets/try-it-yourself-v568.js?v=20260822-v568'),`${f}: missing v5.68 Try it yourself layer`);
}
for(const f of ['index.html','bytedance-2027-prep.html','github-setup.html']){
  const h=fs.readFileSync(path.join(root,f),'utf8');
  assert(h.includes('assets/try-it-yourself-v568.js?v=20260822-v568'),`${f}: missing v5.68 Try it yourself layer`);
}
console.log(`Try-it-yourself v5.68 contract: PASS across ${courses.length} course pages.`);
