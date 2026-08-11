const fs = require('fs');
const path = require('path');

const indexPath = path.join(process.cwd(), 'index.html');
const catalogDataPath = path.join(process.cwd(), 'assets', 'catalog-data.json');
const courseDataDir = path.join(process.cwd(), 'assets', 'course-data');
const loaderPath = '/assets/course-practice-routing.js?v=20260807-2';
const guardPath = '/assets/course-route-visibility-guard.js?v=20260807-2';
const catalogPath = '/assets/catalog-recovery.js?v=20260807-3';
const viewerPath = '/assets/catalog-course-viewer.js?v=20260807-2';
const loaderTag = `<script type="module" src="${loaderPath}"></script>`;
const guardTag = `<script src="${guardPath}"></script>`;
const catalogTag = `<script src="${catalogPath}"></script>`;
const viewerTag = `<script src="${viewerPath}"></script>`;
const catalogStyleId = 'catalog-select-visibility-fix';
const catalogStyle = `<style id="${catalogStyleId}">
.cx-select { color-scheme: dark; }
.cx-select option,
.cx-select optgroup { background: #111a26 !important; color: #f3f7fb !important; }
body[data-theme="light"] .cx-select { color-scheme: light; }
body[data-theme="light"] .cx-select option,
body[data-theme="light"] .cx-select optgroup { background: #ffffff !important; color: #211f2b !important; }
</style>`;

if (!fs.existsSync(indexPath)) throw new Error(`Cannot find ${indexPath}`);
let html = fs.readFileSync(indexPath, 'utf8');

function readJsonScript(id) {
  const re = new RegExp(`(<script\\b[^>]*\\bid=["']${id}["'][^>]*>)([\\s\\S]*?)(<\\/script>)`, 'i');
  const match = html.match(re);
  if (!match) return null;
  return { re, match, value: JSON.parse(match[2]) };
}

function numericOrder(course) {
  for (const value of [course.displayOrder, course.roadmapOrder, course.roadmapStep, course.order, course.step]) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const match = String(value == null ? '' : value).match(/\d+(?:\.\d+)?/);
    const parsed = Number.parseFloat(match ? match[0] : '');
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
    const orderA = numericOrder(a), orderB = numericOrder(b);
    if (orderA !== orderB) return orderA - orderB;
    return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0);
  };
  const indegree = new Map(courses.map(course => [course.id, 0]));
  const dependants = new Map(courses.map(course => [course.id, []]));
  for (const course of courses) {
    const prerequisites = [...new Set(course.prerequisites || [])].filter(id => id !== course.id && byId.has(id));
    indegree.set(course.id, prerequisites.length);
    for (const id of prerequisites) dependants.get(id).push(course.id);
  }
  const ready = courses.filter(course => indegree.get(course.id) === 0).sort(baseCompare);
  const ordered = [];
  while (ready.length) {
    const course = ready.shift(); ordered.push(course);
    for (const id of dependants.get(course.id) || []) {
      indegree.set(id, indegree.get(id) - 1);
      if (indegree.get(id) === 0) { ready.push(byId.get(id)); ready.sort(baseCompare); }
    }
  }
  if (ordered.length !== courses.length) {
    const included = new Set(ordered.map(course => course.id));
    ordered.push(...courses.filter(course => !included.has(course.id)).sort(baseCompare));
  }
  return ordered;
}

function itemIds(items, group) {
  return (Array.isArray(items) ? items : []).map((item, index) => item && item.id ? item.id : `${group}-${index}`);
}

function catalogSummary(course) {
  const lessons = Array.isArray(course.lessons) ? course.lessons : [];
  const exercises = Array.isArray(course.exercises) ? course.exercises : [];
  const quiz = Array.isArray(course.quiz) ? course.quiz : [];
  const projects = Array.isArray(course.projects) ? course.projects : [];
  return {
    id: course.id,
    title: course.title,
    icon: course.icon,
    blurb: course.blurb,
    description: course.description,
    category: course.category,
    level: course.level,
    linked: course.linked,
    optional: course.optional,
    tier: course.tier,
    available: course.available,
    status: course.status,
    counts: { lessons: lessons.length, exercises: exercises.length, quiz: quiz.length, projects: projects.length },
    progressIds: {
      lessons: itemIds(lessons, 'lessons'),
      exercises: itemIds(exercises, 'exercises'),
      quiz: itemIds(quiz, 'quiz'),
      projects: itemIds(projects, 'projects')
    }
  };
}

