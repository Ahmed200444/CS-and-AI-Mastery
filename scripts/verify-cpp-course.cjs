const fs=require('fs');
const path=require('path');
const os=require('os');
const cp=require('child_process');

const root=process.cwd();
const dataPath=path.join(root,'assets','course-data','cpp.json');
const pagePath=path.join(root,'courses','cpp.html');
const problems=[];
if(!fs.existsSync(dataPath))problems.push('missing assets/course-data/cpp.json');
if(!fs.existsSync(pagePath))problems.push('missing courses/cpp.html');
if(problems.length)throw new Error(problems.join('\n'));
const course=JSON.parse(fs.readFileSync(dataPath,'utf8'));
const lessons=Array.isArray(course.lessons)?course.lessons:[];
const exercises=Array.isArray(course.exercises)?course.exercises:[];
const quiz=Array.isArray(course.quiz)?course.quiz:[];
const projects=(Array.isArray(course.projects)?course.projects:[]).length+(course.capstone?1:0);
if(course.id!=='cpp'||course.title!=='C++')problems.push('course identity is not cpp / C++');
if(course.category!=='foundations')problems.push(`C++ course should use the Python-style Foundations category, found ${course.category}`);
if(Object.prototype.hasOwnProperty.call(course,'linked'))problems.push('C++ course should use its static course page rather than a legacy linked track');
if(lessons.length<30)problems.push(`expected at least 30 C++ lessons, found ${lessons.length}`);
if(exercises.length<15)problems.push(`expected at least 15 C++ exercises, found ${exercises.length}`);
if(quiz.length<10)problems.push(`expected at least 10 C++ knowledge checks, found ${quiz.length}`);
if(projects<4)problems.push(`expected at least 4 C++ projects/capstone items, found ${projects}`);
let exampleCount=0,forExamples=0;
for(const [i,l] of lessons.entries()){
 const examples=Array.isArray(l.examples)?l.examples:(l.example?[l.example]:[]);
 exampleCount+=examples.length;
 if(examples.length<2)problems.push(`lesson ${i+1} ${l.title}: expected multiple examples`);
 if(!String(l.explanation||'').trim())problems.push(`lesson ${i+1} ${l.title}: missing explanation`);
 if(!Array.isArray(l.concepts)||l.concepts.length<2)problems.push(`lesson ${i+1} ${l.title}: missing key concepts`);
 examples.forEach((code,ei)=>{if(!/\bint\s+main\s*\(/.test(code))problems.push(`lesson ${i+1} example ${ei+1}: example is not a complete runnable C++ program`);if(/\bfor\s*\(/.test(code))forExamples++;});
}
if(exampleCount<60)problems.push(`expected at least 60 C++ lesson examples, found ${exampleCount}`);
if(forExamples<10)problems.push(`expected broad for-loop teaching coverage, found only ${forExamples} examples containing for loops`);

const page=fs.readFileSync(pagePath,'utf8');
for(const [label,needle] of [
 ['Evergreen engine','/assets/evergreen-learning-engine.js'],
 ['Evergreen navigation','/assets/evergreen-review-navigation.js'],
 ['smart Evergreen review','/assets/smart-evergreen-review.js'],
 ['lesson example runner','/assets/lesson-example-runner.js'],
 ['example learning tools','/assets/example-learning-tools.js'],
 ['example GitHub publisher','/assets/example-github-publish.js'],
 ['exercise GitHub publisher','/assets/exercise-direct-publish.js'],
 ['C++ browser runner','/assets/cpp-runner-ui-worker.js'],
 ['assessment practice','/assets/assessment-practice.js'],
 ['dedicated C++ bridge','/assets/dedicated-cpp-course.js'],
 ['every-for-loop teaching layer','/assets/cpp-loop-deep-dive.js']
])if(!page.includes(needle))problems.push(`C++ page missing ${label}`);
if(page.includes('data-lang-mode="python"')||page.includes('data-lang-mode="dual"'))problems.push('dedicated C++ course should not contain Python/Dual language-mode controls in static HTML');
if(!/"defaultLanguage":"cpp"/.test(page))problems.push('C++ assessment payload is not natively configured for C++');

const loop=fs.readFileSync(path.join(root,'assets','cpp-loop-deep-dive.js'),'utf8');
if(!/What if I used a different loop\?/i.test(loop))problems.push('C++ loop-alternative teaching panel is missing');
if(!/Initialization/i.test(loop)||!/Condition/i.test(loop)||!/Update/i.test(loop))problems.push('C++ normal for-loop component explanation is incomplete');
if(!/range-based/i.test(loop)||!/iterator-based/i.test(loop))problems.push('C++ loop alternatives do not cover range-based and iterator loops');
if(!/Nested-loop note/i.test(loop))problems.push('nested for-loop explanation is missing');

const dedicated=fs.readFileSync(path.join(root,'assets','dedicated-cpp-course.js'),'utf8');
if(!/data-csai-active-language','cpp'/.test(dedicated))problems.push('dedicated assessment does not force C++ language identity');
if(!/data-run-language-example/.test(dedicated))problems.push('dedicated course does not route lesson/exercise runs through shared C++ runner');
const publisher=fs.readFileSync(path.join(root,'assets','example-github-publish.js'),'utf8');
if(!/same\.length>1\?'-example-'\+index:'-example'/.test(publisher))problems.push('multiple lesson examples can still overwrite each other on GitHub');
const direct=fs.readFileSync(path.join(root,'assets','exercise-direct-publish.js'),'utf8');
if(!/student-code\/'\+languageFolder\(ext\)/.test(direct)||!/if\(ext==='cpp'\)return'C\+\+'/.test(direct))problems.push('C++ exercise GitHub path is not language-first');

const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
if(/<details\b[^>]*class=["'][^"']*hub-changelog/i.test(index))problems.push('visible version/changelog controls still appear at the bottom of the hub');

let gpp=null;
try{gpp=cp.execFileSync('bash',['-lc','command -v g++ || true'],{encoding:'utf8'}).trim()||null;}catch(e){}
let compiled=0;
if(gpp){
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'csai-cpp-course-'));
 const compile=(code,label)=>{
  const src=path.join(tmp,`case-${compiled}.cpp`);
  fs.writeFileSync(src,String(code),'utf8');
  const r=cp.spawnSync(gpp,['-std=c++17','-fsyntax-only',src],{encoding:'utf8'});
  if(r.status!==0)problems.push(`${label}: g++ syntax failed: ${(r.stderr||r.stdout||'').trim().slice(0,700)}`);
  compiled++;
 };
 lessons.forEach((l,li)=>(Array.isArray(l.examples)?l.examples:[]).forEach((code,ei)=>compile(code,`lesson ${li+1} example ${ei+1} (${l.title})`)));
 exercises.forEach((e,ei)=>{if(String(e.solution||'').trim())compile(e.solution,`exercise ${ei+1} solution (${e.title})`);else problems.push(`exercise ${ei+1} ${e.title}: missing revealed solution`);});
 fs.rmSync(tmp,{recursive:true,force:true});
}else console.warn('g++ not available in this build environment; browser/runtime and structural verification still run.');

if(problems.length)throw new Error('Dedicated C++ course verification failed:\n'+problems.slice(0,180).join('\n'));
console.log(`Dedicated C++ course verification passed: ${lessons.length} lessons, ${exampleCount} lesson examples (${forExamples} with for loops), ${exercises.length} exercises, ${quiz.length} knowledge checks, ${projects} projects/capstone; g++ syntax checks executed: ${compiled}; Evergreen/GitHub/loop-teaching/footer guards are present.`);
