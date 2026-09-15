const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const dataDir=path.join(root,'assets','course-data');
const files=fs.readdirSync(dataDir).filter(f=>f.endsWith('.json')).sort();
assert.equal(files.length,62,'expected all 62 courses');
function norm(v){var raw=String(v||'').toLowerCase().trim();var words=raw.replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();return words||raw.replace(/\s+/g,' ');}
const study=fs.readFileSync(path.join(root,'assets','study-examples.js'),'utf8');
assert.ok(study.includes('v5.47 KHDA-benchmarked company-use professional-readiness override'),'professional audit layer missing');
assert.ok(study.includes('data-concept-example="true"'),'concept examples need an explicit runtime marker');
assert.ok(study.includes('What the program does'),'professional examples must use the concise visible description');
let runnable=study.replace(/\}\)\(\);\s*$/,"globalThis.__professionalAudit={professionalScenario,professionalBehavior,shouldGenerateConceptCode};})();");
const sandbox={document:{readyState:'loading',addEventListener(){},getElementById(){return null;}},location:{pathname:'/courses/dsa.html'},window:{},setTimeout(){},clearTimeout(){},MutationObserver:function(){this.observe=function(){}},console};
vm.createContext(sandbox);vm.runInContext(runnable,sandbox);
const api=sandbox.__professionalAudit;
assert.ok(api&&typeof api.professionalScenario==='function');
let lessons=0,concepts=0,genericFallbacks=0,tooShort=0;
const bad=[];
for(const file of files){
  const course=JSON.parse(fs.readFileSync(path.join(dataDir,file),'utf8'));
  for(const lesson of course.lessons||[]){
    lessons++;
    const seen=new Set();
    const cs=(lesson.concepts||[]).filter(c=>{const k=norm(c);if(!k||seen.has(k))return false;seen.add(k);return true;});
    for(let i=0;i<cs.length;i++){
      const concept=cs[i];concepts++;
      const spec=api.professionalScenario(course.id,lesson.title,concept,i);
      const example=String(spec&&spec.example||'');
      const check=String(spec&&spec.check||'');
      if(example.startsWith('In the “')){genericFallbacks++;bad.push(`${course.id}/${lesson.title}/${concept}: generic fallback`);}
      if(!example.includes('Practice move:'))bad.push(`${course.id}/${lesson.title}/${concept}: missing practice move`);
      if(example.length<90||check.length<60){tooShort++;bad.push(`${course.id}/${lesson.title}/${concept}: too short (${example.length}/${check.length})`);}
      if(/Use this idea in a small new situation|Create a concrete input, trace the important state|^concept\s*=/i.test(example)){bad.push(`${course.id}/${lesson.title}/${concept}: old generic text`);}
      assert.ok(api.professionalBehavior(course.id,lesson.title,concept).length>=55,`${course.id}/${lesson.title}/${concept}: behavior brief too weak`);
    }
  }
}

function representative(course,title,concept,must,ban=[]){
  const spec=api.professionalScenario(course,title,concept,0),t=(spec.example+' '+spec.check).toLowerCase();
  for(const p of must)assert.ok(t.includes(p.toLowerCase()),`${course}/${concept}: missing ${p}`);
  for(const p of ban)assert.ok(!t.includes(p.toLowerCase()),`${course}/${concept}: wrong-domain phrase ${p}`);
}
representative('debugging','Reading tracebacks & stack traces','stack trace',['test fails','reproducible evidence'],['most recently added item']);
representative('cybersecurity','Cryptography basics: hashing & encryption','hashing (one-way)',['password','one-way'],['membership checks']);
representative('pytorch','Autograd: automatic differentiation','computation graph',['tiny network','gradients'],['service map']);
representative('llms','Inference & decoding: greedy, sampling & temperature','greedy decoding',['prompt','decoding'],['best allowed local choice']);
representative('databases','B+ trees & LSM trees: how storage indexes work','B+ tree',['one million orders','lookup'],['parent to child']);
representative('distributed-systems','Partitioning & consistent hashing','consistent hashing',['database nodes','keys'],['membership checks']);
representative('ai-agents','Tool use & function calling','tool definition',['structured tool request','actual code'],[]);
representative('software-engineering-practice','Design docs, ADRs & practical UML','sequence diagram',['checkout','time order','failure'],['domain types']);
representative('software-engineering-practice','Design docs, ADRs & practical UML','state diagram',['order','invalid transition','lifecycle'],[]);

assert.equal(lessons,800,'lesson count drift');
assert.equal(concepts,3427,'concept count drift including symbol-only concepts');
assert.equal(genericFallbacks,0,`generic course fallback reached ${genericFallbacks} concepts\n${bad.slice(0,20).join('\n')}`);
assert.equal(tooShort,0,`professional examples/checks too short\n${bad.slice(0,20).join('\n')}`);
assert.equal(bad.length,0,`professional concept audit found problems\n${bad.slice(0,30).join('\n')}`);
console.log(`Professional concept-example audit PASS — ${lessons} lessons / ${concepts} normalized key ideas each have a concrete course-appropriate example and success check.`);
