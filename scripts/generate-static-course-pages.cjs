const fs = require('fs');
const path = require('path');

const root = process.cwd();
const indexPath = path.join(root, 'index.html');
const catalogPath = path.join(root, 'assets', 'catalog-data.json');
const courseDataDir = path.join(root, 'assets', 'course-data');
const outDir = path.join(root, 'courses');

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);
}
function arr(value) { return Array.isArray(value) ? value : []; }
function list(value) { return Array.isArray(value) ? value : (value ? [value] : []); }
function examples(lesson) {
  const value = lesson.examples || lesson.example;
  return Array.isArray(value) ? value : (value ? [value] : []);
}
function lessonExplanation(lesson) {
  return lesson.explanation || lesson.explain || lesson.description || 'Study the concept, review the example, and practise it before moving on.';
}
function lessonOrder(course) {
  return arr(course.lessons)
    .map((lesson, index) => ({ lesson, index }))
    .sort((a, b) => {
      let x = Number(a.lesson.displayOrder), y = Number(b.lesson.displayOrder);
      if (!Number.isFinite(x)) x = a.index;
      if (!Number.isFinite(y)) y = b.index;
      return x - y;
    });
}
function safeCourseId(id) {
  if (typeof id !== 'string' || !/^[A-Za-z0-9._-]+$/.test(id)) throw new Error(`Unsafe course id: ${id}`);
  return id;
}

if (!fs.existsSync(indexPath)) throw new Error('index.html is missing');
if (!fs.existsSync(catalogPath)) throw new Error('catalog-data.json is missing');
if (!fs.existsSync(courseDataDir)) throw new Error('course-data directory is missing');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!catalog || !Array.isArray(catalog.courses) || catalog.courses.length !== 54) {
  throw new Error(`Expected 54 catalog courses, found ${catalog && catalog.courses ? catalog.courses.length : 0}`);
}

const THEME_HEAD = `<script>(function(){try{var t=localStorage.getItem('cs-ai-mastery-theme')||localStorage.getItem('theme')||'light';document.documentElement.dataset.theme=t==='dark'?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}})();</script>`;
const CSS = `
:root{color-scheme:light;--bg:#f4f7fb;--panel:#fff;--text:#172231;--muted:#5d6c7c;--border:#d8e1ea;--pill:#e8f1f8;--pilltext:#174b72;--accent:#17649a;--code:#101827;--note:#fff7e7}
html[data-theme="dark"]{color-scheme:dark;--bg:#0f1720;--panel:#17212c;--text:#edf3f8;--muted:#c6d1da;--border:#344352;--pill:#223446;--pilltext:#b9dcf5;--accent:#4da3df;--code:#0b111b;--note:#2b2417}
*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--bg);color:var(--text);font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.wrap{max-width:1100px;margin:auto;padding:18px 20px 110px}.top{position:sticky;top:0;z-index:4;display:flex;justify-content:space-between;gap:10px;padding:10px 0;background:var(--bg)}.btn{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;border:1px solid #b8c7d6;border-radius:9px;padding:9px 13px;background:var(--panel);color:var(--text);font:inherit;font-weight:800;cursor:pointer}.primary{background:var(--accent);color:#fff;border-color:var(--accent)}.hero,.card,.lesson{background:var(--panel);border:1px solid var(--border);border-radius:15px;color:var(--text)}.hero{padding:22px;margin:8px 0 16px}.kicker{font-size:.74rem;letter-spacing:.1em;font-weight:900;color:var(--accent)}.hero h1{margin:5px 0 8px;font-size:clamp(2rem,4vw,3.2rem);line-height:1.08}.muted{color:var(--muted)}.meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.pill{padding:4px 8px;border-radius:999px;background:var(--pill);color:var(--pilltext);font-size:.78rem;font-weight:800}.progress{height:10px;border-radius:999px;background:var(--border);overflow:hidden;margin:14px 0 5px}.progress span{display:block;height:100%;background:#16805b}.lessons{display:grid;gap:11px}.lesson{overflow:hidden}.lesson summary{display:flex;align-items:center;gap:10px;padding:14px 16px;cursor:pointer;font-weight:850}.num{display:grid;place-items:center;min-width:34px;height:28px;border-radius:8px;background:var(--pill);color:var(--pilltext)}.title{flex:1}.check{display:flex;gap:6px;align-items:center;font-size:.82rem;font-weight:700}.body{padding:0 16px 18px}.body h3{margin:17px 0 7px;font-size:1rem}.body p,.body li{line-height:1.68}.code{white-space:pre-wrap;overflow:auto;padding:13px;border-radius:10px;background:var(--code);color:#f4f7fb;font:500 .86rem/1.55 ui-monospace,SFMono-Regular,Consolas,monospace}.note{margin-top:12px;padding:12px;border-left:4px solid #d28b23;border-radius:8px;background:var(--note)}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px}.card{padding:17px}.card h2{margin:0 0 10px}.item{padding:12px;margin:9px 0;border-radius:10px;background:var(--bg);border:1px solid var(--border)}.answer{width:100%;min-height:90px;margin-top:8px;padding:10px;border:1px solid #aebdca;border-radius:8px;background:transparent;color:inherit;font:inherit}.theme{position:fixed;right:22px;bottom:22px;z-index:20;border:1px solid #b8c7d6;border-radius:999px;padding:10px 16px;background:var(--panel);color:var(--text);font:800 14px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.16);cursor:pointer}.empty{padding:17px;border:1px dashed var(--border);border-radius:10px}.hero-icon{margin-right:.25em}@media(max-width:720px){.wrap{padding:10px 10px 100px}.grid{grid-template-columns:1fr}.top .btn{flex:1}.lesson summary{flex-wrap:wrap;align-items:flex-start}.check{width:100%;padding-left:44px}.theme{right:14px;bottom:14px;padding:10px 14px}}
`;

