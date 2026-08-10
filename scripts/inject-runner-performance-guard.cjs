const fs=require('fs');
const path=require('path');
const root=process.cwd(),dir=path.join(root,'courses');
if(!fs.existsSync(dir))throw new Error('courses directory missing');
let changed=0;
for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.html'))){
 const p=path.join(dir,file);let html=fs.readFileSync(p,'utf8');
 if(html.includes('/assets/runner-performance-guard.js'))continue;
 const tag='<script src="/assets/runner-performance-guard.js?v=20260811-1" defer></script>';
 if(/<\/body>/i.test(html))html=html.replace(/<\/body>/i,tag+'\n</body>');
 else html+='\n'+tag+'\n';
 fs.writeFileSync(p,html);changed++;
}
console.log(`Runner performance guard injected into ${changed} course pages.`);
