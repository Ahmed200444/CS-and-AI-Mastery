const fs=require('fs');
const path=require('path');
const {spawnSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..');
const COURSE_DIR=path.join(ROOT,'assets','course-data');
const GUIDE_DIR=path.join(ROOT,'assets','practice-guidance');
const files=fs.readdirSync(COURSE_DIR).filter(x=>x.endsWith('.json')).sort();
let counts={courses:0,lessons:0,examples:0,exercises:0,projects:0,quiz:0};
function fail(msg){throw new Error(msg)}
function listExamples(l){const x=l.examples!==undefined?l.examples:l.example;return Array.isArray(x)?x:(x?[x]:[])}
function assertBrief(p,label,min=4,titleRe=/requirements|question|what you must/i){
  if(!p)fail(`Missing brief: ${label}`);
  if(!Array.isArray(p.requirements)||p.requirements.length<min)fail(`Requirements too thin: ${label}`);
  if(!Array.isArray(p.steps)||p.steps.length!==p.requirements.length)fail(`Compatibility steps mismatch: ${label}`);
  if(JSON.stringify(p.steps)!==JSON.stringify(p.requirements))fail(`Steps are not a mirror of requirements: ${label}`);
  if(!Array.isArray(p.tools)||!p.tools.length)fail(`Relevant concepts missing: ${label}`);
  if(!titleRe.test(p.title||''))fail(`Not exam/requirement style: ${label} (${p.title||''})`);
  if(!p.intro||!p.checkpoint)fail(`Intro/checkpoint missing: ${label}`);
}
for(const file of files){
  const course=JSON.parse(fs.readFileSync(path.join(COURSE_DIR,file),'utf8'));
  const gp=path.join(GUIDE_DIR,course.id+'.json');
  if(!fs.existsSync(gp))fail(`Missing guidance file for ${course.id}`);
  const guide=JSON.parse(fs.readFileSync(gp,'utf8'));
  if(guide.schemaVersion!==2)fail(`Guidance schema is not v2 for ${course.id}`);
  assertBrief(guide.course,`${course.id}/course`,5,/course requirements/i);
  counts.courses++;

  const lessons=course.lessons||[];
  for(let i=0;i<lessons.length;i++){
    const l=lessons[i],id=l.id||`lesson-${i}`,g=guide.lessons&&guide.lessons[id];
    if(!g)fail(`Missing lesson guide ${course.id}/${id}`);
    assertBrief(g.practice,`${course.id}/${id}/lesson`,4,/lesson requirements/i);
    const ex=listExamples(l);
    if(!Array.isArray(g.examples)||g.examples.length!==ex.length)fail(`Example guide mismatch ${course.id}/${id}: ${g.examples&&g.examples.length} vs ${ex.length}`);
    for(let j=0;j<g.examples.length;j++) assertBrief(g.examples[j],`${course.id}/${id}/example-${j+1}`,5,/example .*requirements/i);
    counts.lessons++;counts.examples+=ex.length;
  }

  const exercises=course.exercises||[];
  if(!Array.isArray(guide.exercises)||guide.exercises.length!==exercises.length)fail(`Exercise guide count mismatch ${course.id}`);
  guide.exercises.forEach((x,i)=>assertBrief(x.practice,`${course.id}/exercise-${i+1}`,5,/exercise question/i));
  counts.exercises+=exercises.length;

  const expectedProjects=(course.projects||[]).length+(course.capstone?1:0);
  if(!Array.isArray(guide.projects)||guide.projects.length!==expectedProjects)fail(`Project guide count mismatch ${course.id}`);
  guide.projects.forEach((x,i)=>assertBrief(x.practice,`${course.id}/project-${i+1}`,4,/project question|what your finished work must do/i));
  counts.projects+=expectedProjects;

  const quiz=course.quiz||[];
  if(!Array.isArray(guide.quiz)||guide.quiz.length!==quiz.length)fail(`Quiz guide count mismatch ${course.id}`);
  guide.quiz.forEach((x,i)=>assertBrief(x.practice,`${course.id}/knowledge-${i+1}`,4,/knowledge-check requirements/i));
  counts.quiz+=quiz.length;

  const serialized=JSON.stringify(guide).toLowerCase();
  if(serialized.includes('"solution"'))fail(`Solution key leaked into guidance ${course.id}`);
  const banned=[/start with one in-memory list/,/build one small working piece/,/one vertical slice/,/copy the solution/,/here is the solution/];
  for(const re of banned)if(re.test(serialized))fail(`Implementation/solution wording leaked into ${course.id}: ${re}`);

  const htmlPath=path.join(ROOT,'courses',course.id+'.html');
  if(!fs.existsSync(htmlPath))fail(`Missing generated course page ${course.id}`);
  const html=fs.readFileSync(htmlPath,'utf8');
  const matches=html.match(/practice-guidance\.js/g)||[];
  if(matches.length!==1)fail(`Practice guidance script count ${matches.length} in ${course.id}.html`);
  const workspace=html.indexOf('course-project-workspace.js'),guidance=html.indexOf('practice-guidance.js');
  if(workspace>=0&&guidance<workspace)fail(`Guidance loads before project workspace in ${course.id}.html`);
}

const index=JSON.parse(fs.readFileSync(path.join(ROOT,'assets','practice-guidance-index.json'),'utf8'));
if(index.schemaVersion!==2)fail('Practice guidance index is not schema v2');
if(!index.courses||index.courses.length!==files.length)fail('Practice guidance index does not cover every course');
const indexHtml=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
if((indexHtml.match(/practice-guidance\.js/g)||[]).length!==1)fail('index.html must load practice guidance exactly once');

const py=JSON.parse(fs.readFileSync(path.join(GUIDE_DIR,'python.json'),'utf8'));
const expense=py.projects.find(x=>x.title==='Expense tracker');
if(!expense)fail('Expense tracker guide missing');
const expenseText=JSON.stringify(expense.practice).toLowerCase();
for(const phrase of ['while loop','json','json file','try / except','list of dictionaries','user must be able to repeatedly choose','amount, category, and description','total amount spent','totals grouped by category','exit cleanly']){
  if(!expenseText.includes(phrase))fail(`Expense tracker exam brief missing ${phrase}`);
}
const pyFirstLesson=Object.values(py.lessons)[0];
if(!pyFirstLesson||!pyFirstLesson.practice.requirements.length||!pyFirstLesson.examples[0].requirements.length)fail('Python first lesson/example does not have requirement briefs');
if(!JSON.stringify(pyFirstLesson.examples[0]).toLowerCase().includes('predict'))fail('Example brief must require prediction/trace work');
const fizz=py.exercises.find(x=>x.title==='FizzBuzz');
if(!fizz)fail('FizzBuzz exercise missing');
const fizzText=JSON.stringify(fizz.practice).toLowerCase();
for(const phrase of ['modulo (%)','if / elif / else','return 1..n'])if(!fizzText.includes(phrase.toLowerCase()))fail(`FizzBuzz brief missing ${phrase}`);

function practiceText(courseId,kind,title){
  const d=JSON.parse(fs.readFileSync(path.join(GUIDE_DIR,courseId+'.json'),'utf8'));
  let item;
  if(kind==='exercise')item=d.exercises.find(x=>x.title===title);
  else if(kind==='project')item=d.projects.find(x=>x.title===title);
  else if(kind==='lesson')item=Object.values(d.lessons).find(x=>x.title===title);
  if(!item)fail(`Representative guidance item missing: ${courseId}/${kind}/${title}`);
  return JSON.stringify(item.practice).toLowerCase();
}
function mustHave(t,phrases,label){for(const p of phrases)if(!t.includes(p.toLowerCase()))fail(`${label}: missing ${p}`)}
function mustNotHave(t,phrases,label){for(const p of phrases)if(t.includes(p.toLowerCase()))fail(`${label}: unexpected ${p}`)}
let t=practiceText('python','exercise','Word frequency');mustHave(t,['dict','get()'],'Python Word frequency');
t=practiceText('sql','exercise','Top 5 by price');mustHave(t,['order by','limit'],'SQL Top 5');mustNotHave(t,['classes or dictionaries','inventory'],'SQL Top 5');
t=practiceText('dsa','exercise','Array vs linked list trade-off');mustHave(t,['array','node structure'],'DSA array/list trade-off');mustNotHave(t,['random-number generator'],'DSA array/list trade-off');
t=practiceText('ai-ml','project','Iris classifier');mustHave(t,['train/test split','evaluation metric'],'Iris classifier');
t=practiceText('web-dev','project','React dashboard');mustHave(t,['components','props/state'],'React dashboard');
t=practiceText('frontend-dev','project','Interactive dashboard UI');mustHave(t,['flexbox/grid'],'Frontend dashboard');mustNotHave(t,['deck class','random.shuffle'],'Frontend dashboard');
t=practiceText('frontend-dev','project','Accessible component library');mustHave(t,['keyboard interaction','focus behavior'],'Accessible component library');mustNotHave(t,['deck class'],'Accessible component library');
t=practiceText('cpp-dsa','project','C++ CLI Grade & Statistics Analyzer');mustHave(t,['command-line input/arguments','clear error handling'],'C++ CLI project');mustNotHave(t,['argparse','pathlib'],'C++ CLI project');
t=practiceText('cpp-dsa','lesson','C++ toolchain, compilation & program structure');mustHave(t,['compiler','linker','main'],'C++ toolchain lesson');mustNotHave(t,['html structure'],'C++ toolchain lesson');
t=practiceText('distributed-systems','project','Consistent hash ring simulator');mustHave(t,['hash function','reassignment measurement'],'Consistent hash ring');

const ui=fs.readFileSync(path.join(ROOT,'assets','practice-guidance.js'),'utf8');
if(!ui.includes("var steps=arr(g.requirements).length?arr(g.requirements):arr(g.steps)"))fail('UI must prefer requirements for every guidance type');
if(!ui.includes("var listTag='ul'"))fail('All requirement briefs must render as unnumbered bullets');
if(ui.includes("kind==='project'?'ul':'ol'"))fail('Old project-only bullet behavior remains');
if(!ui.includes("document.createElement('section')"))fail('Requirement briefs must render as static sections');
if(ui.includes("document.createElement('details')"))fail('Requirement briefs must not be clickable/collapsible details');
if(ui.includes("<summary>"))fail('Requirement briefs must not use clickable summary headers');
if(!ui.includes('csai-guide-required\">REQUIRED'))fail('Every requirement brief must visibly identify itself as REQUIRED');
if(!ui.includes("body.insertBefore(lg,body.firstChild)"))fail('Lesson requirements must be first inside every lesson body');
if(!ui.includes("pre.insertAdjacentElement('beforebegin',g)"))fail('Example requirements must appear before each example');
if(ui.includes("pre.insertAdjacentElement('afterend',g)"))fail('Example requirements must not appear below examples');
if(ui.includes('cursor:pointer'))fail('Requirement brief styling must not imply click/toggle behavior');
const check=spawnSync(process.execPath,['--check',path.join(ROOT,'assets','practice-guidance.js')],{encoding:'utf8'});
if(check.status!==0)fail('practice-guidance.js syntax error: '+check.stderr);

const expected={courses:62,lessons:800,examples:895,exercises:794,projects:271,quiz:1585};
for(const [k,v] of Object.entries(expected))if(counts[k]!==v)fail(`Coverage drift ${k}: ${counts[k]} != ${v}`);
console.log('Complete exam-style guidance contract passed:',counts);
