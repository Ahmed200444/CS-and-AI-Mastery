const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
function text(p){return fs.readFileSync(path.join(root,p),'utf8')}
function ok(cond,msg){if(!cond)throw new Error(msg)}
const server=text('local-server.js');
ok(/Preloaded .*local files into memory/.test(server),'local server must preload files into memory');
ok(/Clear-Site-Data/.test(server)&&/"cache"/.test(server),'first homepage response must purge stale browser cache');
ok(/EADDRINUSE/.test(server)&&/Close the OLD black START_SITE window/.test(server),'old local server conflict must be explicit');
ok(/PORT=5711/.test(server),'local origin must stay stable so saved progress persists');
const catalog=text('assets/catalog-recovery.js');
ok(/readEmbeddedCatalog\(\)/.test(catalog)&&/if\(DATA\.courses\.length\)\{renderReady\(\)/.test(catalog),'catalog must render embedded data synchronously');
const count=text('assets/runtime-inline/index-007.js');
ok(/csai-inline-catalog-data/.test(count)&&!/getElementById\('coursedata'\)/.test(count),'homepage count must not parse full course JSON');
const guard=text('assets/course-route-visibility-guard.js');
ok(!/setTimeout\([^\n]*,\s*(450|700)\)/.test(guard),'path visibility guard must not contain old 450/700ms forced waits');
const ai=text('assets/runtime-inline/index-066.js');
ok(/aiPathResumeCourse[\s\S]*location\.assign\(url\)/.test(ai),'AI path must navigate directly to static course pages');
const fsPath=text('assets/runtime-inline/index-011.js');
ok(/fspGoToStage[\s\S]*location\.assign\('courses\/'/.test(fsPath),'Full-stack path must navigate directly to static course pages');
const idx=text('index.html');
ok(!/course-speed-boost\.js|catalog-course-viewer\.js/.test(idx),'legacy delayed course-viewer interceptors must not be loaded');
const runner=text('assets/lesson-example-runner.js');
ok(/data-reference-only/.test(runner)&&/Reference example/.test(runner),'reference examples must not expose a misleading Run button');
const courseFiles=fs.readdirSync(path.join(root,'courses')).filter(f=>f.endsWith('.html'));
ok(courseFiles.length===62,'expected 62 static course pages');
for(const f of courseFiles){const h=text('courses/'+f);const scripts=[...h.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*>/gi)];ok(scripts.length>=2,`${f}: expected course scripts`);for(const m of scripts){const src=m[1];const critical=/runtime-inline\/courses-[^/]+-00[12]\.js/.test(src);if(!critical)ok(/\bdefer\b/i.test(m[0]),`${f}: non-critical script ${src} should be deferred`)}}

const BUILD_TAG='20260822-v567',NEW_BUILD_TAG='20260822-v568',CPP_STYLE_TAG='20260822-v571',AUDIT_TAG='20260823-v573',LEARNING_TAG='20260824-v574';
for(const rel of ['index.html',...courseFiles.map(f=>'courses/'+f)]){
  const h=text(rel);
  for(const m of h.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*>/gi)){
    if(/^(?:\.\.\/)?assets\//.test(m[1])){
      const expected=/try-it-yourself-v568\.js/.test(m[1])?NEW_BUILD_TAG:/study-examples\.js|conceptual-examples-v574\.js|program-questions-v574\.js/.test(m[1])?LEARNING_TAG:/practice-guidance\.js|practice-publish-completer\.js/.test(m[1])?AUDIT_TAG:/course-project-workspace\.js/.test(m[1])?CPP_STYLE_TAG:BUILD_TAG;
      ok(m[1].includes('?v='+expected),`${rel}: local script is missing the expected cache-busting build tag: ${m[1]}`);
    }
  }
}

console.log('Performance/navigation regression contracts passed.');
