const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const explainer=read('assets/line-by-line-explanations.js');

// Every production code-workspace family must route into the same single explainer.
for(const marker of [
  '.csai-study-example textarea.csai-study-code',
  '.lesson .lesson-run-card pre.code',
  '.lesson pre.code',
  '.lesson .adaptive-panel textarea.adaptive-code',
  '.lesson .evergreen-example textarea.evergreen-editor',
  'textarea[data-project-editor]',
  'textarea.oa-editor[data-editor]',
  'textarea[data-dual-editor]',
  'textarea.csai-code-editor',
  'textarea[data-evergreen-code]',
  'textarea.wd-edit',
  'textarea.cx-pm-edit',
  'textarea.answer',
  'textarea.py[readonly]',
  'textarea[aria-label="Code editor" i]',
  'textarea[aria-label="SQL query editor" i]',
  'textarea[aria-label="HTML editor" i]',
  'textarea[aria-label="CSS editor" i]',
  'textarea[aria-label="JavaScript editor" i]',
  'textarea[aria-label="Git command" i]'
]) assert.ok(explainer.includes(marker),`universal explainer missing workspace family: ${marker}`);

assert.ok(explainer.includes('isWrittenResponse'),'written-answer boxes must be excluded from code explanations');
assert.ok(explainer.includes('.oa-answer'),'OA written responses must stay prose-only');
assert.ok(explainer.includes('inferLanguage(v,\'\',node)!==\'text\''),'ambiguous exercise textareas must only become code explainers after code-like content exists');
assert.ok(explainer.includes('data-csai-line-owner'),'each editor must own its line-by-line block');
assert.ok(explainer.includes('dedupeOwned'),'multiple editors in one project must not delete one another\'s explanations');
assert.ok(!explainer.includes('dedupeLineBlocks'),'old container-wide dedupe must be gone');

const project=read('assets/course-project-workspace.js');
assert.ok(project.includes('data-project-editor'),'shared project workspace must expose project editor marker');
const assessment=read('assets/assessment-practice.js');
assert.ok(assessment.includes('class="oa-editor"')&&assessment.includes('data-editor'),'assessment code tasks must expose OA code editor marker');
const specialSources=fs.readdirSync(path.join(root,'assets','runtime-inline')).filter(f=>f.endsWith('.js')).map(f=>read('assets/runtime-inline/'+f)).join('\n');
assert.ok((specialSources.match(/class="wd-edit"/g)||[]).length>10,'expected specialized wd-edit workspaces');
assert.ok(specialSources.includes('aria-label="Code editor"'),'specialized course code editors must be identifiable');
assert.ok(specialSources.includes('aria-label="SQL query editor"'),'SQL specialist editor must be identifiable');

const pages=fs.readdirSync(path.join(root,'courses')).filter(f=>f.endsWith('.html'));
assert.equal(pages.length,62,'expected 62 generated course pages');
for(const page of pages){
  const html=read('courses/'+page);
  assert.ok(html.includes('line-by-line-explanations.js?v=20260822-v567'),`${page}: missing current universal explainer build`);
}

// Count the concrete generated workspace hooks the universal layer covers.
let generated={staticProjectEditors:0,declaredProjects:0,assessmentEditors:0,rawLanguageExercises:0,nativeRunnableExamples:0,nativeReferenceExamples:0};
for(const page of pages){
  const html=read('courses/'+page);
  generated.staticProjectEditors+=(html.match(/data-project-editor/g)||[]).length;
  const pm=html.match(/<script id="csai-project-data" type="application\/json">([\s\S]*?)<\/script>/);
  if(pm){const pd=JSON.parse(pm[1]);generated.declaredProjects+=(pd.projects||[]).length;if((pd.projects||[]).length)assert.ok(html.includes('course-project-workspace.js'),`${page}: declared projects must use the shared project workspace`);}
  generated.assessmentEditors+=(html.match(/class="oa-editor"/g)||[]).length;
  generated.rawLanguageExercises+=(html.match(/class="answer"[^>]*data-language=/g)||[]).length;
  generated.nativeRunnableExamples+=(html.match(/data-example-audit="candidate"/g)||[]).length;
  generated.nativeReferenceExamples+=(html.match(/data-reference-only="true"/g)||[]).length;
}
const catalog=JSON.parse(read('assets/catalog-data.json'));
const catalogProjects=(catalog.courses||[]).reduce((sum,c)=>sum+Number(c?.counts?.projects||0),0);
assert.equal(catalogProjects,229,'visible/catalog curriculum must contain 229 projects');
assert.ok(generated.declaredProjects>=catalogProjects,`generated/compatibility pages must declare at least the ${catalogProjects} catalog projects`);
assert.ok(generated.staticProjectEditors>0,'expected specialized/static project editors');
assert.ok(generated.assessmentEditors>0,'expected generated assessment code editors');
assert.ok(generated.rawLanguageExercises>0,'expected language-tagged exercise editors');
assert.ok(generated.nativeRunnableExamples>=362,`runnable native lesson example coverage regressed to ${generated.nativeRunnableExamples}`);
assert.ok(generated.nativeReferenceExamples>=533,`reference native lesson example coverage regressed to ${generated.nativeReferenceExamples}`);
const nativeTotal=generated.nativeRunnableExamples+generated.nativeReferenceExamples;
const coveragePath=path.join(root,'EXAMPLE_COVERAGE_QA_v5.75.json');
if(fs.existsSync(coveragePath)){
  const coverage=JSON.parse(fs.readFileSync(coveragePath,'utf8'));
  assert.equal(nativeTotal,coverage.staticExamplesAfter,'all enriched native lesson examples must be explainable');
}else{
  assert.ok(nativeTotal>=895,`native lesson example coverage regressed to ${nativeTotal}`);
}

console.log('Universal code explanation coverage: PASS',generated);
