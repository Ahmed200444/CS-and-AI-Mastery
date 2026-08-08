const fs=require('fs');
const path=require('path');
const dir=path.join(process.cwd(),'courses');
if(!fs.existsSync(dir))throw new Error('courses directory missing before language controller injection');
const files=fs.readdirSync(dir).filter(x=>x.endsWith('.html'));
if(files.length!==54)throw new Error(`Expected 54 course pages, found ${files.length}`);
const tag='<script src="/assets/course-language-mode-controller.js?v=20260808-1"></script>';
for(const name of files){
 const file=path.join(dir,name);let html=fs.readFileSync(file,'utf8');
 html=html.replace(/\s*<script\s+src=["']\/assets\/course-language-mode-controller\.js[^>]*><\/script>/gi,'');
 if(!/<\/body>/i.test(html))throw new Error(`Malformed course page: ${name}`);
 html=html.replace(/<\/body>/i,`${tag}\n</body>`);
 fs.writeFileSync(file,html,'utf8');
 if(!html.includes('/assets/course-language-mode-controller.js?v=20260808-1'))throw new Error(`Language controller injection failed: ${name}`);
}
console.log(`Injected reliable language controller into ${files.length} course pages.`);
