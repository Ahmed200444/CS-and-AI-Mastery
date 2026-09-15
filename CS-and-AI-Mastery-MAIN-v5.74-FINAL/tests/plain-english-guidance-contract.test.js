const fs=require('fs');
const path=require('path');
const vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const COURSE_DIR=path.join(ROOT,'assets','course-data');
const GUIDE_DIR=path.join(ROOT,'assets','practice-guidance');
function fail(m){throw new Error(m)}
function examples(l){const x=l.examples!==undefined?l.examples:l.example;return Array.isArray(x)?x:(x?[x]:[])}
function visibleText(g){return [g.intro||'',g.checkpoint||'',...(g.plainEnglish||[]),...(g.requirements||[])].join(' ')}
function checkPlain(g,label){
  if(!g)fail(`Missing guidance ${label}`);
  if(!Array.isArray(g.plainEnglish)||g.plainEnglish.length<1)fail(`Missing plain-English section ${label}`);
  if(!g.plainEnglishTitle)fail(`Missing plain-English title ${label}`);
  if(!Array.isArray(g.focus)||g.focus.length<1)fail(`Missing behavior-first focus ${label}`);
  for(const line of g.plainEnglish){if(typeof line!=='string'||!line.trim())fail(`Empty plain-English line ${label}`)}
}
const bannedVisible=[/\bfor loop\b/i,/\bwhile loop\b/i,/if\s*\/\s*elif\s*\/\s*else/i,/\bbreak\b/i,/\bcontinue\b/i,/enumerate\(\)/i,/\btry\s*\/\s*except\b/i,/\blist comprehension\b/i,/\brange\(\)/i];
function checkNoSyntaxHints(g,label){
  const t=visibleText(g);
  for(const re of bannedVisible)if(re.test(t))fail(`Visible guidance leaks direct syntax in ${label}: ${re}`);
}
let counts={courses:0,lessons:0,examples:0,exercises:0,projects:0,quiz:0};
for(const file of fs.readdirSync(COURSE_DIR).filter(f=>f.endsWith('.json')).sort()){
  const course=JSON.parse(fs.readFileSync(path.join(COURSE_DIR,file),'utf8'));
  const guide=JSON.parse(fs.readFileSync(path.join(GUIDE_DIR,course.id+'.json'),'utf8'));
  checkPlain(guide.course,`${course.id}/course`);checkNoSyntaxHints(guide.course,`${course.id}/course`);counts.courses++;
  for(let i=0;i<(course.lessons||[]).length;i++){
    const lesson=course.lessons[i],id=lesson.id||`lesson-${i}`,g=guide.lessons[id];
    checkPlain(g.practice,`${course.id}/${id}/lesson`);checkNoSyntaxHints(g.practice,`${course.id}/${id}/lesson`);counts.lessons++;
    const ex=examples(lesson);if(g.examples.length!==ex.length)fail(`Example count drift ${course.id}/${id}`);
    g.examples.forEach((x,j)=>{checkPlain(x,`${course.id}/${id}/example-${j+1}`);checkNoSyntaxHints(x,`${course.id}/${id}/example-${j+1}`)});counts.examples+=ex.length;
  }
  guide.exercises.forEach((x,i)=>{checkPlain(x.practice,`${course.id}/exercise-${i+1}`);checkNoSyntaxHints(x.practice,`${course.id}/exercise-${i+1}`)});counts.exercises+=guide.exercises.length;
  guide.projects.forEach((x,i)=>{checkPlain(x.practice,`${course.id}/project-${i+1}`);checkNoSyntaxHints(x.practice,`${course.id}/project-${i+1}`)});counts.projects+=guide.projects.length;
  guide.quiz.forEach((x,i)=>{checkPlain(x.practice,`${course.id}/quiz-${i+1}`);checkNoSyntaxHints(x.practice,`${course.id}/quiz-${i+1}`)});counts.quiz+=guide.quiz.length;
}
const expected={courses:62,lessons:800,examples:895,exercises:794,projects:271,quiz:1585};
for(const [k,v] of Object.entries(expected))if(counts[k]!==v)fail(`Coverage drift ${k}: ${counts[k]} != ${v}`);

// Load enough DOM surface for the pure behavior-first helpers to register.
const source=fs.readFileSync(path.join(ROOT,'assets','practice-guidance.js'),'utf8');
const sandbox={
  window:{},
  location:{href:'http://127.0.0.1:5711/courses/python.html'},
  URL,console,
  setTimeout(){return 1},clearTimeout(){},
  fetch(){return Promise.reject(new Error('not used'))},
  MutationObserver:class{observe(){}},
  document:{
    currentScript:{src:'http://127.0.0.1:5711/assets/practice-guidance.js'},
    readyState:'loading',documentElement:{},head:{appendChild(){}},
    addEventListener(){},getElementById(){return null},querySelector(){return null},querySelectorAll(){return[]},
    createElement(){return{setAttribute(){},querySelector(){return null},querySelectorAll(){return[]},style:{},className:'',innerHTML:''}}
  }
};
vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'practice-guidance.js'});
const api=sandbox.window.CSAIPracticeGuidance;if(!api||typeof api.pythonFriendlyAction!=='function')fail('Behavior-first helper was not exposed');
function meaning(line,need,ban=[]){const out=api.pythonFriendlyAction(line);const low=out.toLowerCase();for(const p of need)if(!low.includes(p.toLowerCase()))fail(`${line} => missing ${p}: ${out}`);for(const p of ban)if(new RegExp(p,'i').test(out))fail(`${line} => leaked direct code token ${p}: ${out}`);return out}
meaning('for i in range(5):',['5 times','0 through 4'],['\\bi\\b','\\brange\\b','\\bfor\\b']);
meaning('if i == 3: break',['current value becomes 3','stop the repetition','keep running afterward'],['\\bi\\b','\\bbreak\\b']);
meaning('if i == 1: continue',['current value is 1','skip the rest','next turn'],['\\bi\\b','\\bcontinue\\b']);
meaning("for i, val in enumerate(['a','b']):",["item's position","its value"],['\\bi\\b','\\bval\\b','enumerate','\\bfor\\b']);
meaning('print(i)',['display the current result'],['\\bi\\b','\\bprint\\b']);
const f=api.semanticFocus(['for loop','if / elif / else','list','break','continue','enumerate()']).join(' | ').toLowerCase();
for(const p of ['repeating an action','choosing what happens','group of values','stopping repetition','skipping one turn','position'])if(!f.includes(p))fail(`Semantic focus missing ${p}: ${f}`);
for(const p of ['for loop','if / elif / else','enumerate()'])if(f.includes(p))fail(`Semantic focus leaks syntax ${p}: ${f}`);

for(const marker of ['data-csai-plain-english','What this code means in plain English','guideWithCodeMeaning','plainEnglishForCode','What to think about:'])if(!source.includes(marker))fail(`UI missing ${marker}`);
if(source.includes('Relevant / expected concepts:'))fail('UI must not show raw syntax/tool chips as guidance');
if(source.includes('csai-guide-plain')&&source.includes('cursor:pointer'))fail('Plain-English/requirement guidance must not be clickable');
console.log('Behavior-first guidance coverage passed:',counts);
