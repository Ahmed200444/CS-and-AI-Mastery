const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
function assert(cond,msg){if(!cond)throw new Error(msg)}
const guideDir=path.join(ROOT,'assets','practice-guidance');
const files=fs.readdirSync(guideDir).filter(x=>x.endsWith('.json')).sort();
assert(files.length===62,`expected 62 guidance files, got ${files.length}`);
let counts={courses:0,lessons:0,examples:0,exercises:0,projects:0};
const weak=[];
function check(g,where){
  assert(g&&typeof g==='object',`${where}: missing guide`);
  assert(typeof g.workScenario==='string'&&g.workScenario.trim().length>=90,`${where}: weak/missing company scenario`);
  assert(typeof g.workTask==='string'&&g.workTask.trim().length>=80,`${where}: weak/missing work assignment`);
  assert(Array.isArray(g.engineerProcess)&&g.engineerProcess.length===6,`${where}: engineer workflow must have 6 steps`);
  assert(g.engineerProcess.every(x=>typeof x==='string'&&x.trim().length>=60),`${where}: weak engineer workflow step`);
  assert(Array.isArray(g.acceptanceCriteria)&&g.acceptanceCriteria.length>=3,`${where}: missing definition of done`);
  assert(g.acceptanceCriteria.every(x=>typeof x==='string'&&x.trim().length>=45),`${where}: weak acceptance criterion`);
  const joined=[g.workScenario,g.workTask,...g.engineerProcess,...g.acceptanceCriteria].join(' ').toLowerCase();
  if(!joined.includes('success')) weak.push(`${where}: missing success framing`);
  if(!/(verify|evidence|test|demonstrat|check)/.test(joined)) weak.push(`${where}: missing verification/evidence framing`);
}
for(const f of files){
  const d=JSON.parse(fs.readFileSync(path.join(guideDir,f),'utf8'));
  check(d.course,`${f} course`);counts.courses++;
  for(const [id,m] of Object.entries(d.lessons||{})){
    check(m.practice,`${f} lesson ${id}`);counts.lessons++;
    for(let i=0;i<(m.examples||[]).length;i++){check(m.examples[i],`${f} lesson ${id} example ${i+1}`);counts.examples++;}
  }
  for(let i=0;i<(d.exercises||[]).length;i++){check((d.exercises[i]||{}).practice,`${f} exercise ${i+1}`);counts.exercises++;}
  for(let i=0;i<(d.projects||[]).length;i++){check((d.projects[i]||{}).practice,`${f} project ${i+1}`);counts.projects++;}
}
assert(counts.courses===62,`course count drift ${counts.courses}`);
assert(counts.lessons===800,`lesson count drift ${counts.lessons}`);
assert(counts.examples===895,`native example count drift ${counts.examples}`);
assert(counts.exercises===794,`exercise count drift ${counts.exercises}`);
assert(counts.projects===271,`project count drift ${counts.projects}`);
assert(weak.length===0,'weak company-problem guidance:\n'+weak.slice(0,30).join('\n'));

const renderer=fs.readFileSync(path.join(ROOT,'assets','practice-guidance.js'),'utf8');
for(const needle of ['Company-style ticket','How an engineer should approach it','Definition of done','data-csai-company-ticket','data-csai-engineer-workflow','data-csai-definition-of-done'])assert(renderer.includes(needle),`renderer missing ${needle}`);
const exampleAsset=fs.readFileSync(path.join(ROOT,'assets','purpose-first-prompts.js'),'utf8');
for(const forbidden of ['Company problem before ','Company-style ticket:','Your first move:','Definition of done:','data-csai-company-problem'])assert(!exampleAsset.includes(forbidden),`example cards should not render company framing: ${forbidden}`);
for(const api of ['companyTicketForExample','firstMoveForCourse','definitionOfDoneForCourse'])assert(exampleAsset.includes(api),`compatibility API missing ${api}`);
const ps=JSON.parse(fs.readFileSync(path.join(guideDir,'problem-solving.json'),'utf8'));
for(const [id,m] of Object.entries(ps.lessons||{})){
  assert(/inputs, outputs, constraints, examples, and acceptance criteria/i.test((m.practice.engineerProcess||[])[1]),`problem-solving ${id}: ticket decomposition workflow missing`);
  for(let i=0;i<(m.examples||[]).length;i++) assert(/ticket/i.test(m.examples[i].workScenario)&&/implementation/i.test(m.examples[i].workScenario),`problem-solving ${id} example ${i+1}: work ticket framing missing`);
}
console.log('Company problem-solving contract passed',counts);
