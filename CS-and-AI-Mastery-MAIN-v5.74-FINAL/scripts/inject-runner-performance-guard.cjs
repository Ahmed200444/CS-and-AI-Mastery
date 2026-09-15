const fs=require('fs');
const path=require('path');
const root=process.cwd(),dir=path.join(root,'courses');
if(!fs.existsSync(dir))throw new Error('courses directory missing');
function lastClosingBody(source){return source.toLowerCase().lastIndexOf('</body>');}
let changed=0;
for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.html'))){
 const p=path.join(dir,file);let html=fs.readFileSync(p,'utf8');
 if(html.includes('/assets/runner-performance-guard.js'))continue;
 const tag='<script src="/assets/runner-performance-guard.js?v=20260811-1" defer></script>';
 const i=lastClosingBody(html);
 if(i>=0)html=html.slice(0,i)+tag+'\n'+html.slice(i);
 else html+='\n'+tag+'\n';
 fs.writeFileSync(p,html);changed++;
}
console.log(`Runner performance guard injected into ${changed} course pages at final body boundaries.`);
