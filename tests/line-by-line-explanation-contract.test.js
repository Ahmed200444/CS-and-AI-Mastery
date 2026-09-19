const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const assetPath=path.join(root,'assets','line-by-line-explanations.js');
const source=fs.readFileSync(assetPath,'utf8');
const toolsSource=fs.readFileSync(path.join(root,'assets','example-learning-tools.js'),'utf8');

for(const marker of ['Line-by-line explanation','<summary>Syntax</summary>','data-csai-line-explanation','teachingPurposeFor','dedupeOwned','data-csai-line-covered'])
  assert.ok(source.includes(marker),`missing teaching explainer marker: ${marker}`);
assert.ok(source.includes('textarea[data-project-editor]'),'project editors must use the universal explainer');
assert.ok(source.includes('textarea.oa-editor[data-editor]'),'assessment code editors must use the universal explainer');
assert.ok(!source.includes('Each line has one short explanation.'),'old duplicate intro should stay removed');
assert.ok(!source.includes('Explain every line ('),'old duplicate heading should stay removed');
assert.ok(!/class="csai-line-explanation" open/.test(source),'line-by-line control should start collapsed');
assert.ok(!toolsSource.includes('function explanationHtml('),'only one production line-explanation generator may exist');
assert.ok(toolsSource.includes('window.CSAILineExplainer.refresh(pre)'),'other tools should delegate to the universal explainer');

const pages=fs.readdirSync(path.join(root,'courses')).filter(n=>n.endsWith('.html'));
assert.equal(pages.length,62,'expected 62 generated course pages including compatibility route');
for(const page of pages){
  const html=fs.readFileSync(path.join(root,'courses',page),'utf8');
  const line=html.indexOf('line-by-line-explanations.js');
  assert.ok(line>=0,`${page} must load the universal line-by-line explainer`);
  const tools=html.indexOf('example-learning-tools.js');
  if(tools>=0)assert.ok(line<tools,`${page} must load explainer before example-learning-tools`);
}

const sandbox={window:{},document:{readyState:'loading',addEventListener(){},getElementById(){return null;}},setTimeout(){return 1;},clearTimeout(){},MutationObserver:function(){this.observe=function(){};},WeakMap,console};
vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'line-by-line-explanations.js'});
const api=sandbox.window.CSAILineExplainer;
assert.ok(api&&typeof api.explain==='function','line explainer API should be available');

// Exact regression for the user's dictionary screenshot: explain meaning/effect, never restate syntax.
const dictCode=`d = dict()          # {}\nd['name'] = 'Ada'\nprint('name' in d)   # True\nprint('age' in d)    # False -- no error raised`;
const d=api.explain(dictCode,'python');
assert.deepEqual(Array.from(d,r=>r.purpose),[
  'Creates an empty dictionary in `d`. Dictionaries store values by keys.',
  'Adds or updates key `name` in `d` with value `Ada`.',
  'Checks whether `name` is a key in `d`. It is, so this prints `True`.',
  'Checks whether `age` is a key in `d`. It is not, so this prints `False` without an error.'
]);

const packageCheck=api.explain(`def solution(packageCodes):
    count = 0
    for code in packageCodes:
        if code % 3 == 0 and str(code).count("7") >= 2:
            count += 1
    return count`,'python');
assert.match(packageCheck[3].purpose,/divisible by.*3/i);
assert.match(packageCheck[3].purpose,/7.*at least 2 times|at least 2 times.*7/i);
assert(!packageCheck[3].purpose.includes('…'),'compound-condition explanation must not truncate the important condition');

const enumCheck=api.explain(`for i, num in enumerate(nums):
    print(i, num)`,'python');
assert.match(enumCheck[0].purpose,/index/i);
assert.match(enumCheck[0].purpose,/value/i);

const binaryCheck=api.explain(`def binary_search(nums, target):
    low = 0
    high = len(nums) - 1
    while low <= high:
        mid = (low + high) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1`,'python');
assert.match(binaryCheck[4].purpose,/middle index/i);
assert.match(binaryCheck[8].purpose,/discarding the lower half/i);
assert.match(binaryCheck[10].purpose,/discarding the upper half/i);
assert.match(binaryCheck[11].purpose,/not found/i);

const overlapCheck=api.explain(`if start < meeting[1] and start + length > meeting[0]:
    free = False`,'python');
assert.match(overlapCheck[0].purpose,/overlaps/i);

const counts=api.explain(`counts = {}\nfor word in 'red blue red'.split():\n    counts[word] = counts.get(word, 0) + 1\nprint(counts)`,'python');
assert.match(counts[0].purpose,/empty dictionary/i);
assert.match(counts[1].purpose,/each item|one at a time/i);
assert.match(counts[2].purpose,/current count/i);
assert.match(counts[2].purpose,/adds 1/i);

const shallow=api.explain(`original = [1, 2, 3]\ncopied = original.copy()\noriginal.append(4)`,'python');
assert.match(shallow[1].purpose,/shallow copy|separate outer/i);

