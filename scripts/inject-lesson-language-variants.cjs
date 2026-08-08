const fs=require('fs');
const path=require('path');
const dir=path.join(process.cwd(),'courses');
if(!fs.existsSync(dir))throw new Error('courses directory missing');
const files=fs.readdirSync(dir).filter(x=>x.endsWith('.html'));
if(files.length!==54)throw new Error(`Expected 54 course pages, found ${files.length}`);
const tag='<script src="/assets/lesson-language-variants.js?v=20260809-1"></script>';
for(const name of files){const file=path.join(dir,name);let html=fs.readFileSync(file,'utf8');html=html.replace(/\s*<script[^>]*src=["']\/assets\/lesson-language-variants\.js[^"']*["'][^>]*><\/script>/gi,'');if(!/<\/body>/i.test(html))throw new Error(`Missing </body> in ${name}`);html=html.replace(/<\/body>/i,tag+'\n</body>');fs.writeFileSync(file,html,'utf8');}
console.log(`Injected complete Python/C++ lesson variants into ${files.length} course pages.`);
