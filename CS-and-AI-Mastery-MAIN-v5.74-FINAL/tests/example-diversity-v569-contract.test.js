'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const asset=read('assets/study-examples.js');
assert(asset.includes("EXAMPLE_DIVERSITY_VERSION='5.72'"),'v5.71 diversity marker missing');
assert(/function diversityMode\(seed\)[\s\S]*?%8/.test(asset),'diversity rotation must use at least eight modes');
assert(asset.includes('data-diverse-use="true"'),'generated concept cards must mark diverse-use rendering');
assert(asset.includes('Why use it here'),'code cards must explain why that use was chosen');
assert(asset.includes('Where you would use it'),'concept-only cards must identify a practical use');
assert(asset.includes('Why this example is useful'),'course-native examples must state the distinct practical purpose');
const requiredBanks=['banks.tuple=[','banks.set=[','banks.dict=[','banks.cond=[','banks.loop=[','banks.function=[','banks.generator=[','banks.comprehension=[','banks.stack=[','banks.queue=[','banks.linked=[','banks.binary=[','banks.recursion=['];
for(const token of requiredBanks) assert(asset.includes(token),`missing diverse bank: ${token}`);
// Each named bank must contain at least 8 top-level examples before the next bank declaration.
for(let i=0;i<requiredBanks.length;i++){
  const start=asset.indexOf(requiredBanks[i]);
  const nextPositions=requiredBanks.slice(i+1).map(t=>asset.indexOf(t,start+1)).filter(n=>n>start);
  const end=nextPositions.length?Math.min(...nextPositions):asset.indexOf("if(/generator|yield|iterator|lazy/",start);
  const block=asset.slice(start,end>start?end:start+12000);
  const entries=(block.match(/^\s{2}'/gm)||[]).length;
  assert(entries>=8,`${requiredBanks[i]} should provide at least 8 different examples, found ${entries}`);
}
for(const token of ['SELECT country, COUNT(*)','ROW_NUMBER() OVER','LEFT JOIN','AVG(salary) OVER','addEventListener','focus-visible','git stash','grep -i "error"','netstat -ano']){
  assert(asset.includes(token),`missing cross-course diversity case: ${token}`);
}
const courses=fs.readdirSync(path.join(root,'courses')).filter(f=>f.endsWith('.html'));
assert.equal(courses.length,62,'expected 62 course pages');
let lessons=0;
for(const f of courses){
  const h=read('courses/'+f);
  assert(h.includes('../assets/study-examples.js?v=20260824-v574'),`${f}: v5.71 diverse study-example asset not loaded`);
  lessons+=(h.match(/data-lesson="[^"]+"/g)||[]).length;
}
assert.equal(lessons,800,'expected 800 lessons');
assert(read('index.html').includes('assets/study-examples.js?v=20260824-v574'),'homepage must load v5.71 diverse study-example asset');
assert.equal(JSON.parse(read('package.json')).version,'5.74.0','package version must be 5.69.0');
assert(read('local-server.js').includes("RELEASE='5.74'"),'server release must be 5.69');
assert(read('desktop-launcher.js').includes("RELEASE = '5.74'"),'desktop launcher release must be 5.69');
console.log(`Example diversity v5.71 contract: PASS across ${courses.length} courses / ${lessons} lessons.`);
