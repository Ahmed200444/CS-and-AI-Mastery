const fs = require('fs');
const path = require('path');
const indexPath = path.join(process.cwd(), 'index.html');
if (!fs.existsSync(indexPath)) throw new Error('index.html is missing');
let html = fs.readFileSync(indexPath, 'utf8');
const match = html.match(/(<script\b[^>]*\bid=["']coursedata["'][^>]*>)([\s\S]*?)(<\/script>)/i);
if (!match || match.index == null) throw new Error('coursedata script was not found');
const raw = match[2];
const offsets = {};
let i = 0;
while (i < raw.length && /\s/.test(raw[i])) i++;
if (raw[i] !== '[') throw new Error('coursedata is not a JSON array');
i++;
while (i < raw.length) {
  while (i < raw.length && (raw[i] === ',' || /\s/.test(raw[i]))) i++;
  if (raw[i] === ']') break;
  if (raw[i] !== '{') throw new Error(`Expected course object at ${i}`);
  const start = i;
  let depth = 0, inString = false, escaped = false;
  for (; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { i++; break; }
    }
  }
  const end = i;
  const course = JSON.parse(raw.slice(start, end));
  if (!course || typeof course.id !== 'string' || !course.id) throw new Error('Course object has no id');
  if (offsets[course.id]) throw new Error(`Duplicate course id: ${course.id}`);
  offsets[course.id] = [start, end];
}
const ids = Object.keys(offsets);
if (ids.length !== 54) throw new Error(`Expected 54 course offsets, found ${ids.length}`);
const indexId = 'csai-course-offset-index';
html = html.replace(new RegExp(`<script\\b[^>]*\\bid=["']${indexId}["'][^>]*>[\\s\\S]*?<\\/script>\\s*`, 'gi'), '');
const offsetTag = `<script id="${indexId}">window.__CSAI_COURSE_OFFSETS__=${JSON.stringify(offsets)};</script>`;
html = html.replace(/<script[^>]*src=["']\/assets\/catalog-course-viewer\.js[^"']*["'][^>]*><\/script>\s*/gi, '');
html = html.replace(/<script[^>]*src=["']\/assets\/instant-course-viewer\.js[^"']*["'][^>]*><\/script>\s*/gi, '');
const themeMatch = html.match(/<script[^>]*src=["']\/assets\/course-theme-toggle\.js[^"']*["'][^>]*><\/script>/i);
const tag = `${offsetTag}\n<script src="/assets/instant-course-viewer.js?v=20260807-1"></script>`;
if (themeMatch && themeMatch.index != null) html = html.slice(0, themeMatch.index) + tag + '\n' + html.slice(themeMatch.index);
else {
  const body = html.toLowerCase().lastIndexOf('</body>');
  html = body >= 0 ? html.slice(0, body) + tag + '\n' + html.slice(body) : html + '\n' + tag;
}
fs.writeFileSync(indexPath, html, 'utf8');
const out = fs.readFileSync(indexPath, 'utf8');
if ((out.match(/\/assets\/instant-course-viewer\.js/g) || []).length !== 1) throw new Error('Expected exactly one instant course viewer');
if ((out.match(/\/assets\/catalog-course-viewer\.js/g) || []).length !== 0) throw new Error('Old network course viewer is still present');
if ((out.match(new RegExp(`id=["']${indexId}["']`, 'g')) || []).length !== 1) throw new Error('Expected exactly one course offset index');
console.log(`Injected zero-network instant course viewer for ${ids.length} courses.`);
