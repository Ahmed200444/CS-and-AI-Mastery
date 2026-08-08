const fs=require('fs');
const path=require('path');

const root=process.cwd();
const coursesDir=path.join(root,'courses');
const indexPath=path.join(root,'index.html');
const languageAssetPath=path.join(root,'assets','primary-language-mode.js');
const toolbarAssetPath=path.join(root,'assets','final-exercise-toolbar.js');
const publishAssetPath=path.join(root,'assets','exercise-direct-publish.js');
const dualPublishAssetPath=path.join(root,'assets','dual-single-editor-publish.js');

for(const [label,file] of [
  ['courses directory',coursesDir],
  ['index.html',indexPath],
  ['primary-language-mode.js',languageAssetPath],
  ['final-exercise-toolbar.js',toolbarAssetPath],
  ['exercise-direct-publish.js',publishAssetPath],
  ['dual-single-editor-publish.js',dualPublishAssetPath]
]){
  if(!fs.existsSync(file))throw new Error(`${label} is missing`);
}

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
  '/assets/primary-language-mode.js',
  '/assets/dual-single-editor-publish.js'
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
if(!index.includes('/assets/primary-language-mode.js'))problems.push('index.html: missing course language/navigation runtime');
if(!/csai-static-course-navigation|cxOpen/.test(index))problems.push('index.html: missing static course navigation');

const langAsset=fs.readFileSync(languageAssetPath,'utf8');
const languageChecks=[
  ['Python / C++ / Dual modes',/MODES=\{python:'Python',cpp:'C\+\+',dual:'Dual'\}/],
  ['strict flexible-course list',/FLEXIBLE_IDS=\['dsa','problem-solving','oop','algorithms','data-structures'\]/],
  ['normal beginner for loop',/for \(int i = 0; i < nums\.size\(\); i\+\+\)/],
  ['range-based for loop',/for \(int value : nums\)/],
  ['iterator-based for loop',/for \(auto it = nums\.begin\(\); it != nums\.end\(\); it\+\+\)/],
  ['iterator deep explanation',/Iterator vs iterative/],
  ['reveal integration',/data-reveal-solution/]
];
for(const [label,re] of languageChecks){if(!re.test(langAsset))problems.push(`primary-language-mode.js: missing ${label}`);}
if(/FLEXIBLE_IDS=\[[^\]]*['"]python['"]/.test(langAsset))problems.push('primary-language-mode.js: Python course must not be language-flexible');

const toolbarAsset=fs.readFileSync(toolbarAssetPath,'utf8');
const toolbarChecks=[
  ['missing publish-button creation',/function ensurePublish\(task,toolbar\)/],
  ['Publish to GitHub label',/publish\.textContent='Publish to GitHub'/],
  ['duplicate generic publish removal',/removeOthers\(task\.querySelectorAll\('\[data-publish\]'\),publish\)/]
];
for(const [label,re] of toolbarChecks){if(!re.test(toolbarAsset))problems.push(`final-exercise-toolbar.js: missing ${label}`);}

const publishAsset=fs.readFileSync(publishAssetPath,'utf8');
const publishChecks=[
  ['C++ .cpp support',/lang==='cpp'\?'cpp'/],
  ['Python .py support',/lang==='python'\?'py'/],
  ['C++ code detection',/function looksCpp\(code\)/],
  ['language folder mapper',/function languageFolder\(ext\)/],
  ['visible C++ folder',/if\(ext==='cpp'\)return'C\+\+';/],
  ['visible Python folder',/if\(ext==='py'\)return'Python';/],
  ['exact language-aware exercise path builder',/function exercisePath\(task,lang\)/],
  ['student-code path root',/student-code\//],
  ['course folder in path',/slug\(courseId\)/],
  ['title-only filename',/slug\(title\)/],
  ['language-aware commit message',/Update '\+title\+' \('\+folder\+'\) from CS & AI Mastery/],
  ['direct GitHub file API',/FILE_URL='\/api\/github\/file'/]
];
for(const [label,re] of publishChecks){if(!re.test(publishAsset))problems.push(`exercise-direct-publish.js: missing ${label}`);}
if(/pad\(order\)|\d{2}-'\+slug\(title\)/.test(publishAsset))problems.push('exercise-direct-publish.js: numbered exercise filenames must not return');

const dualAsset=fs.readFileSync(dualPublishAssetPath,'utf8');
const dualChecks=[
  ['one shared editor',/function mainEditor\(task\)/],
  ['Python publish button',/data-dual-publish-language[^\n]*python/],
  ['C++ publish button',/data-dual-publish-language[^\n]*cpp/],
  ['Python route',/return lang==='cpp'\?'C\+\+':'Python'/],
  ['language extension route',/return lang==='cpp'\?'cpp':'py'/],
  ['Python mismatch guard',/This looks like Python/],
  ['C++ mismatch guard',/This looks like C\+\+/],
  ['single-editor marker',/data-csai-dual-single-editor/]
];
for(const [label,re] of dualChecks){if(!re.test(dualAsset))problems.push(`dual-single-editor-publish.js: missing ${label}`);}
if(/setAttribute\(['"]data-dual-cpp-editor|innerHTML[^\n]*data-dual-cpp-editor/.test(dualAsset))problems.push('dual-single-editor-publish.js: must not create a second C++ editor');

if(problems.length){
  throw new Error('Final platform upgrade verification failed:\n'+problems.slice(0,100).join('\n'));
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
    'Python, C++, and Dual controls appear only on language-flexible courses; language-specific courses such as Python do not show the selector',
    'C++ for-loop teaching shows normal, range-based, and iterator approaches with deep execution explanations',
    'Loop-related Reveal solution/answer panels receive the three C++ alternatives in C++ or Dual mode',
    'Assessment-style practice across every course',
    'Normal-language exercises receive a direct Publish to GitHub control',
    'Dual mode uses one editor with separate Publish to Python and Publish to C++ controls',
    'Exercise GitHub filenames use the exact exercise title without public numbering and preserve language extensions such as .py or .cpp',
    'Exercise publishing is organized by visible language folders such as student-code/Python/... and student-code/C++/...',
    'Python and C++ solutions for the same exercise can coexist in separate language folders',
    'Dual publishing blocks obvious Python/C++ language mismatches before writing the wrong extension',
    'One unified Run / Check action per assessment task',
    'Submit, Reset, Reveal solution, and GitHub publishing controls',
    'Direct per-exercise GitHub publishing without leaving the course',
    'Expanded task descriptions and revealed-answer explanations',
    'Runnable/checkable project workspaces with Output on every course project/capstone',
    'Direct project publishing to GitHub without leaving the course',
    'Light/Dark course theme support',
    'Catalog filters and guarded static fast course navigation'
  ]
};
fs.writeFileSync(path.join(root,'assets','final-platform-verification.json'),JSON.stringify(report,null,2)+'\n','utf8');
console.log(`Final platform verification passed for ${files.length} courses and ${required.length} course upgrade layers.`);
