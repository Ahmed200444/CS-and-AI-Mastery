const fs=require('fs');
const path=require('path');
const root=process.cwd(),dir=path.join(root,'courses');
const oaPath=path.join(root,'assets','oa-assessment-upgrade.js'),fallbackPath=path.join(root,'assets','oa-assessment-fallback.js');
if(!fs.existsSync(oaPath)||!fs.existsSync(fallbackPath))throw new Error('OA assessment runtime assets missing');
const oa=fs.readFileSync(oaPath,'utf8'),fallback=fs.readFileSync(fallbackPath,'utf8');
for(const token of ['OA Practice Score','Training metric only','Assessment test cases','Visible + hidden','Progressive project assessment','Core implementation','Edge cases & robustness','Portfolio readiness'])if(!oa.includes(token))throw new Error(`OA runtime missing ${token}`);
if(/querySelector\([^)]*["']\.lesson["']/.test(oa)||/querySelectorAll\([^)]*["']\.lesson["']/.test(oa))throw new Error('OA runtime must not modify lesson DOM');
if(!fallback.includes('CSAICppRunner.runSource'))throw new Error('Fallback C++ exercises are not wired to the real C++ runner');
let pages=0,assessment=0,fallbacks=0;
for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.html'))){const html=fs.readFileSync(path.join(dir,file),'utf8');pages++;
 for(const asset of ['oa-assessment-upgrade.css','oa-assessment-upgrade.js','oa-assessment-fallback.css','oa-assessment-fallback.js'])if(!html.includes('/assets/'+asset))throw new Error(`${file}: missing ${asset}`);
 if(!/id=["']csai-assessment-data["']/.test(html))throw new Error(`${file}: assessment data missing`);assessment++;
 if(!html.includes('project-readme-layer.js'))throw new Error(`${file}: README/project publishing layer missing`);
 if(!html.includes('runner-performance-guard.js'))throw new Error(`${file}: runner performance layer missing`);
 if(html.includes('csai-oa-fallback-assessment')){fallbacks++;if(!html.includes('data-csai-oa-cpp-run'))throw new Error(`${file}: fallback assessment is not C++ runnable`)}
}
if(pages!==57||assessment!==57)throw new Error(`Expected assessment coverage on 57 courses; pages=${pages}, assessment=${assessment}`);
console.log(`OA assessment verification passed: ${pages} courses covered, ${fallbacks} C++ fallback assessment page(s), lessons remain unscored, project README/GitHub and runner layers preserved.`);
