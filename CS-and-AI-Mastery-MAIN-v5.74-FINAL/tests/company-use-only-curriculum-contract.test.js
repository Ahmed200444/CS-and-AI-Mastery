const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'assets','coursedata-source.json'),'utf8'));
assert.strictEqual(data.length,62,'expected all 62 courses');
for(const c of data){
  assert.ok(c.careerApplications || (Array.isArray(c.industryUsage)&&c.industryUsage.length),`course ${c.id} needs explicit company/career-use justification`);
}
assert.ok(!data.some(c=>/^(math|mathematics)$/i.test(String(c.id||''))||/^(math|mathematics)$/i.test(String(c.title||''))),'do not add a standalone theory-only math course');
function lesson(cid,lid){const c=data.find(x=>x.id===cid);assert(c,`missing course ${cid}`);const l=(c.lessons||[]).find(x=>x.id===lid);assert(l,`missing lesson ${cid}/${lid}`);return l;}
function hasAll(l,need){const text=[...(l.concepts||[]),l.explanation||'',l.careerRelevance||''].join(' ').toLowerCase();for(const n of need)assert.ok(text.includes(n.toLowerCase()),`${l.id} missing practical concept ${n}`);}
hasAll(lesson('ai-ml','ml-regression'),['feature vectors','weighted sums','dot product']);
hasAll(lesson('ai-ml','ml-metrics'),['probability intuition','sampling variability']);
hasAll(lesson('deep-learning','dl-neurons'),['matrix multiplication','tensor shapes']);
hasAll(lesson('deep-learning','dl-backprop'),['gradient intuition','partial derivative intuition','chain rule intuition']);
hasAll(lesson('data-science','ds-stats'),['standard deviation','sampling intuition','distribution shape']);
hasAll(lesson('transformers','tf-qkv'),['dot product intuition','matrix multiplication','tensor shapes']);
const policy=fs.readFileSync(path.join(root,'COMPANY_USE_ONLY_POLICY.md'),'utf8');
assert.ok(/build, debug, test, evaluate, design, deploy, operate, secure, optimize/i.test(policy),'policy must define concrete company tasks');
assert.ok(/No symbolic-calculus drill track/i.test(policy),'calculus scope must stay practical');
for(const [cid,lid] of [['ai-ml','ml-regression'],['ai-ml','ml-metrics'],['ai-ml','ml-overfitting'],['deep-learning','dl-neurons'],['deep-learning','dl-backprop'],['data-science','ds-stats'],['transformers','tf-qkv'],['transformers','tf-selfattention']]){
 const html=fs.readFileSync(path.join(root,'courses',cid+'.html'),'utf8');
 const pos=html.indexOf(`data-lesson="${lid}"`); assert.ok(pos>=0,`static page missing ${cid}/${lid}`);
 const end=html.indexOf('</details>',pos); const chunk=html.slice(pos,end);
 assert.ok(chunk.includes('Company-use math'),`visible company-use math note missing ${cid}/${lid}`);
}
const study=fs.readFileSync(path.join(root,'assets','study-examples.js'),'utf8');
for(const marker of ['feature vector|weighted sum|dot product','standard deviation|variance|sampling variability','gradient intuition|partial derivative intuition|chain rule intuition']) assert.ok(study.includes(marker),`study examples missing practical math guide: ${marker}`);
console.log('PASS: company-use-only curriculum gate, practical ML math scope, 62-course explicit relevance');
