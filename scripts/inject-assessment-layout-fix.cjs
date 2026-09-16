const fs=require('fs');
const path=require('path');
const dir=path.join(process.cwd(),'courses');
if(!fs.existsSync(dir))throw new Error('courses directory is missing');
let count=0;
for(const file of fs.readdirSync(dir).filter(name=>name.endsWith('.html'))){
  const p=path.join(dir,file);
  let html=fs.readFileSync(p,'utf8');
  html=html.replace(/<script[^>]*src=["']\/assets\/assessment-layout-fix\.js[^"']*["'][^>]*><\/script>\s*/gi,'');
  const tag='<script defer src="../assets/assessment-layout-fix.js?v=20260822-v567"></script>\n';
  const at=html.toLowerCase().lastIndexOf('</body>');
  html=at>=0?html.slice(0,at)+tag+html.slice(at):html+'\n'+tag;
  fs.writeFileSync(p,html,'utf8');
  count++;
}
if(count!==62)throw new Error(`Expected 62 static course pages, updated ${count}`);
console.log(`Applied full-width assessment layout to ${count} course pages.`);
