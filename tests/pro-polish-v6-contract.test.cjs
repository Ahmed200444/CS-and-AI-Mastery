// Pro polish v6 contract: the shared brand/interaction layer is present on the home page and every
// course page exactly once, and stays a read-only visual layer (it must never write learner progress).
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const css=read('assets/pro-polish-v6.css'),js=read('assets/pro-polish-v6.js');
const count=(s,re)=>(s.match(re)||[]).length;
const pages=['index.html'].concat(fs.readdirSync(path.join(root,'courses')).filter(f=>f.endsWith('.html')).map(f=>'courses/'+f));
assert(pages.length>=2,'expected the home page and course pages');
for(const p of pages){
  const h=read(p);
  assert.strictEqual(count(h,/<link\b[^>]*pro-polish-v6\.css/g),1,p+': pro-polish-v6.css must be linked exactly once');
  assert.strictEqual(count(h,/<script\b[^>]*pro-polish-v6\.js/g),1,p+': pro-polish-v6.js must be loaded exactly once');
  assert(h.indexOf('pro-polish-v6.css')>h.indexOf('hero-polish.css'),p+': pro polish must load after the earlier design layers');
}
assert(!/localStorage\s*\.\s*(setItem|removeItem|clear)|sessionStorage\s*\.\s*(setItem|removeItem|clear)/.test(js),'pro-polish-v6.js must not write browser storage');
assert(!/\beval\(|document\.write\(|innerHTML\s*=\s*[^'"]/.test(js),'pro-polish-v6.js must not inject dynamic HTML');
assert(/prefers-reduced-motion/.test(css)&&/prefers-reduced-motion/.test(js),'reduced-motion must be respected in CSS and JS');
assert(/@media \(max-width:1023px\)/.test(css)&&/@media \(max-width:600px\)/.test(css),'phone breakpoints must exist');
assert(/\.csai-cm\{min-width:0\}/.test(css),'course workspace must keep min-width:0');
assert(/k==='q'&&F\[k\]===x\.target\.value/.test(read('assets/catalog-recovery.js')),'catalog search must not re-render on blur (keeps the first click on a course)');
// Lesson videos v1: every course has curated videos, ids are well-formed, and the layer never writes storage.
const lv=read('assets/lesson-videos-v1.js');
const videos=JSON.parse(read('assets/course-videos.json'));
const courseIds=fs.readdirSync(path.join(root,'assets/course-data')).filter(f=>f.endsWith('.json')).map(f=>f.replace(/\.json$/,''));
for(const id of courseIds){
  assert(Array.isArray(videos[id])&&videos[id].length>=2,'course '+id+' needs at least two curated videos');
  for(const v of videos[id]){assert(/^[A-Za-z0-9_-]{11}$/.test(v[0]),id+': bad YouTube id '+v[0]);assert(typeof v[1]==='string'&&v[1].trim().length>3,id+': video needs a title')}
}
assert.strictEqual(Object.keys(videos).filter(k=>!courseIds.includes(k)).length,0,'course-videos.json lists a course that does not exist');
assert(lv.includes(JSON.stringify(videos)),'lesson-videos-v1.js must embed the same data as assets/course-videos.json');
assert(!/localStorage|sessionStorage|document\.cookie/.test(lv),'lesson-videos-v1.js must not touch browser storage');
assert(/youtube-nocookie\.com\/embed/.test(lv)&&/credentialless/.test(lv)&&/noopener noreferrer/.test(lv),'video embeds must use the privacy-enhanced player, credentialless frames and safe links');
for(const p of pages.filter(p=>p.startsWith('courses/'))){assert.strictEqual(count(read(p),/<script\b[^>]*lesson-videos-v1\.js/g),1,p+': lesson-videos-v1.js must be loaded exactly once')}
console.log('Pro polish v6 + lesson videos v1 contract: PASS across '+pages.length+' pages and '+courseIds.length+' courses.');
