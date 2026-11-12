const fs=require('fs');
const path=require('path');
// v5.90 -- loads the course projects layer (overview cards + Practice links in "Course contents") on every course page.
const dir=path.join(process.cwd(),'courses');
if(!fs.existsSync(dir))throw new Error('courses directory is missing');
if(!fs.existsSync(path.join(process.cwd(),'assets','course-projects-v1.js')))throw new Error('assets/course-projects-v1.js is missing');
const tag='<script defer src="../assets/course-projects-v1.js?v=20260822-v567"></script>';
let count=0;
for(const file of fs.readdirSync(dir).filter(x=>x.endsWith('.html'))){
  const full=path.join(dir,file);
  let html=fs.readFileSync(full,'utf8');
  html=html.replace(/<script[^>]*src=["'](?:\.\.)?\/assets\/course-projects-v1\.js[^"']*["'][^>]*><\/script>\s*/gi,'');
  const at=html.toLowerCase().lastIndexOf('</body>');
  html=at>=0?html.slice(0,at)+tag+'\n'+html.slice(at):html+'\n'+tag+'\n';
  fs.writeFileSync(full,html,'utf8');
  count++;
}
if(count!==63)throw new Error(`Expected 63 course pages, updated ${count}`);
console.log(`Injected the course projects layer into ${count} course pages.`);
