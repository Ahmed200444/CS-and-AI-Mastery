const fs = require('fs');
const path = require('path');

const root = process.cwd();
const indexPath = path.join(root, 'index.html');
const coursesDir = path.join(root, 'courses');
const cssRelRoot = 'assets/unified-learning-design.css';
const jsRelRoot = 'assets/unified-learning-design.js';
const productCssRoot = 'assets/product-redesign-v2.css';
const productJsRoot = 'assets/product-redesign-v2.js';
const liveCssRoot = 'assets/adaptive-v4-live.css';
const liveJsRoot = 'assets/adaptive-v4-live.js';
const cssRelCourse = '../assets/unified-learning-design.css';
const jsRelCourse = '../assets/unified-learning-design.js';
const productCssCourse = '../assets/product-redesign-v2.css';
const productJsCourse = '../assets/product-redesign-v2.js';
const liveCssCourse = '../assets/adaptive-v4-live.css';
const liveJsCourse = '../assets/adaptive-v4-live.js';
const START = '<!-- csai-unified-design:start -->';
const END = '<!-- csai-unified-design:end -->';
const V4 = '20260810-v4-live-2';

[indexPath, path.join(root, cssRelRoot), path.join(root, jsRelRoot), path.join(root, productCssRoot), path.join(root, productJsRoot), path.join(root, liveCssRoot), path.join(root, liveJsRoot)].forEach(p => {
  if (!fs.existsSync(p)) throw new Error(`${path.relative(root,p)} missing`);
});

function stripExisting(html){
  const marker = new RegExp(`\\n?${START.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}\\n?`, 'g');
  html = html.replace(marker, '\n');
  return html
    .replace(/\n?<link rel="stylesheet" href="(?:\.\.\/)?assets\/unified-learning-design\.css[^"']*">\n?/g, '\n')
    .replace(/\n?<link rel="stylesheet" href="(?:\.\.\/)?assets\/product-redesign-v2\.css[^"']*">\n?/g, '\n')
    .replace(/\n?<link rel="stylesheet" href="(?:\.\.\/)?assets\/adaptive-v4-live\.css[^"']*">\n?/g, '\n')
    .replace(/\n?<script>document\.documentElement\.classList\.add\('csai-unified-design'\)<\/script>\n?/g, '\n')
    .replace(/\n?<script src="(?:\.\.\/)?assets\/unified-learning-design\.js[^"']*" defer><\/script>\n?/g, '\n')
    .replace(/\n?<script src="(?:\.\.\/)?assets\/product-redesign-v2\.js[^"']*" defer><\/script>\n?/g, '\n')
    .replace(/\n?<script src="(?:\.\.\/)?assets\/adaptive-v4-live\.js[^"']*" defer><\/script>\n?/g, '\n');
}

function inject(html, cssHref, jsSrc, productCss, productJs, liveCss, liveJs){
  html = stripExisting(html);
  const tags = `${START}\n<link rel="stylesheet" href="${cssHref}">\n<link rel="stylesheet" href="${productCss}">\n<link rel="stylesheet" href="${liveCss}?v=${V4}">\n<script>document.documentElement.classList.add('csai-unified-design')</script>\n<script src="${jsSrc}" defer></script>\n<script src="${productJs}" defer></script>\n<script src="${liveJs}?v=${V4}" defer></script>\n${END}`;
  if (html.includes('</head>')) return html.replace(/\s*<\/head>/, `\n\n${tags}\n</head>`);
  return tags + '\n' + html;
}

let index = fs.readFileSync(indexPath, 'utf8');
index = inject(index, cssRelRoot, jsRelRoot, productCssRoot, productJsRoot, liveCssRoot, liveJsRoot);
index = index.replace(
  /A separate path through systems fundamentals[^<]*2 courses available now \(Computer Architecture, Computer Networks\), 5 more stages planned/,
  'A structured systems path using the courses available now, with future stages separated clearly until real course content exists'
);
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
    const html = inject(fs.readFileSync(p, 'utf8'), cssRelCourse, jsRelCourse, productCssCourse, productJsCourse, liveCssCourse, liveJsCourse);
    fs.writeFileSync(p, html);
    courseCount++;
  }
}
console.log(`Approved Adaptive v4 design injected into index.html and ${courseCount} generated course pages.`);
