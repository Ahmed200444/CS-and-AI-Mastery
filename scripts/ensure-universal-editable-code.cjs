'use strict';

// Generated course pages are preserved after their first build. Normalize the
// shared learning layers so every existing and future course receives the same
// editable-code, accelerator, and calm-study behavior.
const fs = require('fs');
const path = require('path');

const coursesDir = path.join(process.cwd(), 'courses');
const tags = [
  '<script defer src="../assets/universal-editable-code.js?v=20260919-v577"></script>',
  '<script defer src="../assets/runner-performance-guard.js?v=20260822-v567"></script>',
  '<script defer src="../assets/calm-study-flow.js?v=20260822-v567"></script>',
  '<script defer src="../assets/progressive-lesson-layout.js?v=20260822-v567"></script>',
  '<script defer src="../assets/python-inline-terminal.js?v=20260822-v567"></script>',
  '<script defer src="../assets/vscode-diagnostics.js?v=20260822-v567"></script>',
  '<script defer src="../assets/progress-resume.js?v=20260822-v567"></script>',
  '<script defer src="../assets/try-it-yourself-v568.js?v=20260822-v568"></script>',
  '<script defer src="../assets/conceptual-examples-v574.js?v=20260824-v574"></script>',
  '<script defer src="../assets/program-questions-v574.js?v=20260824-v574"></script>',
  '<script defer src="../assets/exam-style-problem-statements-v565.js?v=20260822-v567"></script>',
  '<script defer src="../assets/study-examples.js?v=20260824-v574"></script>',
  '<script defer src="../assets/practice-guidance.js?v=20260823-v573"></script>',
  '<script defer src="../assets/purpose-first-prompts.js?v=20260822-v567"></script>'
].join('\n');
let normalized = 0;

for (const name of fs.readdirSync(coursesDir).filter(name => name.endsWith('.html'))) {
  const file = path.join(coursesDir, name);
  let html = fs.readFileSync(file, 'utf8');
  const original = html;
  html = html
    .replace(/\s*<script\b[^>]*\bsrc=["'](?:\.\.\/|\/)assets\/(?:universal-editable-code|runner-performance-guard|calm-study-flow|progressive-lesson-layout|python-inline-terminal|vscode-diagnostics|progress-resume|try-it-yourself-v568|conceptual-examples-v574|program-questions-v574|exam-style-problem-statements-v565|study-examples|practice-guidance|purpose-first-prompts)\.js[^"']*["'][^>]*><\/script>/gi, '')
    .replace(/<h3>Explanation<\/h3><p class="lesson-main-explanation"(?:\s+data-main-explanation)?>([\s\S]*?)<\/p>/g, '<section class="lesson-main-explanation" data-main-explanation><h3>Explanation</h3><p>$1</p></section>')
    .replace(/class="lesson-main-explanation"(?![^>]*\bdata-main-explanation\b)/g, 'class="lesson-main-explanation" data-main-explanation');
  // Put deferred shared layers in the head. The Python terminal must be
  // discovered before adaptive tooling begins, and defer preserves this order.
  const headEnd = html.toLowerCase().indexOf('</head>');
  const marker = /<script\b[^>]*\bsrc=["'](?:\.\.\/|\/)assets\/line-by-line-explanations\.js[^"']*["'][^>]*><\/script>/i.exec(html);
  const index = headEnd >= 0 ? headEnd : (marker ? marker.index : -1);
  if (index < 0) throw new Error(`${name}: no insertion point for shared learning layers`);
  html = html.slice(0, index) + tags + '\n' + html.slice(index);
  if (html !== original) {
    fs.writeFileSync(file, html, 'utf8');
    normalized += 1;
  }
}

console.log(`Shared editable-code, acceleration, and calm-study layers normalized on ${normalized} course pages.`);
