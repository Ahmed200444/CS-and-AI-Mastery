const fs=require('fs');
const path=require('path');

const root=process.cwd();
const coursesDir=path.join(root,'courses');
if(!fs.existsSync(coursesDir))throw new Error('courses directory missing before first-paint guard injection');
const files=fs.readdirSync(coursesDir).filter(x=>x.endsWith('.html'));
if(files.length!==54)throw new Error(`Expected 54 course pages, found ${files.length}`);

const headBlock=`<style id="csai-course-first-paint-style">
html.csai-course-booting{background:#0d1520!important}
html.csai-course-booting body{visibility:hidden!important}
html.csai-course-booting::before{content:"Loading course…";position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:#0d1520;color:#dce7f4;font:800 15px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:.01em}
html[data-theme="light"].csai-course-booting{background:#f4f7fb!important}
html[data-theme="light"].csai-course-booting::before{background:#f4f7fb;color:#172231}
</style>
<script id="csai-course-first-paint-start">(function(){document.documentElement.classList.add('csai-course-booting');window.__csaiCourseBootFailSafe=setTimeout(function(){document.documentElement.classList.remove('csai-course-booting')},5000)})();</script>`;
const endBlock=`<script id="csai-course-first-paint-end">(function(){var done=false;function reveal(){if(done)return;done=true;clearTimeout(window.__csaiCourseBootFailSafe);requestAnimationFrame(function(){requestAnimationFrame(function(){document.documentElement.classList.remove('csai-course-booting')})})}window.addEventListener('csai-course-ready',reveal,{once:true});window.addEventListener('load',function(){setTimeout(reveal,250)},{once:true});if(document.documentElement.getAttribute('data-csai-course-ready')==='1')reveal()})();</script>`;

function bootClass(html){
 return html.replace(/<html\b([^>]*)>/i,function(full,attrs){
  if(/\bclass\s*=/.test(attrs))return full.replace(/class\s*=\s*(["'])([^"']*)\1/i,function(_,q,v){return'class='+q+(v+' csai-course-booting').trim().replace(/\s+/g,' ')+q});
  return'<html'+attrs+' class="csai-course-booting">';
 });
}

for(const name of files){
 const file=path.join(coursesDir,name);let html=fs.readFileSync(file,'utf8');
 html=html.replace(/\s*<style\s+id=["']csai-course-first-paint-style["'][\s\S]*?<\/style>\s*<script\s+id=["']csai-course-first-paint-start["'][\s\S]*?<\/script>/gi,'');
 html=html.replace(/\s*<script\s+id=["']csai-course-first-paint-end["'][\s\S]*?<\/script>/gi,'');
 if(!/<head(?:\s[^>]*)?>/i.test(html)||!/<\/body>/i.test(html))throw new Error(`Malformed course page: ${name}`);
 html=bootClass(html);
 html=html.replace(/<head(?:\s[^>]*)?>/i,function(m){return m+'\n'+headBlock;});
 html=html.replace(/<\/body>/i,`${endBlock}\n</body>`);
 fs.writeFileSync(file,html,'utf8');
 const out=fs.readFileSync(file,'utf8');
 if(!/<html[^>]*csai-course-booting/i.test(out))throw new Error(`Boot class missing from initial HTML: ${name}`);
 if(!out.includes('csai-course-first-paint-start')||!out.includes('csai-course-first-paint-end'))throw new Error(`First-paint guard missing from ${name}`);
 if(out.indexOf('csai-course-first-paint-style')>out.indexOf('</head>'))throw new Error(`First-paint CSS is too late in ${name}`);
}
console.log(`Injected initial-byte course first-paint protection into ${files.length} course pages.`);
