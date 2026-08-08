const fs=require('fs');
const path=require('path');

const root=process.cwd();
const indexPath=path.join(root,'index.html');
const coursesDir=path.join(root,'courses');
const tag='<script src="/assets/primary-language-mode.js?v=20260808-2"></script>';

function inject(file){
  let html=fs.readFileSync(file,'utf8');
  html=html.replace(/\s*<script\s+src=["']\/assets\/primary-language-mode\.js[^>]*><\/script>/gi,'');
  if(!/<\/body>/i.test(html))throw new Error(`Missing </body> in ${file}`);
  html=html.replace(/<\/body>/i,`${tag}\n</body>`);
  fs.writeFileSync(file,html,'utf8');
  if(!html.includes('/assets/primary-language-mode.js?v=20260808-2'))throw new Error(`Language UX injection failed for ${file}`);
}

if(!fs.existsSync(indexPath))throw new Error('index.html missing');
inject(indexPath); // silent navigation guard only; no homepage language selector is rendered.

if(!fs.existsSync(coursesDir))throw new Error('courses directory missing after static course generation');
const files=fs.readdirSync(coursesDir).filter(x=>x.endsWith('.html'));
if(files.length!==54)throw new Error(`Expected 54 course pages, found ${files.length}`);
files.forEach(name=>inject(path.join(coursesDir,name)));
console.log(`Injected course language UX runtime into homepage navigation and ${files.length} course pages.`);
