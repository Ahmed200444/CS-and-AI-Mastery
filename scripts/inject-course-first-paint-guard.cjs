const fs=require('fs');
const path=require('path');

const root=process.cwd();
const coursesDir=path.join(root,'courses');
if(!fs.existsSync(coursesDir))throw new Error('courses directory missing before first-paint guard injection');
const files=fs.readdirSync(coursesDir).filter(x=>x.endsWith('.html'));
if(files.length!==54)throw new Error(`Expected 54 course pages, found ${files.length}`);

const headBlock=`<style id="csai-course-first-paint-style">
html.csai-course-booting{background:#0d1520}
html.csai-course-booting body{visibility:hidden!important}
html.csai-course-booting::before{content:"Loading course…";position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:#0d1520;color:#dce7f4;font:800 15px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:.01em}
html[data-theme="light"].csai-course-booting::before,body[data-theme="light"]~*{color:#211f2b}
</style>
<script id="csai-course-first-paint-start">(function(){document.documentElement.classList.add('csai-course-booting');window.__csaiCourseBootFailSafe=setTimeout(function(){document.documentElement.classList.remove('csai-course-booting')},2200)})();</script>`;
const endBlock=`<script id="csai-course-first-paint-end">(function(){function reveal(){clearTimeout(window.__csaiCourseBootFailSafe);requestAnimationFrame(function(){requestAnimationFrame(function(){document.documentElement.classList.remove('csai-course-booting')})})}function ready(){if(document.documentElement.getAttribute('data-csai-course-ready')==='1')reveal();else setTimeout(reveal,700)}window.addEventListener('csai-course-ready',reveal,{once:true});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready()})();</script>`;

for(const name of files){
 const file=path.join(coursesDir,name);let html=fs.readFileSync(file,'utf8');
 html=html.replace(/\s*<style\s+id=["']csai-course-first-paint-style["'][\s\S]*?<\/style>\s*<script\s+id=["']csai-course-first-paint-start["'][\s\S]*?<\/script>/gi,'');
 html=html.replace(/\s*<script\s+id=["']csai-course-first-paint-end["'][\s\S]*?<\/script>/gi,'');
 if(!/<\/head>/i.test(html)||!/<\/body>/i.test(html))throw new Error(`Malformed course page: ${name}`);
 html=html.replace(/<\/head>/i,`${headBlock}\n</head>`);
 html=html.replace(/<\/body>/i,`${endBlock}\n</body>`);
 fs.writeFileSync(file,html,'utf8');
 const out=fs.readFileSync(file,'utf8');
 if(!out.includes('csai-course-first-paint-start')||!out.includes('csai-course-first-paint-end'))throw new Error(`First-paint guard missing from ${name}`);
}
console.log(`Injected raw-content first-paint guard into ${files.length} course pages.`);
