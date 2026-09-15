const fs=require('fs');
const path=require('path');
const file=path.join(process.cwd(),'assets','project-readme-layer.js');
if(!fs.existsSync(file))throw new Error('project-readme-layer.js is missing');
const src=fs.readFileSync(file,'utf8');
const required=[
  "b.textContent='Smart README'",
  'function detectSymbols(code,lang)',
  'function latestOutput(card)',
  'function runCommand(d)',
  'function isCourseCheckOutput(text)',
  '## Implementation snapshot',
  '## Architecture',
  '## How to run',
  '## Validation',
  '## Runtime result',
  '## Engineering decisions',
  '## Next improvements',
  "readmePath=folder+'/README.md'",
  'var generated=readme(card)'
];
for(const marker of required){if(!src.includes(marker))throw new Error('Smart README contract missing: '+marker)}
const obsolete=[
  'Latest measured project checks',
  'remaining assessment check',
  'function assessmentMarkdown(levels)',
  'function projectAssessment(card)',
  'Explain the main modules/components and how data or control flows through them.',
  'Provide the exact install/build/run commands used for the finished project.',
  'Describe the evidence you used, how you diagnosed the problem, and how you fixed it.',
  'List 2–4 concrete improvements.',
  'STL data structures',
  'RAII / smart-pointer ownership'
];
for(const marker of obsolete){if(src.includes(marker))throw new Error('Obsolete README content still present: '+marker)}

for(const marker of ["cpp:'C++'", "if(lang==='cpp')return'g++ -std=c++17 "]){
  if(!src.includes(marker))throw new Error('C++ Smart README support missing: '+marker);
}
const readmeStart=src.indexOf('function readme(card){');
const readmeEnd=src.indexOf('function addStyle()',readmeStart);
const readmeTemplate=src.slice(readmeStart,readmeEnd);
for(const marker of ['## Assessment and validation','Core implementation','Feature coverage','Edge cases & robustness','Portfolio readiness','**Status:**','checks passed</b>']){
  if(readmeTemplate.includes(marker))throw new Error('Recruiter README template still includes grading status: '+marker);
}
if(!src.includes('function recruiterSafeReadme(md)'))throw new Error('README grading-status sanitizer is missing');
const sanitizerMatch=src.match(/function recruiterSafeReadme\(md\)\{[\s\S]*?\n\}/);
if(!sanitizerMatch)throw new Error('Could not isolate recruiterSafeReadme');
const vm=require('vm');
const ctx={};vm.createContext(ctx);vm.runInContext(sanitizerMatch[0]+';this.cleanReadme=recruiterSafeReadme;',ctx);
const dirty='# Demo\n\n## Assessment and validation\n### Core implementation\nStatus: 2 / 3 passed\n- ✅ Starter replaced\n- ❌ Run / check succeeds\n\n## How to run\npython app.py\n';
const cleaned=ctx.cleanReadme(dirty);
for(const marker of ['Assessment and validation','Core implementation','2 / 3 passed','✅','❌'])if(cleaned.includes(marker))throw new Error('Sanitizer leaked grading content: '+marker);
if(!cleaned.includes('## How to run'))throw new Error('Sanitizer removed normal recruiter content');
if(!/await write\(s,repository,readmePath,generated/.test(src))throw new Error('GitHub publish does not write the generated README');
console.log('Smart project README verification passed: project READMEs publish code/context/run instructions without course score, PASS/FAIL, or check-count grading output.');
