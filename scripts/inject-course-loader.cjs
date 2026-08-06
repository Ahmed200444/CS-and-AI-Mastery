const fs = require('fs');
const path = require('path');

const indexPath = path.join(process.cwd(), 'index.html');
const loaderPath = '/assets/course-practice-routing.js?v=20260807-1';
const loaderTag = `<script type="module" src="${loaderPath}"></script>`;
const catalogStyleId = 'catalog-select-visibility-fix';
const catalogStyle = `<style id="${catalogStyleId}">
/* Keep native select menus readable in both dark and light browser themes. */
.cx-select { color-scheme: dark; }
.cx-select option,
.cx-select optgroup {
  background: #111a26 !important;
  color: #f3f7fb !important;
}
body[data-theme="light"] .cx-select { color-scheme: light; }
body[data-theme="light"] .cx-select option,
body[data-theme="light"] .cx-select optgroup {
  background: #ffffff !important;
  color: #211f2b !important;
}
</style>`;

if (!fs.existsSync(indexPath)) {
  throw new Error(`Cannot find ${indexPath}`);
}

let html = fs.readFileSync(indexPath, 'utf8');

function readJsonScript(id) {
  const re = new RegExp(`(<script\\b[^>]*\\bid=["']${id}["'][^>]*>)([\\s\\S]*?)(<\\/script>)`, 'i');
  const match = html.match(re);
  if (!match) return null;
  return { re, match, value: JSON.parse(match[2]) };
}

function numericOrder(course) {
  const candidates = [
    course.displayOrder,
    course.roadmapOrder,
    course.roadmapStep,
    course.order,
    course.step
  ];
  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const parsed = Number.parseFloat(String(value == null ? '' : value).match(/\d+(?:\.\d+)?/)?.[0]);
    if (Number.isFinite(parsed)) return parsed;
  }
  return Number.POSITIVE_INFINITY;
}

function sortCoursesByLearningOrder(courses, categories) {
  const originalIndex = new Map(courses.map((course, index) => [course.id, index]));
  const categoryIndex = new Map((categories || []).map((category, index) => [category.id, index]));
  const byId = new Map(courses.map(course => [course.id, course]));

  const baseCompare = (a, b) => {
    const categoryA = categoryIndex.has(a.category) ? categoryIndex.get(a.category) : Number.MAX_SAFE_INTEGER;
    const categoryB = categoryIndex.has(b.category) ? categoryIndex.get(b.category) : Number.MAX_SAFE_INTEGER;
    if (categoryA !== categoryB) return categoryA - categoryB;

    const orderA = numericOrder(a);
    const orderB = numericOrder(b);
    if (orderA !== orderB) return orderA - orderB;

    return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0);
  };

  const indegree = new Map(courses.map(course => [course.id, 0]));
  const dependants = new Map(courses.map(course => [course.id, []]));

  for (const course of courses) {
    const uniquePrerequisites = [...new Set(course.prerequisites || [])]
      .filter(id => id !== course.id && byId.has(id));
    indegree.set(course.id, uniquePrerequisites.length);
    for (const prerequisiteId of uniquePrerequisites) {
      dependants.get(prerequisiteId).push(course.id);
    }
  }

  const ready = courses.filter(course => indegree.get(course.id) === 0).sort(baseCompare);
  const ordered = [];

  while (ready.length) {
    const course = ready.shift();
    ordered.push(course);
    for (const dependantId of dependants.get(course.id) || []) {
      indegree.set(dependantId, indegree.get(dependantId) - 1);
      if (indegree.get(dependantId) === 0) {
        ready.push(byId.get(dependantId));
        ready.sort(baseCompare);
      }
    }
  }

  // Preserve every course even if legacy prerequisite data contains a cycle.
  if (ordered.length !== courses.length) {
    const included = new Set(ordered.map(course => course.id));
    ordered.push(...courses.filter(course => !included.has(course.id)).sort(baseCompare));
  }

  return ordered;
}

// Sort the deployed catalog into a prerequisite-safe learning sequence while
// preserving the existing category order and stable order for ties.
const courseData = readJsonScript('coursedata');
const categoryData = readJsonScript('categorydata');
if (courseData) {
  const orderedCourses = sortCoursesByLearningOrder(
    courseData.value,
    categoryData ? categoryData.value : []
  );
  const safeJson = JSON.stringify(orderedCourses).replace(/<\//g, '<\\/');
  html = html.replace(
    courseData.re,
    `${courseData.match[1]}${safeJson}${courseData.match[3]}`
  );
  console.log(`Ordered ${orderedCourses.length} courses by prerequisites and roadmap order`);
}

// Remove any prior copy before inserting the current dropdown visibility fix.
html = html.replace(
  new RegExp(`<style\\b[^>]*\\bid=["']${catalogStyleId}["'][^>]*>[\\s\\S]*?<\\/style>\\s*`, 'gi'),
  ''
);
const closingHead = html.toLowerCase().lastIndexOf('</head>');
if (closingHead >= 0) {
  html = `${html.slice(0, closingHead)}${catalogStyle}\n${html.slice(closingHead)}`;
} else {
  html = `${catalogStyle}\n${html}`;
}

// Keep the source file untouched in GitHub. This only patches the deploy copy.
// Remove older direct loader tags so each deploy has exactly one current loader.
html = html.replace(
  /<script[^>]*src=["']\/assets\/course-practice-routing\.js[^"']*["'][^>]*><\/script>\s*/gi,
  ''
);

const closingBody = html.toLowerCase().lastIndexOf('</body>');
if (closingBody >= 0) {
  html = `${html.slice(0, closingBody)}${loaderTag}\n${html.slice(closingBody)}`;
} else {
  html += `\n${loaderTag}\n`;
}

fs.writeFileSync(indexPath, html, 'utf8');

const result = fs.readFileSync(indexPath, 'utf8');
const loaderMatches = result.match(/\/assets\/course-practice-routing\.js/g) || [];
const styleMatches = result.match(new RegExp(`id=["']${catalogStyleId}["']`, 'g')) || [];
if (loaderMatches.length !== 1) {
  throw new Error(`Expected exactly one course loader, found ${loaderMatches.length}`);
}
if (styleMatches.length !== 1) {
  throw new Error(`Expected exactly one catalog select style, found ${styleMatches.length}`);
}

console.log(`Injected ${loaderPath} and catalog fixes into deploy copy of index.html`);
