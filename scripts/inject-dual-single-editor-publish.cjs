const fs=require('fs');
const path=require('path');
const root=process.cwd();
const dir=path.join(root,'courses');
const tag='<script src="/assets/dual-single-editor-publish.js?v=20260808-1"></script>';
if(!fs.existsSync(dir))throw new Error('courses directory missing');
const files=fs.readdirSync(dir).filter(x=>x.endsWith('.html'));
if(files.length!==54)throw new Error(`Expected 54 course pages, found ${files.length}`);
for(const name of files){const file=path.join(dir,name);let html=fs.readFileSync(file,'utf8');html=html.replace(/\s*<script\s+src=["']\/assets\/dual-single-editor-publish\.js[^>]*><\/script>/gi,'');if(!/<\/body>/i.test(html))throw new Error(`Missing </body> in ${name}`);html=html.replace(/<\/body>/i,tag+'\n</body>');fs.writeFileSync(file,html,'utf8');}
console.log(`Injected Dual single-editor publishing into ${files.length} course pages.`);
