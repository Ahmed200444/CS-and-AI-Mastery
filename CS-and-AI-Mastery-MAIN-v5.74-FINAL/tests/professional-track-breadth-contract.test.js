const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const dir=path.join(root,'assets','course-data');
const files=fs.readdirSync(dir).filter(x=>x.endsWith('.json'));
const courses=new Map(files.map(f=>{const d=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));return[d.id,d];}));
const required=[
  'python','dsa','problem-solving','oop','software-engineering-practice','testing','debugging','git','linux','sql','databases','backend','apis','frontend-dev',
  'system-design','software-architecture','distributed-systems','networking','cloud-computing','docker','kubernetes','cicd','observability','cybersecurity',
  'data-science','data-engineering','ai-ml','deep-learning','pytorch','tensorflow','transformers','llms','rag','ai-agents','mlops','ai-system-design','large-scale-ai','llm-evaluation-testing','reinforcement-learning-post-training','computer-vision','nlp','generative-ai'
];
for(const id of required)assert.ok(courses.has(id),`professional track missing ${id}`);
let lessons=0;
for(const [id,c] of courses){
  assert.ok((c.exercises||[]).length>0,`${id}: needs hands-on exercises`);
  assert.ok((c.projects||[]).length+(c.capstone?1:0)>0,`${id}: needs a project/capstone`);
  for(const l of c.lessons||[]){
    lessons++;
    assert.ok((l.concepts||[]).length>0,`${id}/${l.title}: key ideas missing`);
    assert.ok((l.objectives||[]).length>0,`${id}/${l.title}: objectives missing`);
    assert.ok(String(l.explanation||l.explain||'').trim().length>40,`${id}/${l.title}: explanation too thin`);
  }
  const html=fs.readFileSync(path.join(root,'courses',id+'.html'),'utf8');
  for(const asset of ['study-examples.js','practice-guidance.js','line-by-line-explanations.js','example-learning-tools.js']){
    assert.ok(html.includes(asset),`${id}: missing learning asset ${asset}`);
  }
}
assert.equal(courses.size,62,'course count drift');
assert.equal(lessons,800,'lesson count drift');
function corpus(id){const c=courses.get(id);return JSON.stringify(c).toLowerCase();}
function needs(id,terms){const t=corpus(id);for(const term of terms)assert.ok(t.includes(term.toLowerCase()),`${id}: professional topic missing ${term}`);}
needs('dsa',['big-o','binary search','graphs','dynamic programming']);
needs('software-engineering-practice',['requirements','code review','production','incident']);
needs('system-design',['load balancing','caching','sharding','queues']);
needs('distributed-systems',['replication','consistent hashing','cap theorem','idempotency']);
needs('cybersecurity',['threat modeling','sql injection','authentication','secrets management']);
needs('ai-ml',['train/test','regression','classification','feature engineering','overfitting']);
needs('data-science',['numpy','pandas','descriptive statistics','data quality']);
needs('deep-learning',['gradient','backprop','chain rule','transformer']);
needs('llms',['tokens','context window','instruction tuning','temperature']);
needs('rag',['chunking','embeddings','vector database','grounding']);
needs('ai-agents',['function calling','memory','planning','verification']);
needs('mlops',['model registry','reproducibility','evaluation gate','monitoring']);
needs('llm-evaluation-testing',['evaluation','regression','safety']);
needs('reinforcement-learning-post-training',['reward','mdp','value','policy']);
console.log(`Professional track breadth PASS — 62 courses / ${lessons} lessons include core SWE, production systems, security, and modern AI/ML engineering coverage.`);