function lessonHtml(course, entry, index) {
  const lesson = entry.lesson;
  const id = lesson.id || `lesson-${index}`;
  const objectives = list(lesson.objectives);
  const concepts = list(lesson.concepts);
  const mistakes = list(lesson.commonMistakes || lesson.commonMistake);
  const exs = examples(lesson);
  return `<details class="lesson" data-lesson="${esc(id)}" ${index === 0 ? 'open' : ''}>
<summary><span class="num">${String(index + 1).padStart(2, '0')}</span><span class="title">${esc(lesson.title || `Lesson ${index + 1}`)}</span><label class="check"><input type="checkbox" data-complete> Complete</label></summary>
<div class="body">
${objectives.length ? `<h3>What you will learn</h3><ul>${objectives.map(v => `<li>${esc(v)}</li>`).join('')}</ul>` : ''}
<h3>Explanation</h3><p>${esc(lessonExplanation(lesson))}</p>
${concepts.length ? `<h3>Key concepts</h3><div class="meta">${concepts.map(v => `<span class="pill">${esc(v)}</span>`).join('')}</div>` : ''}
${exs.length ? `<h3>Example</h3>${exs.map(v => `<pre class="code">${esc(v)}</pre>`).join('')}` : ''}
${mistakes.length ? `<div class="note"><b>Common mistake:</b> ${esc(mistakes.join(' • '))}</div>` : ''}
</div></details>`;
}
function exerciseHtml(item, index) {
  return `<div class="item"><b>${esc(item.title || `Exercise ${index + 1}`)}</b><p>${esc(item.prompt || item.description || 'Complete this exercise using what you learned in the course.')}</p>${item.hint ? `<details><summary>Hint</summary><p>${esc(item.hint)}</p></details>` : ''}<textarea class="answer" placeholder="Write code or notes here..."></textarea></div>`;
}
function quizHtml(item, index) {
  const question = item.q || item.question || item.prompt || `Question ${index + 1}`;
  const options = arr(item.options);
  return `<div class="item"><b>${esc(question)}</b>${options.length ? `<ol>${options.map(v => `<li>${esc(v)}</li>`).join('')}</ol>` : ''}<textarea class="answer" placeholder="Write your answer..."></textarea></div>`;
}
function projectHtml(item, index) {
  return `<div class="item"><b>${esc(item.title || item.name || `Project ${index + 1}`)}</b><p>${esc(item.description || item.desc || item.prompt || 'Build this project and document what you learned.')}</p></div>`;
}