const bitwise=api.explain(`a, b = 6, 3\nprint(a & b)\nprint(a | b)\nprint(a ^ b)\nprint(a << 1)`,'python');
assert.match(bitwise[1].purpose,/Bitwise AND/i);
assert.match(bitwise[2].purpose,/Bitwise OR/i);
assert.match(bitwise[3].purpose,/Bitwise XOR/i);
assert.match(bitwise[4].purpose,/Shifts the bits/i);

const formats={
  javascript:`function Counter() {\n  const [count, setCount] = useState(0);\n  return <button>{count}</button>;\n}`,
  cpp:`long long factorial(int n) {\n  if (n <= 1) return 1;\n  else if (n == 2) return 2;\n  return n * factorial(n - 1);\n}`,
  sql:`SELECT country, COUNT(*) AS customer_count\nFROM customers\nGROUP BY country\nORDER BY customer_count DESC;`,
  yaml:`apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: demo\nspec:\n  selector: {matchLabels: {app: demo}}`,
  css:`.row { display: flex; gap: 12px; }`,
  dockerfile:`# Stage 1: build\nFROM node:20 AS build\nRUN npm install\nRUN npm run build`,
  shell:`git status\ngit add src/app.py\ngit commit -m "Add validation"`,
  html:`<button id="save">Save</button>\n<p id="status">Not saved</p>`
};
for(const [expected,code] of Object.entries(formats)){
  const inferred=api.inferLanguage(code,'',null);
  assert.equal(inferred,expected,`language detection should recognize ${expected}`);
  const rows=api.explain(code,inferred);
  assert.equal(rows.length,code.split(/\r?\n/).length,`${expected}: every source line must have one record`);
  for(const row of rows){
    assert.ok(row.purpose,`${expected}: purpose missing on line ${row.number}`);
    assert.ok(Array.isArray(row.syntax)&&row.syntax.length,`${expected}: syntax help missing on line ${row.number}`);
    if(expected!=='text')assert.ok(row.purpose.split(/\s+/).length<=28,`${expected}: explanation should stay quick: ${row.purpose}`);
  }
}
assert.match(api.explain(formats.javascript,'javascript')[1].purpose,/React state/i);
assert.match(api.explain(formats.cpp,'cpp')[0].purpose,/Defines function `factorial/i);
assert.match(api.explain(formats.yaml,'yaml')[0].purpose,/YAML field `apiVersion`/i);
assert.match(api.explain(formats.css,'css')[0].purpose,/flex layout/i);
assert.match(api.explain(formats.dockerfile,'dockerfile')[2].purpose,/JavaScript dependencies/i);

function decodeHtml(s){return String(s).replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));}
const banned=/^(Stores `dict\(\)` in|Runs this Python statement|Performs the next|Executes this Python expression\/statement|Executes this C\+\+ statement|Executes this JavaScript\/TypeScript expression|Uses this SQL expression|Uses this selector\/declaration|Configures the next|Explains the next)/i;
let nativeExamples=0,nativeLines=0,maxExecutableWords=0;
for(const page of pages){
  const html=fs.readFileSync(path.join(root,'courses',page),'utf8');
  const re=/<pre\b[^>]*class="[^"]*\bcode\b[^"]*"[^>]*(?:data-example-audit="(?:candidate|reference)"|data-reference-only="true")[^>]*>([\s\S]*?)<\/pre>/g;
  let m;
  while((m=re.exec(html))){
    const code=decodeHtml(m[1]),lang=api.inferLanguage(code,'',null),rows=api.explain(code,lang),sourceLines=code.split(/\r?\n/);
    nativeExamples++;nativeLines+=sourceLines.length;
    assert.equal(rows.length,sourceLines.length,`${page}: every native source line must have one explanation record`);
    for(const row of rows){
      assert.ok(row.purpose,`${page}: missing purpose for ${row.code}`);
      assert.ok(Array.isArray(row.syntax)&&row.syntax.length,`${page}: missing syntax help for ${row.code}`);
      assert.ok(!banned.test(row.purpose),`${page}: shallow/generic explanation returned: ${row.purpose}`);
      if(lang!=='text'){
        const words=row.purpose.trim().split(/\s+/).length;
        maxExecutableWords=Math.max(maxExecutableWords,words);
        assert.ok(words<=28,`${page}: executable-line explanation too long (${words}): ${row.purpose}`);
      }
    }
  }
}
const coveragePath=path.join(root,'EXAMPLE_COVERAGE_QA_v5.75.json');
if(fs.existsSync(coveragePath)){
  const coverage=JSON.parse(fs.readFileSync(coveragePath,'utf8'));
  assert.equal(nativeExamples,coverage.staticExamplesAfter,'every enriched native course example must be audited');
}else{
  assert.ok(nativeExamples>=895,`native example coverage unexpectedly dropped to ${nativeExamples}`);
}
assert.ok(nativeLines>=4643,`native example source-line coverage unexpectedly dropped to ${nativeLines}`);
console.log(`Meaningful line-by-line contract: PASS across ${pages.length} pages, ${nativeExamples} native examples / ${nativeLines} lines; max executable explanation ${maxExecutableWords} words.`);
