const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','line-by-line-explanations.js'),'utf8');
const sandbox={window:{},document:{readyState:'loading',addEventListener(){},getElementById(){return null;}},setTimeout(){return 1;},clearTimeout(){},MutationObserver:function(){this.observe=function(){};},WeakMap,console};
vm.createContext(sandbox);vm.runInContext(src,sandbox,{filename:'line-by-line-explanations.js'});
const api=sandbox.window.CSAILineExplainer;
assert.equal(api.version,'20260919-v577-inline-editor-comments');
assert.equal(typeof api.syntaxUsedEntries,'function');
assert.equal(typeof api.syntaxUsedHtml,'function');

function names(code,lang='python'){return Array.from(api.syntaxUsedEntries(code,lang),x=>x.name);}
const cacheCode=`addresses = [0, 4, 8, 16, 0, 4]\nline_size = 4\nsets = 4\nprint([((address // line_size) % sets) for address in addresses])`;
const cacheEntries=Array.from(api.syntaxUsedEntries(cacheCode,'python'));
assert.ok(cacheEntries.some(x=>x.name==='List comprehension'),'cache example must identify list comprehension');
assert.ok(cacheEntries.some(x=>x.name==='Floor division `//`'),'cache example must identify floor division');
assert.ok(cacheEntries.some(x=>x.name==='Modulo `%`'),'cache example must identify modulo');
assert.ok(!cacheEntries.some(x=>x.name==='Generator expression'),'square-bracket list comprehension must not be called a generator expression');
for(const x of cacheEntries){
  assert.ok(x.what&&x.syntax&&x.used&&x.why,`complete syntax teaching fields required for ${x.name}`);
  assert.ok(/used here|example|code|calculation|calls|loops|uses/i.test(x.used+' '+x.why),`why/how must be example-specific for ${x.name}`);
}

const generator=`nums = [1, 2, 3]\ntotal = sum(n * n for n in nums)\nprint(total)`;
assert.ok(names(generator).includes('Generator expression'),'parenthesized comprehension inside sum must be a generator expression');
assert.ok(!names(generator).includes('List comprehension'),'generator expression must not be mislabeled list comprehension');

const strings=`parts = ["learn", "practice", "build"]\ntext = " | ".join(parts)\nclean = text.strip()\nprint(clean)`;
const stringNames=names(strings);
assert.ok(stringNames.includes('`join()`'),'join syntax must be taught when present');
assert.ok(stringNames.includes('`strip()`'),'strip syntax must be taught when present');
assert.ok(!stringNames.includes('`set()`'),'syntax that is absent must not be taught');

const pages=fs.readdirSync(path.join(root,'courses')).filter(x=>x.endsWith('.html'));
assert.equal(pages.length,62);
for(const page of pages){
  const html=fs.readFileSync(path.join(root,'courses',page),'utf8');
  assert.ok(html.includes('line-by-line-explanations.js?v='),`${page}: versioned syntax explainer cache key missing`);
}
assert.ok(fs.readFileSync(path.join(root,'index.html'),'utf8').includes('line-by-line-explanations.js?v='));
console.log(`Syntax-used v5.67 contract: PASS across ${pages.length} courses.`);
