const fs=require('fs');
const path=require('path');
const root=process.cwd();
const problems=[];
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const workspace=read('assets/course-project-workspace.js');
const inject=read('scripts/inject-course-project-workspace.cjs');

const checks=[
 ['C++ project extension',/cpp:'cpp'/],
 ['C++ project label',/cpp:'C\+\+'/],
 ['C++ starter program',/if\(lang==='cpp'\)return '#include <iostream>/],
 ['C++ project language option',/\['cpp','python','javascript','sql','html','json','shell','text'\]/],
 ['shared C++ project runner bridge',/function runCppProject\(code,out\)/],
 ['shared C++ runner proxy',/data-run-language-example/],
 ['project README generator',/function readmeForProject\(p,lang,fileName\)/],
 ['README course section',/## Course/],
 ['README concepts section',/## What this project practices/],
 ['README files section',/## Files/],
 ['README run section',/## How to run/],
 ['C++ README compile command',/g\+\+ -std=c\+\+17/],
 ['project folder base',/base='student-code\/projects\/'\+slug\(courseId\)\+'\/'\+projectSlug/],
 ['README path beside project code',/readmePath=base\+'\/README\.md'/],
 ['code GitHub write',/await send\(path,content\+'\\n'/],
 ['README GitHub write',/await send\(readmePath,readmeForProject/],
 ['two-file success status',/\+ README\.md/]
];
for(const [label,re] of checks)if(!re.test(workspace))problems.push('missing '+label);
if(/var path='student-code\/projects\/'\+slug\(courseId\)\+'\/'\+slug\(p\.title\|\|'project'\)\+'\.'/m.test(workspace))problems.push('old flat project-file GitHub path remains');
if(!/const CPP=new Set\(\['cpp'\]\)/.test(inject))problems.push('project injector does not classify cpp as C++');
if(!/if\(CPP\.has\(id\)\)return'cpp'/.test(inject))problems.push('project injector does not default the C++ course to cpp');
if(!/course-project-workspace\.js\?v=20260809-2/.test(inject))problems.push('project workspace cache version was not bumped');

const coursesDir=path.join(root,'courses');
if(!fs.existsSync(coursesDir))problems.push('courses directory missing');
else{
 const files=fs.readdirSync(coursesDir).filter(f=>f.endsWith('.html'));
 if(files.length!==55)problems.push(`expected 55 course pages, found ${files.length}`);
 for(const file of files){
  const html=fs.readFileSync(path.join(coursesDir,file),'utf8');
  if(!html.includes('/assets/course-project-workspace.js?v=20260809-2'))problems.push(`${file}: updated project workspace missing`);
 }
 const cppPath=path.join(coursesDir,'cpp.html');
 if(fs.existsSync(cppPath)){
  const cpp=fs.readFileSync(cppPath,'utf8');
  if(!/"courseId":"cpp"[\s\S]*?"defaultLanguage":"cpp"/.test(cpp))problems.push('cpp project payload is not C++ by default');
 }
}

if(problems.length)throw new Error('Project README publishing verification failed:\n'+problems.slice(0,120).join('\n'));
console.log('Project README verification passed: C++ project running, project-folder code publishing, automatic README.md generation, language-aware run instructions, and 55-page injection are wired.');
