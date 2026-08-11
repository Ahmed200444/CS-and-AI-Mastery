const fs=require('fs');
const path=require('path');
const root=process.cwd(),dir=path.join(root,'courses');
if(!fs.existsSync(dir))throw new Error('courses directory missing');
function lastClosingBody(source){return source.toLowerCase().lastIndexOf('</body>');}
let changed=0;
for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.html'))){
 const p=path.join(dir,file);let html=fs.readFileSync(p,'utf8');
 html=html.replace(/\s*<script\b[^>]*src=["'][^"']*\/assets\/runner-performance-guard\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n');
 const tag='<script src="/assets/runner-performance-guard.js?v=20260811-2" defer></script>';
 const i=lastClosingBody(html);
 if(i>=0)html=html.slice(0,i)+tag+'\n'+html.slice(i);
 else html+='\n'+tag+'\n';
 fs.writeFileSync(p,html);changed++;
}
if(changed!==57)throw new Error(`Expected 57 course pages, updated ${changed}`);
console.log(`Intent-based runner performance guard injected into ${changed} course pages at final body boundaries.`);
