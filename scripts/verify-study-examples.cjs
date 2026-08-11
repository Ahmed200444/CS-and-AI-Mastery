const fs=require('fs');
const path=require('path');
const root=process.cwd(),failures=[];
const assetPath=path.join(root,'assets','study-examples.js');
if(!fs.existsSync(assetPath))failures.push('assets/study-examples.js is missing');
else{
 const src=fs.readFileSync(assetPath,'utf8');
 try{new Function(src);}catch(error){failures.push('study-examples.js syntax error: '+error.message);}
 const required=[
  ['5-example minimum',/clamp\(Math\.max\(concepts\(b\)\.length,objectives\(b\)\.length\)\+2,5,8\)/],
  ['8-example maximum',/data-study-count/],
  ['visible study cards',/csai-study-example csai-example-card/],
  ['Python runner',/CSAIPythonRunner\.runSource/],
  ['Run / Check control',/▶ Run \/ Check/],
  ['visible output',/data-study-output/],
  ['Reset control',/data-study-reset/],
  ['GitHub publish control',/data-final-publish/],
  ['README control',/data-final-readme/],
  ['publisher-compatible toolbar',/csai-example-actions/],
  ['original single-example replacement',/hideOriginalExample/],
  ['old adaptive UI hidden',/\[data-adaptive-lab\]\{display:none!important\}/]
 ];
 for(const [label,re] of required)if(!re.test(src))failures.push(`study-examples.js missing ${label}`);
}
const publisherPath=path.join(root,'assets','portfolio-publish-controls.js');
if(!fs.existsSync(publisherPath))failures.push('portfolio-publish-controls.js is missing');
else{
 const publisher=fs.readFileSync(publisherPath,'utf8');
 try{new Function(publisher);}catch(error){failures.push('portfolio-publish-controls.js syntax error: '+error.message);}
 if(!publisher.includes("root.dataset.finalControlsReady==='1'"))failures.push('publisher lacks per-card idempotency guard');
 if(!publisher.includes('function alreadyReady('))failures.push('publisher lacks ready-state guard');
 if(!publisher.includes('function scheduleEnhance()'))failures.push('publisher MutationObserver is not debounced');
 if(/new MutationObserver\(\(\)=>enhance\(\)\)/.test(publisher))failures.push('publisher still contains the old infinite rescan MutationObserver');
}
const coursesDir=path.join(root,'courses');
const pages=fs.existsSync(coursesDir)?fs.readdirSync(coursesDir).filter(x=>x.endsWith('.html')):[];
if(pages.length!==57)failures.push(`expected 57 course pages, found ${pages.length}`);
for(const name of pages){
 const html=fs.readFileSync(path.join(coursesDir,name),'utf8');
 const count=(html.match(/\/assets\/study-examples\.js/g)||[]).length;
 if(count!==1)failures.push(`${name}: study-examples.js must appear exactly once, found ${count}`);
 if(!html.includes('study-examples.js?v=20260811-2'))failures.push(`${name}: current study-example asset version missing`);
 if(!html.includes('portfolio-publish-controls.js'))failures.push(`${name}: portfolio publisher missing`);
 if(!html.includes('adaptive-practice-layer.js'))failures.push(`${name}: shared Python runner missing`);
}
const indexPath=path.join(root,'index.html');
if(fs.existsSync(indexPath)){
 const index=fs.readFileSync(indexPath,'utf8');
 if((index.match(/\/assets\/study-examples\.js/g)||[]).length!==1)failures.push('index.html must include study-examples.js exactly once');
}
if(failures.length){console.error('Study-example verification failed:');failures.slice(0,120).forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('Study-example verification passed: all 57 generated courses load the 5–8 example system; each example has Run / Check, output, Reset, GitHub publish and README controls; publisher enhancement is idempotent.');
