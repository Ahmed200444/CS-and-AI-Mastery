const fs=require('fs');
const path=require('path');

const root=process.cwd();
const indexPath=path.join(root,'index.html');
let html=fs.readFileSync(indexPath,'utf8');
const re=/(<script\b[^>]*\bid=["']coursedata["'][^>]*>)([\s\S]*?)(<\/script>)/i;
const m=html.match(re);
if(!m)throw new Error('coursedata missing while updating course-count guards');
const courses=JSON.parse(m[2]);
const cpp=Array.isArray(courses)?courses.find(c=>c&&c.id==='cpp'):null;
if(!cpp)throw new Error('Dedicated C++ course is missing before course-count migration');
cpp.category='foundations';
delete cpp.linked;
const safe=JSON.stringify(courses).replace(/<\//g,'<\\/');
html=html.replace(re,`${m[1]}${safe}${m[3]}`);
fs.writeFileSync(indexPath,html,'utf8');
const expected=courses.length;
if(expected!==55)throw new Error(`Expected C++ migration to produce 55 source courses, found ${expected}`);

const scriptsDir=path.join(root,'scripts');
const files=fs.readdirSync(scriptsDir).filter(name=>name.endsWith('.cjs')&&name!=='patch-course-count-for-cpp.cjs'&&name!=='add-cpp-course.cjs');
let changed=0,replacements=0;
for(const name of files){
 const full=path.join(scriptsDir,name);
 let s=fs.readFileSync(full,'utf8'),before=s;
 const reps=[
  [/!==\s*54\b/g,'!==55'],
  [/===\s*54\b/g,'===55'],
  [/!=\s*54\b/g,'!=55'],
  [/==\s*54\b/g,'==55'],
  [/\bExpected 54\b/g,'Expected 55'],
  [/\bexpected 54\b/g,'expected 55'],
  [/\b54 course pages\b/g,'55 course pages'],
  [/\b54 courses\b/g,'55 courses'],
  [/\b54 static course pages\b/g,'55 static course pages'],
  [/\b54 guarded pages\b/g,'55 guarded pages'],
  [/\ball 54 pages\b/g,'all 55 pages'],
  [/\ball 54 course pages\b/g,'all 55 course pages'],
  [/\bon 54 pages\b/g,'on 55 pages']
 ];
 for(const [pattern,to] of reps){const old=s;s=s.replace(pattern,to);if(s!==old)replacements++;}
 if(s!==before){fs.writeFileSync(full,s,'utf8');changed++;}
}
console.log(`C++ metadata normalized; course-count migration prepared ${expected} courses and patched ${changed} build/verifier scripts across ${replacements} assertion/text pattern groups.`);
