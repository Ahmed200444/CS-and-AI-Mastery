const fs=require('fs');
const path=require('path');
const root=process.cwd(),failures=[];
const assetPath=path.join(root,'assets','study-examples.js');
if(!fs.existsSync(assetPath))failures.push('assets/study-examples.js is missing');
else{
 const src=fs.readFileSync(assetPath,'utf8');
 const required=[
  ['5-example minimum',/clamp\(Math\.max\(concepts\(b\)\.length,objectives\(b\)\.length\)\+2,5,8\)/],
  ['8-example maximum',/data-study-count/],
  ['visible study cards',/csai-study-example csai-example-card/],
  ['Python runner',/CSAIPythonRunner\.runSource/],
  ['Run / Check control',/▶ Run \/ Check/],
  ['GitHub publish control',/data-final-publish/],
  ['README control',/data-final-readme/],
  ['publisher-compatible toolbar',/csai-example-actions/],
  ['original single-example replacement',/hideOriginalExample/],
  ['old adaptive UI hidden',/\[data-adaptive-lab\]\{display:none!important\}/]
 ];
 for(const [label,re] of required)if(!re.test(src))failures.push(`study-examples.js missing ${label}`);
}
const coursesDir=path.join(root,'courses');
const pages=fs.existsSync(coursesDir)?fs.readdirSync(coursesDir).filter(x=>x.endsWith('.html')):[];
if(pages.length!==57)failures.push(`expected 57 course pages, found ${pages.length}`);
for(const name of pages){
 const html=fs.readFileSync(path.join(coursesDir,name),'utf8');
 const count=(html.match(/\/assets\/study-examples\.js/g)||[]).length;
 if(count!==1)failures.push(`${name}: study-examples.js must appear exactly once, found ${count}`);
 if(!html.includes('portfolio-publish-controls.js'))failures.push(`${name}: portfolio publisher missing`);
 if(!html.includes('adaptive-practice-layer.js'))failures.push(`${name}: shared Python runner missing`);
}
const indexPath=path.join(root,'index.html');
if(fs.existsSync(indexPath)){
 const index=fs.readFileSync(indexPath,'utf8');
 if((index.match(/\/assets\/study-examples\.js/g)||[]).length!==1)failures.push('index.html must include study-examples.js exactly once');
}
if(failures.length){console.error('Study-example verification failed:');failures.slice(0,120).forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('Study-example verification passed: every generated course receives 5–8 visible runnable Python examples with GitHub publish + README controls.');
