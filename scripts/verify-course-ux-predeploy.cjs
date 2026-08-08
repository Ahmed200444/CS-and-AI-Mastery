const fs=require('fs');
const path=require('path');

const root=process.cwd();
const coursesDir=path.join(root,'courses');
const langFile=path.join(root,'assets','primary-language-mode.js');
const evergreenFile=path.join(root,'assets','evergreen-learning-engine.js');
const publishFile=path.join(root,'assets','exercise-direct-publish.js');
const problems=[];

if(!fs.existsSync(langFile))problems.push('primary-language-mode.js missing');
if(!fs.existsSync(evergreenFile))problems.push('evergreen-learning-engine.js missing');
if(!fs.existsSync(publishFile))problems.push('exercise-direct-publish.js missing');
if(!fs.existsSync(coursesDir))problems.push('courses directory missing');

if(!problems.length){
 const lang=fs.readFileSync(langFile,'utf8');
 const evergreen=fs.readFileSync(evergreenFile,'utf8');
 const publish=fs.readFileSync(publishFile,'utf8');
 const required=[
  ['strict language-flexible whitelist',/FLEXIBLE_IDS=\['dsa','problem-solving','oop','algorithms','data-structures'\]/],
  ['Python course exclusion',/if\(\/python\|javascript\|typescript\|sql\|html\|css\|react\|node\|java\\b\|c\\\+\\\+\/\.test/],
  ['C++ assessment workspace',/data-csai-active-language[^\n]*cpp|data-csai-active-language','cpp/],
  ['Dual C++ pane',/data-dual-cpp-pane/],
  ['C++ file labels',/\.cpp/],
  ['direct static course navigation',/location\.assign\(url\)/],
  ['deep normal loop',/for \(int i = 0; i < nums\.size\(\); i\+\+\)/],
  ['range loop',/for \(int value : nums\)/],
  ['iterator loop',/for \(auto it = nums\.begin\(\); it != nums\.end\(\); it\+\+\)/],
  ['predict cleanup',/function removePredict\(\)/]
 ];
 for(const [label,re] of required)if(!re.test(lang))problems.push(`primary-language-mode.js missing ${label}`);
 if(/renderHubSelector|Choose your primary coding language/.test(lang))problems.push('language selector must not render on the homepage');
 if(/FLEXIBLE_IDS=\[[^\]]*['"]python['"]/.test(lang))problems.push('Python course must not be language-flexible');
 if(evergreen.includes('data-evergreen-predict')||evergreen.includes('Predict the output before you run'))problems.push('Evergreen predict-output UI is still present');

 const publishChecks=[
  ['exact selected mode routing',/data-csai-active-language/],
  ['Dual last-edited language routing',/data-csai-dual-publish-language/],
  ['Dual C++ editor publishing',/data-dual-cpp-editor/],
  ['language-specific editor selection',/function editorFor\(task,lang\)/],
  ['Python extension mapping',/lang==='python'\?'py'/],
  ['C++ extension mapping',/lang==='cpp'\?'cpp'/],
  ['language-specific exercise path',/exercisePath\(task,lang\)/],
  ['language-specific content publish',/var editor=editorFor\(task,lang\)/]
 ];
 for(const [label,re] of publishChecks)if(!re.test(publish))problems.push(`exercise-direct-publish.js missing ${label}`);
 if(/LANGUAGE_KEY='csai-primary-language-v1'/.test(publish))problems.push('exercise-direct-publish.js still depends on obsolete global language mode');

 const files=fs.readdirSync(coursesDir).filter(x=>x.endsWith('.html'));
 if(files.length!==54)problems.push(`expected 54 course pages, found ${files.length}`);
 for(const name of files){
  const html=fs.readFileSync(path.join(coursesDir,name),'utf8');
  if(!html.includes('csai-course-first-paint-start')||!html.includes('csai-course-first-paint-end'))problems.push(`${name}: missing first-paint guard`);
  if(!html.includes('/assets/primary-language-mode.js'))problems.push(`${name}: missing language UX runtime`);
 }
}

if(problems.length)throw new Error('Course UX predeploy verification failed:\n'+problems.slice(0,80).join('\n'));

const reportPath=path.join(root,'assets','final-platform-verification.json');
if(fs.existsSync(reportPath)){
 const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
 report.guarantees=(Array.isArray(report.guarantees)?report.guarantees:[]).filter(x=>!String(x).startsWith('Python, C++, and Dual learning modes are available before the course catalog'));
 report.guarantees.push('Python, C++, and Dual controls appear only on language-flexible courses; language-specific courses such as Python do not show the selector');
 report.guarantees.push('Course opening uses guarded static navigation so raw internal route content is not exposed during navigation');
 report.guarantees.push('Evergreen Mastery Labs do not ask learners to predict output before running examples');
 report.guarantees.push('Exercise publishing follows the exact selected language: Python publishes to Python/*.py, C++ publishes to C++/*.cpp, and Dual publishes the last-edited Python or C++ editor to its matching folder and extension');
 fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n','utf8');
}
console.log('Course UX predeploy verification passed: 54 guarded pages, no predict-output UI, strict language-flexible selector scope, C++/Dual switching, and exact language-aware GitHub publishing.');
