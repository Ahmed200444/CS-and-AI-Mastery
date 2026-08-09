const fs=require('fs');
const path=require('path');
const assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const exists=p=>fs.existsSync(path.join(root,p));

const pkg=JSON.parse(read('package.json'));
assert.equal(pkg.version,'5.20.0','internal release version must be 5.20.0');

const backend=read('netlify/functions/github-file.js');
assert(backend.includes("path.startsWith('student-code/')"),'student-code must be create-once');
assert(backend.includes('alreadyExists:true'),'duplicate publish must return alreadyExists');
assert(backend.includes('body.requirePath'),'README dependency guard is missing');
assert(backend.includes("error:'Publish the code first.'"),'README-before-code message is missing');
assert(backend.includes('canonicalPortfolioPath'),'migrated item canonicalization is missing');
for(const canonical of [
 'student-code/practice/python/fizzbuzz/fizzbuzz.py',
 'student-code/practice/python/real-second-largest-distinct/real-second-largest-distinct.py',
 'student-code/practice/python/real-valley-array/real-valley-array.py',
 'student-code/practice/dsa/two-sum/dsa-two-sum.py',
 'student-code/practice/oop/oop-counter-state/oop-counter-state.py',
 'student-code/practice/oop/oop-point/oop-point.py'
])assert(backend.includes(canonical),`backend canonical path missing: ${canonical}`);

const sw=read('sw.js');
assert(sw.includes("url.pathname.startsWith('/api/')"),'service worker must exclude /api/');
assert(sw.includes("url.pathname.startsWith('/.netlify/functions/')"),'service worker must exclude Netlify functions');
assert(sw.includes("request.mode==='navigate'"),'HTML fallback must be navigation-scoped');
assert(!/r\|\|caches\.match\('\/index\.html'\)/.test(sw),'non-navigation requests must not fall back to index.html');

const assets=['assets/github-portfolio-controls.js','assets/smart-code-editor.js','assets/universal-safe-output.js','assets/evergreen-example-diversity.js'];
for(const file of assets){assert(exists(file),`${file} is missing`);new Function(read(file));}
const portfolio=read('assets/github-portfolio-controls.js');
assert(portfolio.includes('student-code/practice/'),'practice publishing is not item-folder based');
assert(portfolio.includes('student-code/examples/'),'example publishing is missing');
assert(portfolio.includes('student-code/projects/'),'project publishing is missing');
assert(portfolio.includes('Add a README'),'README control is missing');
assert(portfolio.includes('requirePath'),'README creation must require code first');
assert(portfolio.includes('[data-publish]'),'legacy exercise publish actions are not intercepted');
assert(portfolio.includes('[data-dual-publish-language]'),'dual-language publish actions are not intercepted');

const editor=read('assets/smart-code-editor.js');
assert(editor.includes('event.shiftKey'),'Shift+Tab support is missing');
assert(editor.includes('elif\\b|else'),'Python branch dedent support is missing');
assert(editor.includes("event.key==='Enter'"),'smart Enter behavior is missing');
assert(editor.includes("/{\\s*$/.test(trimmed)"),'brace indentation support is missing');

const safe=read('assets/universal-safe-output.js');
for(const word of ['Git','Docker','Cloud / infrastructure','Networking','Shell / Linux'])assert(safe.includes(word),`safe output is missing ${word}`);
assert(safe.includes('browser did not execute'),'simulation must clearly state that system commands were not executed');

const diversity=read('assets/evergreen-example-diversity.js');
assert(diversity.includes('Practical variation'),'practical example label is missing');
assert(diversity.includes('Edge / failure case'),'edge/failure example label is missing');

const injector=read('scripts/inject-final-quality-layer.cjs');
for(const file of ['github-portfolio-controls','smart-code-editor','universal-safe-output','evergreen-example-diversity'])assert(injector.includes(file),`quality injector is missing ${file}`);
assert(injector.includes('count!==54'),'quality layer must verify all 54 generated courses');
assert(exists('scripts/remove-public-version.cjs'),'public version-removal build step is missing');

const expected=[
 'student-code/practice/python/fizzbuzz/fizzbuzz.py',
 'student-code/practice/python/fizzbuzz/README.md',
 'student-code/practice/python/real-second-largest-distinct/real-second-largest-distinct.py',
 'student-code/practice/python/real-second-largest-distinct/README.md',
 'student-code/practice/python/real-valley-array/real-valley-array.py',
 'student-code/practice/python/real-valley-array/README.md',
 'student-code/practice/dsa/two-sum/dsa-two-sum.py',
 'student-code/practice/dsa/two-sum/README.md',
 'student-code/practice/oop/oop-counter-state/oop-counter-state.py',
 'student-code/practice/oop/oop-counter-state/README.md',
 'student-code/practice/oop/oop-point/oop-point.py',
 'student-code/practice/oop/oop-point/README.md'
];
for(const file of expected)assert(exists(file),`migrated portfolio item missing: ${file}`);
for(const file of [
 'student-code/practice/python/fizzbuzz.py',
 'student-code/practice/python/real-second-largest-distinct.py',
 'student-code/practice/python/real-valley-array.py',
 'student-code/practice/dsa/dsa-two-sum.py',
 'student-code/practice/oop/oop-counter-state.py',
 'student-code/practice/oop/oop-point.py'
])assert(!exists(file),`old flat duplicate still exists: ${file}`);
const point=read('student-code/practice/oop/oop-point/oop-point.py');
assert(point.includes('def __init__('),'Point constructor is still broken');
assert(!point.includes('def _init_('),'broken Point constructor spelling remains');

for(const file of ['github-authorize.js','github-disconnect.js','github-file.js','github-status.js','github-sync.js'])assert(!exists(file),`obsolete root GitHub shim still exists: ${file}`);

const readme=read('README.md');
assert(readme.length>2500,'root README is still too thin');
assert(readme.includes('create-once'),'root README must document duplicate protection');
const setup=read('SETUP.md');
assert(!/v5\.18\.2/.test(setup),'stale setup version remains');
assert(setup.includes('create-once'),'setup must document portfolio behavior');

const netlify=read('netlify.toml');
assert(netlify.includes('inject-final-quality-layer.cjs'),'production build does not inject the final quality layer');
assert(netlify.includes('remove-public-version.cjs'),'production build does not remove the public version label');
assert(netlify.includes('npm test'),'production build must run the repository tests');

const workflow=read('.github/workflows/platform-quality-gate.yml');
assert(workflow.includes("'release/**'"),'quality gate must run on release branches');
assert(workflow.includes('Run exact production build'),'quality gate must execute the production build');
assert(workflow.includes("-eq 54"),'quality gate must verify all 54 generated course pages');

console.log('Release-quality contract passed.');
