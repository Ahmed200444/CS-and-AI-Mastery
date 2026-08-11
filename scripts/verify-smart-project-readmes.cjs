const fs=require('fs');
const path=require('path');
const file=path.join(process.cwd(),'assets','project-readme-layer.js');
if(!fs.existsSync(file))throw new Error('project-readme-layer.js is missing');
const src=fs.readFileSync(file,'utf8');
const required=[
  "b.textContent='Smart README'",
  'function detectSymbols(code,lang)',
  'function projectAssessment(card)',
  'function latestOutput(card)',
  'function runCommand(d)',
  'function assessmentMarkdown(levels)',
  '## Implementation snapshot',
  '## Assessment and validation',
  '## Latest result',
  '## Engineering decisions',
  '## Next improvements',
  "readmePath=folder+'/README.md'",
  'var generated=readme(card)',
  'current project workspace, requirements, runtime output, and measured project checks'
];
for(const marker of required){if(!src.includes(marker))throw new Error('Smart README contract missing: '+marker)}
const forbidden=[
  'Explain the main modules/components and how data or control flows through them.',
  'Provide the exact install/build/run commands used for the finished project.',
  'Describe the evidence you used, how you diagnosed the problem, and how you fixed it.',
  'List 2–4 concrete improvements.',
  'C++',
  "lang==='cpp'",
  "lang==='c++'",
  'g++ -std=',
  'STL data structures',
  'RAII / smart-pointer ownership'
];
for(const marker of forbidden){if(src.includes(marker))throw new Error('Obsolete Smart README content still present: '+marker)}
if(!/await write\(s,repository,readmePath,generated/.test(src))throw new Error('GitHub publish does not write the generated README');
console.log('Smart project README verification passed: code, requirements, runtime output, project checks, run instructions, and GitHub README publishing are wired without removed-language handling.');
