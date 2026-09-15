const fs=require('fs'),path=require('path');
const root=process.cwd();
const asset=fs.readFileSync(path.join(root,'assets/progress-resume.js'),'utf8');
function need(x,msg){if(!x)throw new Error(msg)}
need(asset.includes("courses_progress_v1"),'must reuse canonical course progress');
need(asset.includes("csai_resume_v1"),'resume state missing');
need(asset.includes("data-csai-next"),'next-lesson completion integration missing');
need(asset.includes('setLessonDone'),'resume layer must persist lesson completion itself');
need(asset.includes('ensureCompletionControls'),'resume layer must add fallback completion controls');
need(asset.includes("Published\\s*✓")||asset.includes('Published\\s*✓'),'project completion tracking missing');
need(asset.includes('tests\\s+passed'),'exercise-pass tracking missing');
need(asset.includes('Continue studying'),'clickable Continue action missing');
need(asset.includes('location.hash'),'direct lesson hash navigation missing');
const courses=fs.readdirSync(path.join(root,'courses')).filter(f=>f.endsWith('.html'));
need(courses.length===62,`expected 62 generated course pages, got ${courses.length}`);
let lessons=0, controls=0;
for(const f of courses){const t=fs.readFileSync(path.join(root,'courses',f),'utf8');need(t.includes('../assets/progress-resume.js?v=20260822-v567'),`${f}: resume tracker missing`);const lessonMatches=t.match(/data-lesson=\"[^\"]+\"/g)||[];const completeMatches=t.match(/data-complete(?:=\"\")?/g)||[];lessons+=lessonMatches.length;controls+=completeMatches.length;}
need(lessons===800,`expected 800 lesson rows, got ${lessons}`);
need(controls>=800,`expected completion controls for all 800 lessons, got ${controls}`);
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');need(index.includes('assets/progress-resume.js?v=20260822-v567'),'homepage resume tracker missing');
console.log(`Progress/resume contract passed across ${courses.length} course pages and all ${lessons} lessons.`);
