const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','line-by-line-explanations.js'),'utf8');
const sandbox={window:{},document:{readyState:'loading',addEventListener(){},getElementById(){return null;}},setTimeout(){return 1;},clearTimeout(){},MutationObserver:function(){this.observe=function(){};},WeakMap,console};
vm.createContext(sandbox);vm.runInContext(src,sandbox);
const api=sandbox.window.CSAILineExplainer;
const weak=/^(Stores `dict\(\)` in|Runs this Python statement|Performs the next|Executes this Python expression\/statement|Executes this C\+\+ statement|Executes this JavaScript\/TypeScript expression|Uses this SQL expression|Uses this selector\/declaration|Configures the next|Explains the next)/i;
const cases=[
 {lang:'python',code:`d = dict()\nd['name'] = 'Ada'\nprint('name' in d)\nprint('age' in d)`},
 {lang:'python',code:`counts = {}\nfor word in 'red blue red'.split():\n    counts[word] = counts.get(word, 0) + 1\nprint(counts)`},
 {lang:'python',code:`original = [["A"], ["B"]]\ncopied = original.copy()\noriginal[0].append("changed")`},
 {lang:'python',code:`a, b = 6, 3\nprint(a & b)\nprint(a | b)\nprint(a ^ b)\nprint(a << 1)`},
 {lang:'cpp',code:`long long factorial(int n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}`},
 {lang:'javascript',code:`function Counter() {\n  const [count, setCount] = useState(0);\n  return <button>{count}</button>;\n}`},
 {lang:'yaml',code:`apiVersion: apps/v1\nkind: Deployment\nspec:\n  selector: {matchLabels: {app: demo}}`},
 {lang:'css',code:`.row { display: flex; gap: 12px; }`},
 {lang:'dockerfile',code:`FROM node:20 AS build\nRUN npm install\nRUN npm run build`}
];
for(const c of cases){
 const inferred=api.inferLanguage(c.code,'',null);assert.equal(inferred,c.lang,`wrong language inference for ${c.lang}`);
 for(const row of api.explain(c.code,inferred)){
  assert.ok(row.purpose&&!weak.test(row.purpose),`${c.lang}: weak explanation: ${row.purpose}`);
  assert.ok(row.purpose.split(/\s+/).length<=28,`${c.lang}: explanation too long: ${row.purpose}`);
 }
}
console.log('Meaningful explanation representative contract: PASS');
