const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets','line-by-line-explanations.js'),'utf8');

for(const marker of [
  'Code with comments',
  'data-csai-commented-code-host',
  'commentedCode:commentedCode',
  '20260919-v575-inline-comments'
]) assert.ok(source.includes(marker),'missing inline-comment learning-view marker: '+marker);

const sandbox={window:{},document:{readyState:'loading',addEventListener(){},getElementById(){return null;}},setTimeout(){return 1;},clearTimeout(){},MutationObserver:function(){this.observe=function(){};},WeakMap,console};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'line-by-line-explanations.js'});
const api=sandbox.window.CSAILineExplainer;
assert.ok(api&&typeof api.commentedCode==='function','commented-code API should be available');

const pythonSource='def linear_search(nums, target):\n    for i, num in enumerate(nums):\n        if num == target:\n            return i\n    return -1';
const pythonLearning=api.commentedCode(pythonSource,'python');
assert.equal(pythonSource,'def linear_search(nums, target):\n    for i, num in enumerate(nums):\n        if num == target:\n            return i\n    return -1','clean source must stay unchanged');
assert.equal(pythonLearning.split(/\r?\n/).length,pythonSource.split(/\r?\n/).length,'learning view must preserve one output row per source line');
for(const line of pythonLearning.split(/\r?\n/))assert.match(line,/\s#\s.+$/,'every nonblank Python line should end with an explanation comment');
assert.match(api.commentedCode('SELECT id\nFROM users;','sql'),/\s--\s/,'SQL learning view should use SQL comments');
assert.match(api.commentedCode('int x = 1;','cpp'),/\s\/\/\s/,'C++ learning view should use // comments');
assert.match(api.commentedCode('<button>Save<\/button>','html'),/<!--.+-->/,'HTML learning view should use HTML comments');
assert.match(api.commentedCode('.row { display: flex; }','css'),/\/\*.+\*\//,'CSS learning view should use block comments');
assert.match(api.commentedCodeHtml('x = 1','python'),/Learning view:/,'commented view must say it is for learning rather than replacing the runnable editor');

console.log('Inline code comments v5.75 contract: PASS');
