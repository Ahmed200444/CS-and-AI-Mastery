const fs=require('fs');
const path=require('path');

const root=process.cwd();
const coursesDir=path.join(root,'courses');
if(!fs.existsSync(coursesDir))throw new Error('courses directory missing before course first-paint cleanup');
const files=fs.readdirSync(coursesDir).filter(x=>x.endsWith('.html'));
if(files.length!==54)throw new Error(`Expected 54 base course pages, found ${files.length}`);

let cleaned=0;
for(const name of files){
 const file=path.join(coursesDir,name);
 let html=fs.readFileSync(file,'utf8');
 const before=html;

 // Course pages are generated as complete static HTML, so they should paint immediately.
 // Remove the legacy full-page boot cover instead of waiting for window.load or a
 // runtime-specific "course ready" event.
 html=html.replace(/\s*<style\s+id=["']csai-course-first-paint-style["'][\s\S]*?<\/style>\s*<script\s+id=["']csai-course-first-paint-start["'][\s\S]*?<\/script>/gi,'\n');
 html=html.replace(/\s*<script\s+id=["']csai-course-first-paint-end["'][\s\S]*?<\/script>/gi,'\n');
 html=html.replace(/(<html\b[^>]*\bclass\s*=\s*["'])([^"']*)(["'])/i,function(all,a,classes,c){
   const next=classes.split(/\s+/).filter(Boolean).filter(x=>x!=='csai-course-booting').join(' ');
   return a+next+c;
 });
 html=html.replace(/\sclass=["']\s*["']/i,'');

 if(/csai-course-first-paint-|csai-course-booting|Loading course…/.test(html))throw new Error(`${name}: legacy course loading cover still remains`);
 if(!/<main\b/i.test(html)||!/<\/body>/i.test(html))throw new Error(`${name}: static course document is malformed`);
 if(html!==before)cleaned++;
 fs.writeFileSync(file,html,'utf8');
}

console.log(`Course first paint optimized: ${files.length} static pages render immediately; removed legacy loading cover from ${cleaned} page(s).`);
