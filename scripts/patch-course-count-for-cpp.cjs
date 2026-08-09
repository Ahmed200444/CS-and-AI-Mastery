const fs=require('fs');
const path=require('path');

const root=process.cwd();
const indexPath=path.join(root,'index.html');
const html=fs.readFileSync(indexPath,'utf8');
const m=html.match(/<script\b[^>]*\bid=["']coursedata["'][^>]*>([\s\S]*?)<\/script>/i);
if(!m)throw new Error('coursedata missing while updating course-count guards');
const courses=JSON.parse(m[1]);
const expected=Array.isArray(courses)?courses.length:0;
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
 for(const [re,to] of reps){const old=s;s=s.replace(re,to);if(s!==old)replacements++;}
 if(s!==before){fs.writeFileSync(full,s,'utf8');changed++;}
}
console.log(`Course-count migration guard prepared ${expected} courses; patched ${changed} build/verifier scripts across ${replacements} assertion/text pattern groups.`);
