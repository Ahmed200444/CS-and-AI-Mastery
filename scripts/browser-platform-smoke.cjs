const fs=require('fs');
const path=require('path');
const assert=require('assert');
const {chromium}=require('playwright');

const coursesDir=path.join(process.cwd(),'courses');
const files=fs.readdirSync(coursesDir).filter(f=>f.endsWith('.html')).sort();
assert.equal(files.length,54,'Expected exactly 54 generated course pages');
const base=process.env.CSAI_SMOKE_BASE||'http://127.0.0.1:4173';

(async()=>{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  let pageErrors=[];
  let evergreenLabs=0;
  let taskReadmes=0;
  let examplePublish=0;
  let projectReadmes=0;
  let safeOutputs=0;
  let editorChecked=false;
  let themeChecked=false;

  for(let index=0;index<files.length;index++){
    const file=files[index];
    const page=await context.newPage();
    const localErrors=[];
    page.on('pageerror',error=>localErrors.push(error.message||String(error)));
    if(index%9===0)await page.setViewportSize({width:390,height:844});

    try{
      await page.goto(`${base}/courses/${encodeURIComponent(file)}`,{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForTimeout(950);

      const state=await page.evaluate(()=>({
        lessons:document.querySelectorAll('.lesson').length,
        portfolioScripts:document.querySelectorAll('script[src*="/assets/github-portfolio-controls.js"]').length,
        editorScripts:document.querySelectorAll('script[src*="/assets/smart-code-editor.js"]').length,
        safeScripts:document.querySelectorAll('script[src*="/assets/universal-safe-output.js"]').length,
        diversityScripts:document.querySelectorAll('script[src*="/assets/evergreen-example-diversity.js"]').length,
        evergreen:document.querySelectorAll('[data-evergreen-lab]').length,
        taskReadmes:document.querySelectorAll('[data-csai-task-readme]').length,
        examplePublish:document.querySelectorAll('[data-csai-example-publish]').length,
        projectReadmes:document.querySelectorAll('[data-csai-project-readme]').length,
        safeOutputs:document.querySelectorAll('.csai-safe-output-tools').length,
        width:document.documentElement.scrollWidth,
        viewport:window.innerWidth,
        bodyVisible:!!(document.body&&document.body.getBoundingClientRect().height>0)
      }));

      assert(state.bodyVisible,`${file}: body is blank`);
      assert(state.lessons>0,`${file}: no lessons rendered`);
      assert.equal(state.portfolioScripts,1,`${file}: portfolio controller count`);
      assert.equal(state.editorScripts,1,`${file}: smart editor count`);
      assert.equal(state.safeScripts,1,`${file}: safe output count`);
      assert.equal(state.diversityScripts,1,`${file}: diversity controller count`);
      if(index%9===0)assert(state.width<=state.viewport+4,`${file}: mobile horizontal overflow ${state.width}px > ${state.viewport}px`);

      evergreenLabs+=state.evergreen;
      taskReadmes+=state.taskReadmes;
      examplePublish+=state.examplePublish;
      projectReadmes+=state.projectReadmes;
      safeOutputs+=state.safeOutputs;

      if(!themeChecked){
        const theme=page.locator('[data-course-theme-toggle]');
        if(await theme.count()){
          const before=await page.evaluate(()=>document.documentElement.dataset.theme||'light');
          await theme.first().click();
          const after=await page.evaluate(()=>document.documentElement.dataset.theme||'light');
          assert.notEqual(after,before,`${file}: theme toggle did not change the theme`);
          themeChecked=true;
        }
      }

      if(!editorChecked){
        const editor=page.locator('textarea[data-evergreen-code],textarea[data-editor]:not(.oa-answer),textarea[data-project-editor]').first();
        if(await editor.count()){
          await editor.fill('if True:');
          await editor.focus();
          await page.keyboard.press('End');
          await page.keyboard.press('Enter');
          const value=await editor.inputValue();
          assert(value.endsWith('\n    '),`${file}: Python smart Enter did not indent four spaces`);
          await page.keyboard.type('pass');
          await page.keyboard.press('Control+A');
          await page.keyboard.press('Tab');
          const tabbed=await editor.inputValue();
          assert(tabbed.startsWith('    '),`${file}: Tab did not indent the selection`);
          await page.keyboard.press('Shift+Tab');
          const untabbed=await editor.inputValue();
          assert(!untabbed.startsWith('    if True:'),`${file}: Shift+Tab did not outdent the selection`);
          editorChecked=true;
        }
      }

      if(localErrors.length)pageErrors.push(`${file}: ${localErrors.join(' | ')}`);
    }finally{
      await page.close();
    }
  }

  await browser.close();

  assert(themeChecked,'No working course theme toggle was found');
  assert(editorChecked,'No smart code editor could be exercised');
  assert(evergreenLabs>0,'No Evergreen labs rendered across the platform');
  assert(taskReadmes>0,'No exercise README controls rendered across the platform');
  assert(examplePublish>0,'No lesson example publish controls rendered across the platform');
  assert(projectReadmes>0,'No project README controls rendered across the platform');
  assert(safeOutputs>0,'No safe shell/Git/Docker/cloud/networking validation UI rendered across the platform');
  assert.equal(pageErrors.length,0,'Browser page errors:\n'+pageErrors.join('\n'));

  console.log(`Browser smoke passed across ${files.length} courses.`);
  console.log(`Evergreen labs: ${evergreenLabs}; task README controls: ${taskReadmes}; example publish controls: ${examplePublish}; project README controls: ${projectReadmes}; safe validation blocks: ${safeOutputs}.`);
})().catch(error=>{console.error(error);process.exit(1);});
