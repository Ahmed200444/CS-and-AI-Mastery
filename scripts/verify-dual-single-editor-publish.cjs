const fs=require('fs');
const path=require('path');
const root=process.cwd(),dir=path.join(root,'courses');
const asset=fs.readFileSync(path.join(root,'assets','dual-single-editor-publish.js'),'utf8');
const primary=fs.readFileSync(path.join(root,'assets','primary-language-mode.js'),'utf8');
const netlify=fs.readFileSync(path.join(root,'netlify.toml'),'utf8');
const problems=[];
const checks=[
 ['one shared editor',/function mainEditor\(task\)/],
 ['Python publish button',/data-dual-publish-language','python'|data-dual-publish-language","python|data-dual-publish-language=\\?"python/],
 ['C++ publish button',/data-dual-publish-language','cpp'|data-dual-publish-language","cpp|data-dual-publish-language=\\?"cpp/],
 ['Python folder',/return lang==='cpp'\?'C\+\+':'Python'/],
 ['.cpp extension',/return lang==='cpp'\?'cpp':'py'/],
 ['Python mismatch guard',/This looks like Python/],
 ['C++ mismatch guard',/This looks like C\+\+/],
 ['single editor marker',/data-csai-dual-single-editor/]
];
for(const [label,re] of checks)if(!re.test(asset))problems.push('dual-single-editor-publish.js missing '+label);
if(/setAttribute\(['"]data-dual-cpp-editor|innerHTML[^\n]*data-dual-cpp-editor/.test(asset))problems.push('dual-single-editor-publish.js must not create a second C++ editor');
if(/if\(mode==='dual'\)makeDual\(task,state\)/.test(primary))problems.push('primary-language-mode.js still actively creates a second Dual editor');
const files=fs.readdirSync(dir).filter(x=>x.endsWith('.html'));if(files.length!==54)problems.push(`expected 54 course pages, found ${files.length}`);
for(const name of files){const html=fs.readFileSync(path.join(dir,name),'utf8');if(!html.includes('/assets/dual-single-editor-publish.js'))problems.push(`${name}: missing Dual single-editor publisher`);}
const p=netlify.indexOf('scripts/patch-primary-dual-single-editor.cjs');
const q=netlify.indexOf('node --check assets/primary-language-mode.js');
const r=netlify.indexOf('scripts/inject-dual-single-editor-publish.cjs');
const v=netlify.indexOf('scripts/verify-dual-single-editor-publish.cjs');
if(!(p>=0&&q>p&&r>q&&v>r))problems.push('netlify.toml build order does not guarantee patch -> syntax check -> Dual injection -> Dual verification');
if(problems.length)throw new Error('Dual single-editor verification failed:\n'+problems.slice(0,100).join('\n'));
console.log('Dual single-editor verification passed: one editor, two explicit publish buttons, exact Python/C++ routes, mismatch protection, and 54-page injection.');
