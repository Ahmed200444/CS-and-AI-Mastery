import assert from 'node:assert/strict';
import {setTimeout as sleep} from 'node:timers/promises';

const base=(process.env.LIVE_SITE_URL||'https://cs-ai-mastery.netlify.app').replace(/\/$/,'');
async function get(path){
  const start=performance.now(),res=await fetch(base+path,{redirect:'follow',cache:'no-store'}),text=await res.text(),ms=performance.now()-start;
  return {res,text,ms};
}
let ready=null;
for(let attempt=0;attempt<18;attempt++){
  try{
    const course=await get('/courses/dsa.html');
    if(course.res.ok&&course.text.includes('portfolio-publish-controls.js')&&course.text.includes('project-language-controller.js')){ready=course;break;}
  }catch(e){}
  await sleep(5000);
}
assert(ready,'Live Netlify site did not expose the newly generated course build');
const home=await get('/'),course=await get('/courses/dsa.html'),status=await get('/api/github/status');
assert(home.res.ok,'Live homepage failed');
assert(/CS\s*&\s*AI\s*Mastery/i.test(home.text),'Live homepage content is unexpected');
assert(course.res.ok,'Live DSA course failed');
for(const marker of ['smart-code-editor.js','portfolio-publish-controls.js','project-language-controller.js'])assert(course.text.includes(marker),`Live course missing ${marker}`);
assert(status.res.status!==404&&status.res.status<500,`Live GitHub status route failed with ${status.res.status}`);
const warm=[];
for(const p of ['/','/courses/dsa.html','/assets/portfolio-publish-controls.js']){
  await get(p);
  const r=await get(p);warm.push({path:p,ms:Math.round(r.ms)});assert(r.ms<1000,`${p} warm live response took ${r.ms.toFixed(1)} ms`);
}
console.log(JSON.stringify({liveSite:base,firstCourseMs:Math.round(ready.ms),warm,status:status.res.status},null,2));
console.log('Live-site smoke test passed.');
