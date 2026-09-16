const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
function assert(cond,msg){if(!cond)throw new Error(msg)}
const courseDir=path.join(ROOT,'courses'),guideDir=path.join(ROOT,'assets','practice-guidance');
const pages=fs.readdirSync(courseDir).filter(x=>x.endsWith('.html')).sort();
assert(pages.length===62,`expected 62 course pages, got ${pages.length}`);
let assetPages=0;
for(const f of pages){const t=fs.readFileSync(path.join(courseDir,f),'utf8');const n=(t.match(/purpose-first-prompts\.js/g)||[]).length;assert(n===1,`${f}: expected purpose-first-prompts.js exactly once, got ${n}`);assetPages++;}
const promptAsset=fs.readFileSync(path.join(ROOT,'assets','purpose-first-prompts.js'),'utf8');
for(const forbidden of ['Question before ','Why this example exists','Company-style ticket:','Your first move:','Definition of done:','data-csai-company-problem'])assert(!promptAsset.includes(forbidden),`concise example layer still contains ${forbidden}`);
assert(promptAsset.includes('Example cards intentionally stay concise'),'purpose-first asset must document concise-example behavior');
const guideAsset=fs.readFileSync(path.join(ROOT,'assets','practice-guidance.js'),'utf8');
for(const needle of ['Question to answer','Why you are doing this','data-csai-purpose-question','data-csai-purpose-why'])assert(guideAsset.includes(needle),`practice guidance renderer missing ${needle}`);
let counts={courses:0,lessons:0,examples:0,exercises:0,projects:0};
const malformed=[];
for(const f of fs.readdirSync(guideDir).filter(x=>x.endsWith('.json')).sort()){
  const d=JSON.parse(fs.readFileSync(path.join(guideDir,f),'utf8'));
  const need=(obj,where)=>{assert(obj&&typeof obj.question==='string'&&obj.question.trim().length>=45,`${where}: missing/weak question`);assert(typeof obj.why==='string'&&obj.why.trim().length>=45,`${where}: missing/weak why`)};
  need(d.course,`${f} course`);counts.courses++;
  for(const [id,meta] of Object.entries(d.lessons||{})){need(meta.practice,`${f} lesson ${id}`);counts.lessons++;for(let i=0;i<(meta.examples||[]).length;i++){need(meta.examples[i],`${f} lesson ${id} example ${i+1}`);counts.examples++;}}
  for(let i=0;i<(d.exercises||[]).length;i++){const e=d.exercises[i],p=e.practice||{};need(p,`${f} exercise ${e.title||i}`);counts.exercises++;const req=(p.requirements||[])[0]||'';if(/^(ordered collections of values|reading requested data|stopping the current repetition early|produce a new collection that produces)/i.test(req.trim()))malformed.push(`${f}: ${e.title}: ${req}`);}
  for(let i=0;i<(d.projects||[]).length;i++){const p=d.projects[i];need(p.practice,`${f} project ${p.title||i}`);counts.projects++;}
}
assert(counts.courses===62,`expected 62 course guidance blocks, got ${counts.courses}`);
assert(counts.lessons===800,`expected 800 lesson guides, got ${counts.lessons}`);
assert(counts.examples===895,`expected 895 native example guides, got ${counts.examples}`);
assert(counts.exercises===794,`expected 794 exercise guides, got ${counts.exercises}`);
assert(counts.projects===271,`expected 271 project guides, got ${counts.projects}`);
assert(malformed.length===0,'malformed exercise descriptions remain:\n'+malformed.join('\n'));
const ps=JSON.parse(fs.readFileSync(path.join(guideDir,'problem-solving.json'),'utf8'));
for(const [id,meta] of Object.entries(ps.lessons||{}))for(const [i,e] of (meta.examples||[]).entries())assert(/inputs|starting information/i.test(e.question)&&/simplest correct approach/i.test(e.question)&&/edge case/i.test(e.question),`problem-solving ${id} example ${i+1}: reasoning question incomplete`);
console.log('Purpose-first description contract passed',counts,'coursePages',assetPages);