function pageFor(course) {
  const lessons = lessonOrder(course);
  const exercises = arr(course.exercises);
  const quiz = arr(course.quiz);
  let projects = arr(course.projects).slice();
  if (course.capstone) projects.push(course.capstone);
  const safeCourseJson = JSON.stringify({ id: course.id, lessonIds: lessons.map((entry, i) => entry.lesson.id || `lesson-${i}`) }).replace(/<\//g, '<\\/');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(course.title || course.id)} — CS & AI Mastery</title>${THEME_HEAD}<style>${CSS}</style></head><body>
<main class="wrap"><div class="top"><a class="btn" href="/#courses">← All courses</a><a class="btn primary" href="/#hub">Home</a></div>
<section class="hero"><div class="kicker">COURSE</div><h1><span class="hero-icon">${esc(course.icon || '📘')}</span>${esc(course.title || course.id)}</h1><p class="muted">${esc(course.blurb || course.description || 'Complete the lessons in order and practise each concept.')}</p><div class="meta"><span class="pill">${lessons.length} lessons</span><span class="pill">${exercises.length} exercises</span><span class="pill">${quiz.length} checkpoints</span><span class="pill">${projects.length} projects</span></div><div class="progress"><span data-progress-bar style="width:0%"></span></div><div class="muted" data-progress-status>0 of ${lessons.length} lessons complete</div></section>
<section class="lessons">${lessons.length ? lessons.map((entry, i) => lessonHtml(course, entry, i)).join('') : '<div class="empty">No lesson content is listed for this course yet.</div>'}</section>
<div class="grid"><section class="card"><h2>Exercises</h2>${exercises.length ? exercises.map(exerciseHtml).join('') : '<p class="muted">No separate exercises are listed.</p>'}</section><section class="card"><h2>Knowledge checks</h2>${quiz.length ? quiz.map(quizHtml).join('') : '<p class="muted">No separate checkpoints are listed.</p>'}</section></div>
<section class="card" style="margin-top:14px"><h2>Projects</h2>${projects.length ? projects.map(projectHtml).join('') : '<p class="muted">No separate projects are listed.</p>'}</section></main>
<button class="theme" type="button" data-theme-toggle></button>
<script type="application/json" id="course-page-meta">${safeCourseJson}</script>
<script>(function(){'use strict';var KEY='cs-ai-mastery-theme',PROGRESS='courses_progress_v1',meta=JSON.parse(document.getElementById('course-page-meta').textContent),courseId=meta.id,lessonIds=meta.lessonIds;function read(){try{return JSON.parse(localStorage.getItem(PROGRESS)||'{}')||{}}catch(e){return{}}}function save(v){try{localStorage.setItem(PROGRESS,JSON.stringify(v))}catch(e){}}function update(){var p=read(),m=((p[courseId]||{}).lessons||{}),done=0;lessonIds.forEach(function(id){if(m[id])done++});var pct=lessonIds.length?Math.round(done/lessonIds.length*100):0;var bar=document.querySelector('[data-progress-bar]'),status=document.querySelector('[data-progress-status]');if(bar)bar.style.width=pct+'%';if(status)status.textContent=done+' of '+lessonIds.length+' lessons complete';document.querySelectorAll('[data-lesson]').forEach(function(el){var cb=el.querySelector('[data-complete]');if(cb)cb.checked=!!m[el.getAttribute('data-lesson')]})}document.addEventListener('change',function(e){if(!e.target.matches('[data-complete]'))return;var lesson=e.target.closest('[data-lesson]');if(!lesson)return;var p=read();p[courseId]=p[courseId]||{};p[courseId].lessons=p[courseId].lessons||{};p[courseId].lessons[lesson.getAttribute('data-lesson')]=!!e.target.checked;save(p);update()});function theme(){var t=document.documentElement.dataset.theme==='dark'?'dark':'light',b=document.querySelector('[data-theme-toggle]');if(b)b.textContent=t==='dark'?'☀️ Light':'🌙 Dark'}document.querySelector('[data-theme-toggle]').addEventListener('click',function(){var next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;try{localStorage.setItem(KEY,next);localStorage.setItem('theme',next)}catch(e){}theme()});update();theme()})();</script></body></html>`;
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const summary of catalog.courses) {
  const id = safeCourseId(summary.id);
  const fullPath = path.join(courseDataDir, `${id}.json`);
  if (!fs.existsSync(fullPath)) throw new Error(`Missing generated course data for ${id}`);
  const course = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  if (!course || course.id !== id) throw new Error(`Invalid course data for ${id}`);
  fs.writeFileSync(path.join(outDir, `${id}.html`), pageFor(course), 'utf8');
}

let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(/<script\b[^>]*\bid=["']csai-course-offset-index["'][^>]*>[\s\S]*?<\/script>\s*/gi, '');
html = html.replace(/<script[^>]*src=["']\/assets\/catalog-course-viewer\.js[^"']*["'][^>]*><\/script>\s*/gi, '');
html = html.replace(/<script[^>]*src=["']\/assets\/instant-course-viewer\.js[^"']*["'][^>]*><\/script>\s*/gi, '');
html = html.replace(/<script\b[^>]*\bid=["']csai-static-course-navigation["'][^>]*>[\s\S]*?<\/script>\s*/gi, '');
const navTag = `<script id="csai-static-course-navigation">(function(){window.cxOpen=function(id){id=String(id||'').replace(/[^A-Za-z0-9._-]/g,'');if(!id)return;location.href='/courses/'+encodeURIComponent(id)+'.html';};})();</script>`;
const bodyEnd = html.toLowerCase().lastIndexOf('</body>');
html = bodyEnd >= 0 ? html.slice(0, bodyEnd) + navTag + '\n' + html.slice(bodyEnd) : html + '\n' + navTag;
fs.writeFileSync(indexPath, html, 'utf8');

const generated = fs.readdirSync(outDir).filter(name => name.endsWith('.html'));
if (generated.length !== 54) throw new Error(`Expected 54 static course pages, generated ${generated.length}`);
const pythonPage = fs.readFileSync(path.join(outDir, 'python.html'), 'utf8');
if (!pythonPage.includes('Python') || !pythonPage.includes('Variables &amp; types') && !pythonPage.includes('Variables & types')) throw new Error('Python static page validation failed');
const finalIndex = fs.readFileSync(indexPath, 'utf8');
if ((finalIndex.match(/csai-static-course-navigation/g) || []).length !== 1) throw new Error('Expected one static course navigation shim');
if (/catalog-course-viewer\.js|instant-course-viewer\.js/.test(finalIndex)) throw new Error('A legacy dynamic course viewer is still referenced');
console.log(`Generated ${generated.length} static course pages. Course opening now uses direct static HTML navigation with no course-data fetch or timeout path.`);