const courseData = readJsonScript('coursedata');
const categoryData = readJsonScript('categorydata');
if (!courseData || !Array.isArray(courseData.value) || courseData.value.length === 0) throw new Error('Cannot build catalog: coursedata is missing or empty');
const categories = categoryData && Array.isArray(categoryData.value) ? categoryData.value : [];
const orderedCourses = sortCoursesByLearningOrder(courseData.value, categories);
const safeJson = JSON.stringify(orderedCourses).replace(/<\//g, '<\\/');
html = html.replace(courseData.re, `${courseData.match[1]}${safeJson}${courseData.match[3]}`);

const lightweightCourses = orderedCourses.map(catalogSummary);
fs.mkdirSync(path.dirname(catalogDataPath), { recursive: true });
fs.writeFileSync(catalogDataPath, JSON.stringify({ courses: lightweightCourses, categories }), 'utf8');

fs.rmSync(courseDataDir, { recursive: true, force: true });
fs.mkdirSync(courseDataDir, { recursive: true });
for (const course of orderedCourses) {
  if (!course || typeof course.id !== 'string' || !/^[A-Za-z0-9._-]+$/.test(course.id)) {
    throw new Error(`Unsafe or missing course id: ${course && course.id}`);
  }
  fs.writeFileSync(path.join(courseDataDir, `${course.id}.json`), JSON.stringify(course), 'utf8');
}
console.log(`Ordered ${orderedCourses.length} courses; exported lightweight catalog plus ${orderedCourses.length} full course files`);

// The document's real </head> is the first closing head tag. Later occurrences may exist
// inside JavaScript strings that build srcdoc documents and must never be used as injection points.
html = html.replace(new RegExp(`^([\\s\\S]*?<head\\b[^>]*>)([\\s\\S]*?)<style\\b[^>]*\\bid=["']${catalogStyleId}["'][^>]*>[\\s\\S]*?<\\/style>\\s*`, 'i'), function(_,prefix,headContent){return prefix+headContent;});
const closingHead = html.toLowerCase().indexOf('</head>');
if(closingHead<0)throw new Error('Real document closing </head> is missing');
html = `${html.slice(0, closingHead)}${catalogStyle}\n${html.slice(closingHead)}`;

for (const asset of ['course-practice-routing', 'course-route-visibility-guard', 'catalog-recovery', 'catalog-course-viewer']) {
  html = html.replace(new RegExp(`<script[^>]*src=["']\\/assets\\/${asset}\\.js[^"']*["'][^>]*><\\/script>\\s*`, 'gi'), '');
}
const closingBody = html.toLowerCase().lastIndexOf('</body>');
if(closingBody<0)throw new Error('Real document closing </body> is missing');
const runtimeTags = `${loaderTag}\n${guardTag}\n${catalogTag}\n${viewerTag}`;
html = `${html.slice(0, closingBody)}${runtimeTags}\n${html.slice(closingBody)}`;
fs.writeFileSync(indexPath, html, 'utf8');

const result = fs.readFileSync(indexPath, 'utf8');
const generatedCatalog = JSON.parse(fs.readFileSync(catalogDataPath, 'utf8'));
if ((result.match(/\/assets\/course-practice-routing\.js/g) || []).length !== 1) throw new Error('Expected exactly one course loader');
if ((result.match(/\/assets\/course-route-visibility-guard\.js/g) || []).length !== 1) throw new Error('Expected exactly one course route guard');
if ((result.match(/\/assets\/catalog-recovery\.js/g) || []).length !== 1) throw new Error('Expected exactly one catalog recovery script');
if ((result.match(/\/assets\/catalog-course-viewer\.js/g) || []).length !== 1) throw new Error('Expected exactly one direct course viewer');
if ((result.match(new RegExp(`id=["']${catalogStyleId}["']`, 'g')) || []).length !== 1) throw new Error('Expected exactly one catalog select style in the real document head');
if (!Array.isArray(generatedCatalog.courses) || generatedCatalog.courses.length !== orderedCourses.length) throw new Error('Generated catalog data does not match coursedata');
if (generatedCatalog.courses.some(course => Object.prototype.hasOwnProperty.call(course, 'lessons'))) throw new Error('Catalog data is not lightweight');
for (const course of orderedCourses) {
  const fullPath = path.join(courseDataDir, `${course.id}.json`);
  if (!fs.existsSync(fullPath)) throw new Error(`Missing generated course file: ${course.id}`);
  const full = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  if (!full || full.id !== course.id) throw new Error(`Invalid generated course file: ${course.id}`);
}
console.log(`Injected direct viewer; generated ${generatedCatalog.courses.length} catalog entries and ${orderedCourses.length} course files without touching nested srcdoc markup.`);
