const fs = require('fs');
const path = require('path');

const root = process.cwd();
const indexPath = path.join(root, 'index.html');
const coursesDir = path.join(root, 'courses');
const cssRelRoot = 'assets/unified-learning-design.css';
const jsRelRoot = 'assets/unified-learning-design.js';
const cssRelCourse = '../assets/unified-learning-design.css';
const jsRelCourse = '../assets/unified-learning-design.js';
const START = '<!-- csai-unified-design:start -->';
const END = '<!-- csai-unified-design:end -->';

if (!fs.existsSync(indexPath)) throw new Error('index.html missing');
if (!fs.existsSync(path.join(root, cssRelRoot))) throw new Error(`${cssRelRoot} missing`);
if (!fs.existsSync(path.join(root, jsRelRoot))) throw new Error(`${jsRelRoot} missing`);

function stripExisting(html){
  const marker = new RegExp(`\\n?${START.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}\\n?`, 'g');
  html = html.replace(marker, '\n');
  // Compatibility cleanup for an earlier unmarked development version.
  return html
    .replace(/\n?<link rel="stylesheet" href="(?:\.\.\/)?assets\/unified-learning-design\.css">\n?/g, '\n')
    .replace(/\n?<script>document\.documentElement\.classList\.add\('csai-unified-design'\)<\/script>\n?/g, '\n')
    .replace(/\n?<script src="(?:\.\.\/)?assets\/unified-learning-design\.js" defer><\/script>\n?/g, '\n');
}

function inject(html, cssHref, jsSrc){
  html = stripExisting(html);
  const tags = `${START}\n<link rel="stylesheet" href="${cssHref}">\n<script>document.documentElement.classList.add('csai-unified-design')</script>\n<script src="${jsSrc}" defer></script>\n${END}`;
  if (html.includes('</head>')) {
    html = html.replace(/\s*<\/head>/, `\n\n${tags}\n</head>`);
    return html;
  }
  return tags + '\n' + html;
}

let index = fs.readFileSync(indexPath, 'utf8');
index = inject(index, cssRelRoot, jsRelRoot);

// Remove the stale hard-coded 2-available/5-planned hub copy. The actual CE path
// already derives available/planned cards from its own arrays; this visible sentence
// was the remaining stale count after later courses shipped.
index = index.replace(
  /A separate path through systems fundamentals[^<]*2 courses available now \(Computer Architecture, Computer Networks\), 5 more stages planned/,
  'A structured systems path using the courses available now, with future stages separated clearly until real course content exists'
);

// Shorten the repetitive disabled-button copy. Runtime enhancement will turn a
// planned stage into an active course automatically if a matching real course is
// ever added to coursedata; until then it remains honestly unavailable.
index = index.replace(
  'title="This course is planned and is not available yet.">This course is planned and is not available yet</button>',
  'title="This stage is planned and has no course content yet.">Planned — not available yet</button>'
);

fs.writeFileSync(indexPath, index);

let courseCount = 0;
if (fs.existsSync(coursesDir)) {
  const files = fs.readdirSync(coursesDir).filter(f => f.endsWith('.html'));
  for (const file of files) {
    const p = path.join(coursesDir, file);
    const html = inject(fs.readFileSync(p, 'utf8'), cssRelCourse, jsRelCourse);
    fs.writeFileSync(p, html);
    courseCount++;
  }
}

console.log(`Unified learning design injected into index.html and ${courseCount} generated course pages.`);
