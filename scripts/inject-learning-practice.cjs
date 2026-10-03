'use strict';
const fs=require('fs'),path=require('path');
for(const file of ['index.html',...fs.readdirSync('courses').filter(n=>n.endsWith('.html')).map(n=>path.join('courses',n))]){
 const name=path.basename(file);let html=fs.readFileSync(file,'utf8');
 html=html.replace(/\s*<script\b[^>]*src=["'][^"']*assets\/(?:arm-trace-engine|arm-trace-ui|lesson-recall)\.js[^"']*["'][^>]*><\/script>/gi,'');
 html=html.replace(/(assets\/(?:line-by-line-explanations|assessment-practice|lesson-example-runner|study-examples|universal-editable-code|adaptive-practice-layer|program-questions-v574|adaptive-v4-live|product-redesign-v2|universal-run-output|conceptual-examples-v574|practice-publish-completer|final-exercise-toolbar|portfolio-publish-controls|runtime-inline\/index-064)\.js\?v=[^"'&]+)(?:&learning=[^"']+)?/g,'$1&learning=20261003-v583');
 if(file==='index.html'){fs.writeFileSync(file,html);continue;}
 const tags=(name==='arm-assembly.html'?'<script defer src="../assets/arm-trace-engine.js?v=20261003-v578"></script>\n<script defer src="../assets/arm-trace-ui.js?v=20261003-v578"></script>\n':'')+'<script defer src="../assets/lesson-recall.js?v=20261003-v578"></script>\n';
 html=html.replace('</body>',tags+'</body>');fs.writeFileSync(file,html);
}
console.log('Saved lesson recall enabled on every course; ARM teaching trace enabled on ARM Assembly.');
