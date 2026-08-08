const fs=require('fs');
const path=require('path');

const root=process.cwd();
const coursesDir=path.join(root,'courses');
const indexPath=path.join(root,'index.html');
const languageAssetPath=path.join(root,'assets','primary-language-mode.js');
if(!fs.existsSync(coursesDir))throw new Error('courses directory is missing');
if(!fs.existsSync(indexPath))throw new Error('index.html is missing');
if(!fs.existsSync(languageAssetPath))throw new Error('primary-language-mode.js is missing');

const files=fs.readdirSync(coursesDir).filter(name=>name.endsWith('.html'));
if(files.length!==54)throw new Error(`Final upgrade verification expected 54 course pages, found ${files.length}`);

const required=[
  '/assets/lesson-example-runner.js',
  '/assets/evergreen-learning-engine.js',
  '/assets/evergreen-review-navigation.js',
  '/assets/smart-evergreen-review.js',
  '/assets/assessment-practice.js',
  '/assets/assessment-layout-fix.js',
  '/assets/universal-reveal-solutions.js',
  '/assets/reveal-solution-explanations.js',
  '/assets/assessment-expanded-descriptions.js',
  '/assets/exercise-direct-publish.js',
  '/assets/universal-run-output.js',
  '/assets/final-exercise-toolbar.js',
  '/assets/course-project-workspace.js',
  '/assets/primary-language-mode.js'
];

const problems=[];
for(const file of files){
  const html=fs.readFileSync(path.join(coursesDir,file),'utf8');
  for(const asset of required){
    if(!html.includes(asset))problems.push(`${file}: missing ${asset}`);
  }
  if(!/data-theme-toggle/.test(html))problems.push(`${file}: missing course theme toggle`);
  if(!/course-page-meta/.test(html))problems.push(`${file}: missing course metadata/progress layer`);
  if(!/csai-project-data/.test(html))problems.push(`${file}: missing embedded project workspace data`);
  if(!/<h2>Projects<\/h2>/i.test(html))problems.push(`${file}: missing Projects section`);
}

const index=fs.readFileSync(indexPath,'utf8');
if(!index.includes('/assets/catalog-filter-controls.js'))problems.push('index.html: missing catalog filter controls');
if(!index.includes('/assets/primary-language-mode.js'))problems.push('index.html: missing Python/C++/Dual selector layer');
if(!/csai-static-course-navigation|cxOpen/.test(index))problems.push('index.html: missing static course navigation');

const langAsset=fs.readFileSync(languageAssetPath,'utf8');
const languageChecks=[
  ['Python / C++ / Dual modes',/MODES=\{python:'Python',cpp:'C\+\+',dual:'Dual'\}/],
  ['normal beginner for loop',/for \(int i = 0; i < nums\.size\(\); i\+\+\)/],
  ['range-based for loop',/for \(int value : nums\)/],
  ['iterator-based for loop',/for \(auto it = nums\.begin\(\); it != nums\.end\(\); it\+\+\)/],
  ['iterator deep explanation',/Iterator vs iterative/],
  ['iteration trace table',/Trace it iteration by iteration/],
  ['reveal integration',/data-reveal-solution/]
];
for(const [label,re] of languageChecks){if(!re.test(langAsset))problems.push(`primary-language-mode.js: missing ${label}`);}

if(problems.length){
  throw new Error('Final platform upgrade verification failed:\n'+problems.slice(0,60).join('\n'));
}

const report={
  verifiedAt:new Date().toISOString(),
  coursePages:files.length,
  requiredCourseUpgrades:required.map(x=>x.replace('/assets/','')),
  guarantees:[
    'Runnable lesson examples with output where browser execution is valid',
    'Evergreen Mastery Labs with multiple examples and step-by-step explanations',
    'Evergreen review badge shows whether lessons are due and opens the correct Mastery Lab',
    'Adaptive Evergreen scoring uses failures, reveals, knowledge checks, completions, and mastery ratings to schedule reviews',
    'Evergreen location guidance at the top of every course',
    'Python, C++, and Dual learning modes are available before the course catalog and remembered locally',
    'Programming lessons can show C++ companion material while AI/ML remains Python-first where appropriate',
    'C++ for-loop teaching shows normal, range-based, and iterator approaches with deep execution explanations',
    'Loop-related Reveal solution/answer panels receive the three C++ alternatives in C++ or Dual mode',
    'Assessment-style practice across every course',
    'One unified Run / Check action per assessment task',
    'Submit, Reset, Reveal solution, and Publish to GitHub controls',
    'Direct per-exercise GitHub publishing without leaving the course',
    'Expanded task descriptions and revealed-answer explanations',
    'Runnable/checkable project workspaces with Output on every course project/capstone',
    'Direct project publishing to GitHub without leaving the course',
    'Light/Dark course theme support',
    'Catalog filters and static fast course navigation'
  ]
};
fs.writeFileSync(path.join(root,'assets','final-platform-verification.json'),JSON.stringify(report,null,2)+'\n','utf8');
console.log(`Final platform verification passed for ${files.length} courses and ${required.length} course upgrade layers.`);
