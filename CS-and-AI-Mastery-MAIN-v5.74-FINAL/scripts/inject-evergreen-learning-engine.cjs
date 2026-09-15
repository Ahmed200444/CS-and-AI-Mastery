const fs=require('fs');
const path=require('path');

const dir=path.join(process.cwd(),'courses');
if(!fs.existsSync(dir))throw new Error('courses directory is missing');

const tag='<script src="/assets/evergreen-learning-engine.js?v=20260808-1"></script>';
let pages=0;
for(const file of fs.readdirSync(dir).filter(name=>name.endsWith('.html'))){
  const full=path.join(dir,file);
  let html=fs.readFileSync(full,'utf8');
  html=html.replace(/<script[^>]*src=["']\/assets\/evergreen-learning-engine\.js[^"']*["'][^>]*><\/script>\s*/gi,'');
  const at=html.toLowerCase().lastIndexOf('</body>');
  html=at>=0?html.slice(0,at)+tag+'\n'+html.slice(at):html+'\n'+tag+'\n';
  if(!html.includes('/assets/evergreen-learning-engine.js'))throw new Error(`Evergreen engine injection failed for ${file}`);
  fs.writeFileSync(full,html,'utf8');
  pages++;
}
if(pages!==54)throw new Error(`Expected 54 course pages, enhanced ${pages}`);
console.log(`Evergreen Mastery Lab enabled on ${pages} course pages.`);
