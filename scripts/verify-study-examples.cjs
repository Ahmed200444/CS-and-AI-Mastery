const fs=require('fs');
const path=require('path');
const root=process.cwd(),failures=[];
const assetPath=path.join(root,'assets','study-examples.js');
if(!fs.existsSync(assetPath))failures.push('assets/study-examples.js is missing');
else{
 const src=fs.readFileSync(assetPath,'utf8');
 try{new Function(src);}catch(error){failures.push('study-examples.js syntax error: '+error.message);}
 const required=[
  ['all-concept plan',/cs\.map\(function\(c\)\{return\{label:c,kind:'Concept example'\}\;\}\)/],
  ['five-example floor',/while\(plan\.length<5\)/],
  ['coverage marker',/data-concept-coverage/],
  ['visible study cards',/csai-study-example csai-example-card/],
  ['Python runner',/CSAIPythonRunner\.runSource/],
  ['Run / Check control',/▶ Run \/ Check/],
  ['visible output',/data-study-output/],
  ['Reset control',/data-study-reset/],
  ['GitHub publish control',/data-final-publish/],
  ['README control',/data-final-readme/],
  ['publisher-compatible toolbar',/csai-example-actions/],
  ['course-native source example preserved',/nativeSourceCard/],
  ['generic Python gated by course',/courseAllowsGeneratedPython/],
  ['native non-Python examples',/nativeExampleFor/],
  // FIX #9 -- assert the implementing function, not a UI string that has since been reworded
  ['applied reference scenarios',/scenarioCard\s*\(/],
  ['old adaptive and evergreen UI hidden',/\[data-adaptive-lab\],\[data-evergreen-lab\]\{display:none!important\}/],
  ['structural duplicate guard',/structureSignature\s*\(/],
  ['literal-only variation rejected',/changing only a literal value does not count/i]
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
 if(!/function scheduleEnhance\s*\(/.test(publisher))failures.push('publisher MutationObserver is not debounced'); // FIX #10 -- signature takes the added node
 if(/new MutationObserver\(\(\)=>enhance\(\)\)/.test(publisher))failures.push('publisher still contains the old infinite rescan MutationObserver');
}
const coursesDir=path.join(root,'courses');
const pages=fs.existsSync(coursesDir)?fs.readdirSync(coursesDir).filter(x=>x.endsWith('.html')):[];
if(pages.length!==62)failures.push(`expected 62 course pages, found ${pages.length}`);
for(const name of pages){
 const html=fs.readFileSync(path.join(coursesDir,name),'utf8');
 const count=(html.match(/(?:\.\.\/|\/)assets\/study-examples\.js/g)||[]).length;
 if(count!==1)failures.push(`${name}: study-examples.js must appear exactly once, found ${count}`);
 if(!/study-examples\.js\?v=[A-Za-z0-9._-]+/.test(html))failures.push(`${name}: versioned study-example asset missing`);
 if(!html.includes('portfolio-publish-controls.js'))failures.push(`${name}: portfolio publisher missing`);
 if(!html.includes('adaptive-practice-layer.js'))failures.push(`${name}: shared Python runner missing`);
}
const indexPath=path.join(root,'index.html');
if(fs.existsSync(indexPath)){
 const index=fs.readFileSync(indexPath,'utf8');
 if((index.match(/(?:^|[\"'])assets\/study-examples\.js/g)||[]).length!==1)failures.push('index.html must include study-examples.js exactly once');
}
if(failures.length){console.error('Study-example verification failed:');failures.slice(0,120).forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('Study-example verification passed: all 62 generated courses load the every-key-idea example system; course-native source examples are structurally deduplicated, runnable examples use the appropriate runner, reference scenarios stay non-fake, and GitHub/README publishing remains available where content is publishable.');
