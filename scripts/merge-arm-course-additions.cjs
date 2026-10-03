'use strict';
const fs=require('fs');
const path=require('path');
const root=process.cwd();
const sourcePath=path.join(root,'assets','coursedata-source.json');
const armPath=path.join(root,'assets','arm-course-additions.json');
const matlabPath=path.join(root,'assets','matlab-course-addition.json');
const indexPath=path.join(root,'index.html');
const guideIndexPath=path.join(root,'assets','practice-guidance-index.json');
const guideDir=path.join(root,'assets','practice-guidance');

const base=JSON.parse(fs.readFileSync(sourcePath,'utf8'));
const arm=JSON.parse(fs.readFileSync(armPath,'utf8'));
const matlab=JSON.parse(fs.readFileSync(matlabPath,'utf8'));
if(!Array.isArray(base)||!Array.isArray(arm)||arm.length!==2||!matlab||matlab.id!=='matlab-engineering'){
  throw new Error('University course additions are invalid');
}
const additions=arm.concat([matlab]);
const ids=new Set(additions.map(c=>c.id));
const merged=base.filter(c=>!ids.has(c.id)).concat(additions);
const lessons=merged.reduce((n,c)=>n+(Array.isArray(c.lessons)?c.lessons.length:0),0);
if(merged.length!==65)throw new Error('Expected 65 courses after university-course merge, found '+merged.length);
if(lessons!==832)throw new Error('Expected 832 lessons after university-course merge, found '+lessons);
const json=JSON.stringify(merged);
fs.writeFileSync(sourcePath,json,'utf8');

let html=fs.readFileSync(indexPath,'utf8');
const re=/(<script\b[^>]*\bid=["']coursedata["'][^>]*>)([\s\S]*?)(<\/script>)/i;
if(!re.test(html))throw new Error('index coursedata island missing');
html=html.replace(re,(all,a,b,c)=>a+json.replace(/<\/script/gi,'<\\/script')+c);
fs.writeFileSync(indexPath,html,'utf8');

function arr(v){return Array.isArray(v)?v:[]}
function brief(title,kind,tools){
  const requirements=kind==='course'?[
    'Apply '+title+' to a fresh problem rather than only recognizing a completed example.',
    'Explain the relevant data, operator, control-flow, plotting, register, memory, flag, timing, or architecture behavior in plain language.',
    'Predict the expected result before relying on a supplied answer or simulator.',
    'Check a normal case and an important boundary or failure case.',
    'Choose the relevant operation, instruction, rule, or control structure deliberately.',
    'Verify the final observable result with explicit evidence.',
    'State assumptions and tool-specific syntax clearly.'
  ]:kind==='example'?[
    'Predict the important output, value, state, control-flow path, or visual result before checking it.',
    'Explain each important operation in plain language.',
    'Change one meaningful input, operand, address, range, or condition and predict the new result.',
    'Identify one relevant edge case or common failure.',
    'Create a separate small example using the same idea with different values.'
  ]:kind==='project'?[
    'Restate the required behavior before implementation.',
    'Satisfy every listed project requirement.',
    'Verify normal behavior and at least one boundary or failure case.',
    'Document assumptions, evidence, run steps, and limitations clearly.'
  ]:[
    'State what the task is asking in plain language.',
    'Choose the relevant command, operator, instruction, rule, or control structure.',
    'Work through the expected state change, value, or execution path.',
    'Verify the final result against the stated requirement.',
    'Explain why the result is correct rather than only giving the answer.'
  ];
  const labels={course:'Course requirements — what you must be able to do',lesson:'Lesson requirements — what you must be able to do',example:'Example requirements — what you must do',exercise:'Exercise question — what you must do',project:'Project question — what your finished work must do',quiz:'Knowledge-check requirements — what you must justify'};
  return {
    title:labels[kind]||labels.lesson,
    intro:'Use this as an exam-style requirement brief. It defines competent work without giving a finished solution.',
    plainEnglishTitle:'In plain English',
    plainEnglish:['Understand '+title+', predict the behavior, and transfer the idea to a fresh case.','Do not memorize a finished trace or example; explain why each important step happens.'],
    focus:['concept behavior','correct syntax or rule choice','verification'],
    tools:[...new Set(arr(tools))].slice(0,10),
    requirements,steps:requirements.slice(),
    checkpoint:'Move on when you can satisfy these requirements with a fresh example without copying the supplied one.',
    question:'What should happen in '+title+', and what evidence would prove it?',
    why:'This item exists so you can apply '+title+' in engineering work rather than memorize syntax.',
    workScenario:'An engineering or low-level systems task depends on '+title+'.',
    workTask:'Define the desired result, choose the relevant construct, predict the behavior, then verify it.',
    engineerProcess:['Restate the requirement.','Identify inputs and expected outputs/state.','Choose the relevant construct.','Predict the result.','Check a boundary case.','Document the evidence.'],
    acceptanceCriteria:['The required observable result is correct.','The chosen construct fits the task.','A repeatable calculation, trace, or plot verifies the behavior.']
  };
}
function makeGuide(course){
  const g={schemaVersion:2,purpose:'Exam-style requirement briefs for every course learning item; no finished solutions or answer keys are stored here.',id:course.id,title:course.title,course:brief(course.title,'course',[course.id==='matlab-engineering'?'MATLAB':'ARM','engineering']),lessons:{}};
  for(const l of arr(course.lessons)){
    g.lessons[l.id]={title:l.title,practice:brief(l.title,'lesson',l.concepts),examples:arr(l.examples).map((_,i)=>brief(l.title+' example '+(i+1),'example',l.concepts))};
  }
  g.exercises=arr(course.exercises).map(x=>({id:x.id,title:x.title,practice:brief(x.title,'exercise',(arr(course.lessons).find(l=>l.id===x.lessonId)||{}).concepts||[])}));
  const projects=arr(course.projects).concat(course.capstone?[course.capstone]:[]);
  g.projects=projects.map((x,i)=>({id:x.id||('project-'+(i+1)),title:x.title,practice:brief(x.title,'project',[course.id==='matlab-engineering'?'MATLAB':'ARM','verification','README'])}));
  g.quiz=arr(course.quiz).map((x,i)=>({id:'quiz-'+(i+1),title:x.q,practice:brief(x.q,'quiz',[course.id==='matlab-engineering'?'MATLAB':'ARM','reasoning'])}));
  return g;
}
fs.mkdirSync(guideDir,{recursive:true});
for(const c of additions){
  fs.writeFileSync(path.join(guideDir,c.id+'.json'),JSON.stringify(makeGuide(c),null,2)+'\n','utf8');
}

const guideIndex=JSON.parse(fs.readFileSync(guideIndexPath,'utf8'));
guideIndex.courses=arr(guideIndex.courses).filter(x=>!ids.has(x.id));
for(const c of additions){
  const projects=arr(c.projects).length+(c.capstone?1:0);
  guideIndex.courses.push({id:c.id,title:c.title,file:'practice-guidance/'+c.id+'.json',counts:{lessons:arr(c.lessons).length,examples:arr(c.lessons).reduce((n,l)=>n+arr(l.examples).length,0),exercises:arr(c.exercises).length,projects,quiz:arr(c.quiz).length}});
}
guideIndex.courses.sort((a,b)=>String(a.id).localeCompare(String(b.id)));
fs.writeFileSync(guideIndexPath,JSON.stringify(guideIndex),'utf8');

console.log('Merged university courses: 65 courses / 832 lessons.');
