const fs=require('fs');
const path=require('path');
const root=process.cwd();
const dir=path.join(root,'courses');
if(!fs.existsSync(dir))throw new Error('courses directory missing');
const files=fs.readdirSync(dir).filter(name=>name.endsWith('.html'));
if(files.length!==54)throw new Error(`Expected 54 course pages, found ${files.length}`);
const staleTags=[
 '<script src="/assets/cpp-runner-ui-worker.js?v=20260809-1"></script>',
 '<script src="/assets/cpp-runner-ui-worker.js?v=20260809-2"></script>',
 '<script src="/assets/cpp-runner-ui-worker.js?v=20260809-3"></script>'
];
const tag='<script src="/assets/cpp-runner-ui-worker.js?v=20260809-4"></script>';
let changed=0;
for(const name of files){
 const file=path.join(dir,name);let html=fs.readFileSync(file,'utf8');
 let replaced=false;
 for(const stale of staleTags){if(html.includes(stale)){html=html.replace(stale,tag);replaced=true;}}
 if(replaced)changed++;
 else if(!html.includes(tag)){
  if(!html.includes('</body>'))throw new Error(`${name}: missing </body>`);
  html=html.replace('</body>',tag+'\n</body>');changed++;
 }
 fs.writeFileSync(file,html,'utf8');
}
for(const name of files){
 const html=fs.readFileSync(path.join(dir,name),'utf8');
 if(!html.includes(tag))throw new Error(`${name}: direct C++ runner controller missing`);
 for(const stale of staleTags)if(html.includes(stale))throw new Error(`${name}: stale C++ runner controller cache version remains`);
}
console.log(`Injected native clang++ C++ controller into ${changed} course page(s); verified ${files.length}.`);
