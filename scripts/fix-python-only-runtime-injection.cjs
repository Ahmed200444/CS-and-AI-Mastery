const fs=require('fs');
const path=require('path');
const root=process.cwd();
const files=[path.join(root,'index.html')];
const courses=path.join(root,'courses');
if(fs.existsSync(courses))for(const name of fs.readdirSync(courses).filter(x=>x.endsWith('.html')))files.push(path.join(courses,name));
const uiTag='<script src="/assets/python-only-ui.js?v=20260811-2" defer></script>';
const runnerTag='<script src="/assets/adaptive-practice-layer.js?v=20260811-3" defer></script>';
let fixed=0;
for(const file of files){
 let html=fs.readFileSync(file,'utf8');
 html=html.replace(/\s*<script\b[^>]*src=["'][^"']*\/assets\/python-only-ui\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n');
 // A previous first-match injection could land inside a legacy srcdoc string.
 html=html.replace(/'\s*\n\s*<\/body><\/html>'/g,"'</body></html>'");
 html=html.replace(/"\s*\n\s*<\/body><\/html>"/g,'"</body></html>"');
 const isCourse=path.dirname(file)===courses;
 if(isCourse){
  // Keep exactly one lightweight shared Python runner and remove the old single-example runtimes.
  html=html.replace(/\s*<script\b[^>]*src=["'][^"']*\/assets\/adaptive-practice-layer\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n');
  html=html.replace(/\s*<script\b[^>]*src=["'][^"']*\/assets\/(?:runnable-lesson-example-fixes|lesson-example-runner|lesson-example-runner-guard)\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n');
 }
 const at=html.toLowerCase().lastIndexOf('</body>');
 if(at<0)throw new Error(`Final </body> missing in ${path.relative(root,file)}`);
 const tags=(isCourse?runnerTag+'\n':'')+uiTag;
 html=html.slice(0,at)+'\n'+tags+'\n'+html.slice(at);
 fs.writeFileSync(file,html,'utf8');fixed++;
}
if(fixed!==58)throw new Error(`Expected index + 57 course pages, fixed ${fixed}`);
console.log(`Python-only runtime normalized across ${fixed} HTML files; course pages now use one lightweight cache-busted Python runner.`);
require('./inject-study-examples.cjs');
require('./verify-study-examples.cjs');
