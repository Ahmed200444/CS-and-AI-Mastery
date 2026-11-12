const fs=require('fs');
const path=require('path');
const dir=path.join(process.cwd(),'courses');
if(!fs.existsSync(dir))throw new Error('courses directory is missing');
const tag='<script defer src="../assets/evergreen-review-navigation.js?v=20260822-v567"></script>';
let count=0;
for(const file of fs.readdirSync(dir).filter(x=>x.endsWith('.html'))){
  const full=path.join(dir,file);
  let html=fs.readFileSync(full,'utf8');
  html=html.replace(/<script[^>]*src=["']\/assets\/evergreen-review-navigation\.js[^"']*["'][^>]*><\/script>\s*/gi,'');
  const at=html.toLowerCase().lastIndexOf('</body>');
  html=at>=0?html.slice(0,at)+tag+'\n'+html.slice(at):html+'\n'+tag+'\n';
  fs.writeFileSync(full,html,'utf8');
  count++;
}
if(count!==62)throw new Error(`Expected 62 course pages, updated ${count}`);
console.log(`Injected interactive Evergreen review navigation into ${count} course pages.`);
