const fs=require('fs');
const path=require('path');
const root=process.cwd(),problems=[];
function read(p){return fs.readFileSync(path.join(root,p),'utf8');}
const example=read('assets/example-learning-tools.js');
const practice=read('assets/practice-publish-completer.js');
const direct=read('assets/exercise-direct-publish.js');
const dual=read('assets/dual-single-editor-publish.js');
const netlify=read('netlify.toml');
const checks=[
 ['example deep explanation',example,/Deep step-by-step explanation/],
 ['Python example runner',example,/async function runPython/],
 ['C++ example runner',example,/async function runCpp\(/],
 ['on-demand C++ compiler',example,/Loading the C\+\+ compiler on demand/],
 ['Emception compiler',example,/createEmception/],
 ['C++ fallback runner',example,/JSCPP/],
 ['example output UI',example,/data-csai-example-output/],
 ['normal beginner C++ for-loop explanation',example,/Normal for loop|Normal for-loop|Normal for loop|Normal for loop|Normal for loop/],
 ['practice main publish guarantee',practice,/data-publish/],
 ['revealed solution publishing',practice,/data-publish-revealed/],
 ['revealed solution editor use',practice,/data-use-revealed/],
 ['Python GitHub folder',practice,/return lang==='cpp'\?'C\+\+':'Python'/],
 ['C++ extension',practice,/lang==='cpp'\?'cpp':'py'/],
 ['Two Sum C++ reveal',practice,/vector<int> twoSum/],
 ['Valid Parentheses C++ reveal',practice,/bool valid\(const string& s\)/],
 ['Binary Search C++ reveal',practice,/int binarySearch\(const vector<int>& nums/],
 ['exact exercise path builder',direct,/function exercisePath\(task,lang\)/],
 ['Dual explicit language buttons',dual,/data-dual-publish-language/]
];
for(const [label,src,re] of checks)if(!re.test(src))problems.push('missing '+label);
const dir=path.join(root,'courses');
if(!fs.existsSync(dir))problems.push('courses directory missing');
else{
 const files=fs.readdirSync(dir).filter(x=>x.endsWith('.html'));
 if(files.length!==54)problems.push(`expected 54 course pages, found ${files.length}`);
 for(const name of files){
   const html=fs.readFileSync(path.join(dir,name),'utf8');
   if(!html.includes('/assets/example-learning-tools.js?v=20260809-1'))problems.push(`${name}: missing example learning tools`);
   if(!html.includes('/assets/practice-publish-completer.js?v=20260809-1'))problems.push(`${name}: missing practice publishing tools`);
 }
}
const syntaxExample=netlify.indexOf('node --check assets/example-learning-tools.js');
const syntaxPractice=netlify.indexOf('node --check assets/practice-publish-completer.js');
const inject=netlify.indexOf('node scripts/inject-example-practice-tools.cjs');
const verify=netlify.indexOf('node scripts/verify-example-practice-tools.cjs');
if(!(syntaxExample>=0&&syntaxPractice>syntaxExample&&inject>syntaxPractice&&verify>inject))problems.push('Netlify build order does not syntax-check, inject, then verify the new tools');
if(problems.length)throw new Error('Example/practice verification failed:\n'+problems.slice(0,120).join('\n'));
console.log('Example/practice verification passed: explanations, real run/output controls, GitHub publishing, revealed-solution publishing, and 54-page injection are wired.');
