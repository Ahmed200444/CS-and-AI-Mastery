const fs=require('fs');
const path=require('path');

const dir=path.join(process.cwd(),'courses');
if(!fs.existsSync(dir))throw new Error('courses directory is missing');

const tag='<script src="/assets/reveal-solution-explanations.js?v=20260807-1"></script>';
let count=0;

for(const file of fs.readdirSync(dir).filter(name=>name.endsWith('.html'))){
  const full=path.join(dir,file);
  let html=fs.readFileSync(full,'utf8');
  html=html.replace(/<script[^>]*src=["']\/assets\/reveal-solution-explanations\.js[^"']*["'][^>]*><\/script>\s*/gi,'');
  const body=html.toLowerCase().lastIndexOf('</body>');
  html=body>=0?html.slice(0,body)+tag+'\n'+html.slice(body):html+'\n'+tag+'\n';
  fs.writeFileSync(full,html,'utf8');
  count++;
}

if(count!==54)throw new Error(`Expected 54 course pages, updated ${count}`);
console.log(`Added reveal-solution explanations to ${count} course pages.`);
