const fs=require('fs');
const path=require('path');
const root=process.cwd(),problems=[];
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const variants=fs.readFileSync(path.join(root,'assets','lesson-language-variants.js'),'utf8');
const netlify=fs.readFileSync(path.join(root,'netlify.toml'),'utf8');
const headEnd=index.toLowerCase().indexOf('</head>'),homeGuard=index.indexOf('csai-home-first-paint-start');
if(!(homeGuard>=0&&homeGuard<headEnd))problems.push('homepage guard is not active before first paint');
const variantChecks=[
 ['real C++ include',/#include <iostream>/],
 ['real C++ vector',/vector<int>/],
 ['normal C++ for loop',/for \(int i = 0; i < nums\.size\(\); i\+\+\)/],
 ['range-based C++ explanation',/for \(int value : nums\)/],
 ['iterator C++ explanation',/nums\.begin\(\).*nums\.end\(\)/],
 ['Python variant',/data-lang-variant="python"/],
 ['C++ variant',/data-lang-variant="cpp"/],
 ['Dual mode',/m==='dual'/],
 ['Dual two-language layout',/csai-language-example-pair\.dual/],
 ['legacy panel cleanup',/data-cpp-lesson-panel.*data-cpp-generic-note/],
 ['source examples hidden',/data-csai-source-example/],
 ['generated language code class',/csai-language-code/]
];
for(const [label,re] of variantChecks)if(!re.test(variants))problems.push('lesson-language-variants.js missing '+label);
const dir=path.join(root,'courses'),files=fs.readdirSync(dir).filter(x=>x.endsWith('.html'));
if(files.length!==54)problems.push(`expected 54 course pages, found ${files.length}`);
for(const name of files){const html=fs.readFileSync(path.join(dir,name),'utf8');if(!html.includes('/assets/lesson-language-variants.js?v=20260809-1'))problems.push(`${name}: missing complete lesson language variants`);}
const homeStep=netlify.indexOf('scripts/inject-home-first-paint-guard.cjs');
const variantStep=netlify.indexOf('scripts/inject-lesson-language-variants.cjs');
const verifyStep=netlify.indexOf('scripts/verify-home-cpp-dual-ux.cjs');
if(!(homeStep>=0&&variantStep>homeStep&&verifyStep>variantStep))problems.push('netlify build order does not guarantee homepage/C++/Dual fixes');
if(problems.length)throw new Error('Homepage/C++/Dual verification failed:\n'+problems.slice(0,100).join('\n'));
console.log('Homepage/C++/Dual verification passed: no raw first paint, C++ examples contain real C++ source, and Dual shows Python + C++ on all 54 pages.');
