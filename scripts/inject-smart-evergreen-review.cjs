const fs=require('fs');
const path=require('path');
const dir=path.join(process.cwd(),'courses');
if(!fs.existsSync(dir))throw new Error('courses directory is missing');
const tag='<script src="/assets/smart-evergreen-review.js?v=20260808-1"></script>';
let count=0;
for(const file of fs.readdirSync(dir).filter(x=>x.endsWith('.html'))){
  const full=path.join(dir,file);
  let html=fs.readFileSync(full,'utf8');
  html=html.replace(/<script[^>]*src=["']\/assets\/smart-evergreen-review\.js[^"']*["'][^>]*><\/script>\s*/gi,'');
  const at=html.toLowerCase().lastIndexOf('</body>');
  html=at>=0?html.slice(0,at)+tag+'\n'+html.slice(at):html+'\n'+tag+'\n';
  fs.writeFileSync(full,html,'utf8');
  count++;
}
if(count!==54)throw new Error(`Expected 54 course pages, updated ${count}`);
console.log(`Injected adaptive Evergreen review scoring into ${count} course pages.`);
