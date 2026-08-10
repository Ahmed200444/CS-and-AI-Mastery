const fs=require('fs');
const path=require('path');
const root=process.cwd();
function read(p){return fs.readFileSync(path.join(root,p),'utf8');}
function count(s,re){return (s.match(re)||[]).length;}
const required=['assets/unified-learning-ui.css','assets/path-experience.js','scripts/inject-unified-learning-ui.cjs'];
for(const p of required)if(!fs.existsSync(path.join(root,p)))throw new Error(`Missing ${p}`);
const index=read('index.html');
if(count(index,/data-csai-unified-ui/g)!==1)throw new Error('index.html must contain exactly one unified UI stylesheet tag');
if(count(index,/data-csai-path-experience/g)!==1)throw new Error('index.html must contain exactly one path experience script tag');
for(const id of ['aiPathTrack','cePathTrack','fsPathTrack'])if(!index.includes(`id="${id}"`))throw new Error(`Primary path container missing: ${id}`);
const dir=path.join(root,'courses');if(!fs.existsSync(dir))throw new Error('courses directory missing');
const pages=fs.readdirSync(dir).filter(f=>f.endsWith('.html'));
if(pages.length!==54)throw new Error(`Expected 54 course pages, found ${pages.length}`);
for(const file of pages){const html=fs.readFileSync(path.join(dir,file),'utf8');if(count(html,/data-csai-unified-ui/g)!==1)throw new Error(`${file}: unified UI stylesheet tag missing or duplicated`);if(/data-csai-path-experience/.test(html))throw new Error(`${file}: path runtime must not be injected into a course page`);}
const js=read('assets/path-experience.js');
for(const id of ['aiPathTrack','cePathTrack','fsPathTrack'])if(!js.includes(id))throw new Error(`Path runtime does not cover ${id}`);
if(!/Missing course reference/i.test(js))throw new Error('Path runtime must include missing-reference repair logic');
console.log(`Unified learning UI verified: 3 primary paths + ${pages.length} course pages.`);
