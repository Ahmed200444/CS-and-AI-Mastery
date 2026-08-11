const fs=require('fs');
const path=require('path');
const root=process.cwd(),dir=path.join(root,'courses');
if(!fs.existsSync(dir))throw new Error('courses directory missing');
const headTags='<link rel="stylesheet" href="/assets/oa-assessment-fallback.css?v=20260811-1">\n<link rel="stylesheet" href="/assets/oa-assessment-upgrade.css?v=20260811-1">';
const bodyTags='<script src="/assets/oa-assessment-fallback.js?v=20260811-1" defer></script>\n<script src="/assets/oa-assessment-upgrade.js?v=20260811-1" defer></script>';
function strip(html){return html.replace(/<link[^>]*href=["']\/assets\/oa-assessment-(?:fallback|upgrade)\.css[^"']*["'][^>]*>\s*/gi,'').replace(/<script[^>]*src=["']\/assets\/oa-assessment-(?:fallback|upgrade)\.js[^"']*["'][^>]*><\/script>\s*/gi,'')}
let count=0;
for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.html'))){
 const p=path.join(dir,file);let html=strip(fs.readFileSync(p,'utf8')),h=html.toLowerCase().lastIndexOf('</head>'),b=html.toLowerCase().lastIndexOf('</body>');
 html=h>=0?html.slice(0,h)+headTags+'\n'+html.slice(h):headTags+'\n'+html;
 b=html.toLowerCase().lastIndexOf('</body>');html=b>=0?html.slice(0,b)+bodyTags+'\n'+html.slice(b):html+'\n'+bodyTags+'\n';fs.writeFileSync(p,html,'utf8');count++;
}
if(count!==57)throw new Error(`Expected 57 course pages, injected ${count}`);
console.log(`OA assessment experience injected into ${count} course pages. Lesson DOM/content was not modified.`);
