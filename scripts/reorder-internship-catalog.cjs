const fs = require('fs');
const path = require('path');

const catalogPath = path.join(process.cwd(), 'assets', 'catalog-data.json');
const courseDir = path.join(process.cwd(), 'assets', 'course-data');

const INTERNSHIP_SEQUENCE = [
  ['python'],
  ['cpp', 'c++', 'c plus plus'],
  ['dsa', 'data structures and algorithms', 'data structures & algorithms'],
  ['problem solving', 'problem-solving'],
  ['oop', 'object oriented programming', 'object-oriented programming'],
  ['git github', 'git & github', 'git and github', 'git-github'],
  ['linux', 'linux command line', 'linux & command line', 'linux and command line'],
  ['sql'],
  ['databases', 'database'],
  ['apis', 'api development', 'rest api', 'apis & rest'],
  ['backend development', 'backend-development', 'backend'],
  ['software engineering', 'software-engineering', 'swe fundamentals'],
  ['debugging'],
  ['testing'],
  ['computer networks', 'computer-networks', 'networking'],
  ['system design', 'system-design'],
  ['machine learning', 'machine-learning'],
  ['deep learning', 'deep-learning'],
  ['transformers', 'transformer'],
  ['generative ai', 'generative-ai'],
  ['llms', 'llm', 'large language models'],
  ['rag', 'retrieval augmented generation'],
  ['ai agents', 'ai-agents', 'agents'],
  ['model deployment', 'model-deployment'],
  ['docker'],
  ['cloud'],
  ['hugging face', 'hugging-face'],
  ['web development', 'web-development'],
  ['computer architecture operating systems', 'computer architecture & operating systems', 'computer architecture and operating systems', 'comparch'],
  ['digital systems computer hardware', 'digital systems & computer hardware', 'digital systems and computer hardware', 'digital-hardware'],
  ['distributed systems', 'distributed-systems']
];

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\+/g, ' plus ')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const normalizedSequence = INTERNSHIP_SEQUENCE.map(group => group.map(normalize));

function courseKeys(course) {
  return new Set([
    normalize(course.id),
    normalize(course.title),
    normalize(course.linked)
  ].filter(Boolean));
}

function internshipRank(course) {
  const keys = courseKeys(course);
  for (let i = 0; i < normalizedSequence.length; i++) {
    if (normalizedSequence[i].some(alias => keys.has(alias))) return i;
  }
  return Number.POSITIVE_INFINITY;
}

if (!fs.existsSync(catalogPath)) throw new Error('catalog-data.json was not generated');
if (!fs.existsSync(courseDir)) throw new Error('course-data directory was not generated');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!catalog || !Array.isArray(catalog.courses) || catalog.courses.length === 0) {
  throw new Error('Generated catalog is missing or empty');
}

const summariesById = new Map(catalog.courses.map((course, index) => [course.id, { course, index }]));
const fullCourses = catalog.courses.map(summary => {
  const file = path.join(courseDir, `${summary.id}.json`);
  if (!fs.existsSync(file)) throw new Error(`Missing full course file for ${summary.id}`);
  const full = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!full || full.id !== summary.id) throw new Error(`Invalid full course file for ${summary.id}`);
  return full;
});

const byId = new Map(fullCourses.map(course => [course.id, course]));
const indegree = new Map(fullCourses.map(course => [course.id, 0]));
const dependants = new Map(fullCourses.map(course => [course.id, []]));

for (const course of fullCourses) {
  const prerequisites = [...new Set(Array.isArray(course.prerequisites) ? course.prerequisites : [])]
    .filter(id => id !== course.id && byId.has(id));
  indegree.set(course.id, prerequisites.length);
  for (const prerequisiteId of prerequisites) dependants.get(prerequisiteId).push(course.id);
}

function compare(a, b) {
  const rankA = internshipRank(a);
  const rankB = internshipRank(b);
  if (rankA !== rankB) return rankA - rankB;
  return (summariesById.get(a.id)?.index ?? 0) - (summariesById.get(b.id)?.index ?? 0);
}

const ready = fullCourses.filter(course => indegree.get(course.id) === 0).sort(compare);
const ordered = [];

while (ready.length) {
  const course = ready.shift();
  ordered.push(course);
  for (const dependantId of dependants.get(course.id) || []) {
    indegree.set(dependantId, indegree.get(dependantId) - 1);
    if (indegree.get(dependantId) === 0) {
      ready.push(byId.get(dependantId));
      ready.sort(compare);
    }
  }
}

if (ordered.length !== fullCourses.length) {
  const included = new Set(ordered.map(course => course.id));
  ordered.push(...fullCourses.filter(course => !included.has(course.id)).sort(compare));
}

const orderedSummaries = ordered.map(course => summariesById.get(course.id).course);
if (orderedSummaries.length !== catalog.courses.length) throw new Error('Internship ordering lost catalog courses');
if (normalize(orderedSummaries[0]?.title) !== 'python') throw new Error('Internship catalog must start with Python');
if (normalize(orderedSummaries[1]?.title) !== 'c plus plus') throw new Error('C++ must follow Python in the programming foundations order');

catalog.courses = orderedSummaries;
catalog.ordering = {
  mode: 'bytedance-internship-prep',
  description: 'Programming foundations (Python and C++) followed by ByteDance AI application development internship preparation; prerequisites are respected automatically.'
};
fs.writeFileSync(catalogPath, JSON.stringify(catalog), 'utf8');

console.log('ByteDance internship catalog order:');
orderedSummaries.slice(0, 30).forEach((course, index) => console.log(`${index + 1}. ${course.title}`));
console.log(`Preserved all ${orderedSummaries.length} courses.`);
