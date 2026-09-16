const fs=require('fs'), path=require('path');
const root=process.cwd();
function need(x,msg){if(!x) throw new Error(msg)}
const asset=fs.readFileSync(path.join(root,'assets/progress-resume.js'),'utf8');
for(const token of [
  'renderCourseContinue',
  'courseProgressState',
  'data-csai-course-continue',
  'Start course',
  "p.started?'Continue':'Start'",
  'Course complete',
  'jumpToLesson',
  'scrollIntoView',
  'history.replaceState'
]) need(asset.includes(token),`course Continue UI missing behavior: ${token}`);
const pages=fs.readdirSync(path.join(root,'courses')).filter(f=>f.endsWith('.html'));
need(pages.length===62,`expected 62 generated course pages, got ${pages.length}`);
for(const f of pages){
  const html=fs.readFileSync(path.join(root,'courses',f),'utf8');
  need(html.includes('class="hero"'),`${f}: course hero missing`);
  need(html.includes('data-lesson="'),`${f}: no lesson rows`);
  need(html.includes('../assets/progress-resume.js?v=20260822-v567'),`${f}: course Continue script missing`);
}
const catalog=JSON.parse(fs.readFileSync(path.join(root,'assets/catalog-data.json'),'utf8'));
const visible=(catalog.courses||catalog).filter(c=>!c.hidden);
need(visible.length===61,`expected 61 visible courses, got ${visible.length}`);
for(const c of visible){
  const file=path.join(root,'courses',`${c.id}.html`);
  need(fs.existsSync(file),`visible course ${c.id} has no page`);
}
console.log(`Course Continue UI contract passed for all ${visible.length} visible courses (${pages.length} generated pages).`);
