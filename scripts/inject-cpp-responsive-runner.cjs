const fs=require('fs');
const path=require('path');
const root=process.cwd();
const dir=path.join(root,'courses');
if(!fs.existsSync(dir))throw new Error('courses directory missing');
const files=fs.readdirSync(dir).filter(name=>name.endsWith('.html'));
if(files.length!==54)throw new Error(`Expected 54 course pages, found ${files.length}`);
const tag='<script src="/assets/cpp-runner-ui-worker.js?v=20260809-1"></script>';
let changed=0;
for(const name of files){
 const file=path.join(dir,name);let html=fs.readFileSync(file,'utf8');
 if(html.includes(tag))continue;
 if(!html.includes('</body>'))throw new Error(`${name}: missing </body>`);
 html=html.replace('</body>',tag+'\n</body>');
 fs.writeFileSync(file,html,'utf8');changed++;
}
console.log(`Injected responsive C++ runner controller into ${changed} course page(s); verified ${files.length}.`);
