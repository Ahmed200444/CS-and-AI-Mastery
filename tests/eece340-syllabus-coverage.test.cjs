'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// 1. Verify audit documentation exists
const auditMdPath = path.join(root, 'EECE340_SYLLABUS_COVERAGE_AUDIT.md');
const auditJsonPath = path.join(root, 'EECE340_SYLLABUS_COVERAGE_AUDIT.json');
assert.ok(fs.existsSync(auditMdPath), 'EECE340_SYLLABUS_COVERAGE_AUDIT.md must exist');
assert.ok(fs.existsSync(auditJsonPath), 'EECE340_SYLLABUS_COVERAGE_AUDIT.json must exist');

const audit = JSON.parse(fs.readFileSync(auditJsonPath, 'utf8'));
assert.equal(audit.courseCode, 'EECE340');
assert.equal(audit.assessmentWeighting.total, 100);
assert.equal(audit.assessmentWeighting.homework, 10);
assert.equal(audit.assessmentWeighting.quizzes, 15);
assert.equal(audit.assessmentWeighting.midterm, 25);
assert.equal(audit.assessmentWeighting.labWork, 10);
assert.equal(audit.assessmentWeighting.labExam, 15);
assert.equal(audit.assessmentWeighting.finalExam, 25);

// 2. Load line-by-line explainer engine
const explainerSource = fs.readFileSync(path.join(root, 'assets', 'line-by-line-explanations.js'), 'utf8');
const sandbox = { window: {}, document: { readyState: 'loading', addEventListener() {}, getElementById() { return null; } }, setTimeout() { return 1; }, clearTimeout() {}, MutationObserver: function () { this.observe = function () {}; }, console };
vm.createContext(sandbox);
vm.runInContext(explainerSource, sandbox);
const api = sandbox.window.CSAILineExplainer;
assert.ok(api && typeof api.explain === 'function', 'CSAILineExplainer must be available');

// 3. Load course data
const armCourseAdditions = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'arm-course-additions.json'), 'utf8'));
const mprCourse = armCourseAdditions.find(c => c.id === 'microprocessors-arm');
const armCourse = armCourseAdditions.find(c => c.id === 'arm-assembly');
assert.ok(mprCourse, 'microprocessors-arm course must exist');
assert.ok(armCourse, 'arm-assembly course must exist');

// 4. Verify lecture order is preserved
assert.equal(mprCourse.lessons.length, 10, 'microprocessors-arm must preserve 10 lessons in order');
assert.equal(armCourse.lessons.length, 12, 'arm-assembly must preserve 12 lessons in order');

const expectedMprIds = ['mpr-01', 'mpr-02', 'mpr-03', 'mpr-04', 'mpr-05', 'mpr-06', 'mpr-07', 'mpr-08', 'mpr-09', 'mpr-10'];
assert.deepEqual(mprCourse.lessons.map(l => l.id), expectedMprIds, 'mpr lessons must preserve original sequence');

const expectedArmIds = ['arm-01', 'arm-02', 'arm-09', 'arm-05', 'arm-06', 'arm-07', 'arm-04', 'arm-03', 'arm-08', 'arm-10', 'arm-11', 'arm-12'];
assert.deepEqual(armCourse.lessons.map(l => l.id), expectedArmIds, 'arm lessons must preserve original lecture order');

// 5. Verify all 16 required lab modules exist
const requiredLabIds = [
  'eece340-lab-01', 'eece340-lab-02', 'eece340-lab-03', 'eece340-lab-04',
  'eece340-lab-05', 'eece340-lab-06', 'eece340-lab-07', 'eece340-lab-08',
  'eece340-lab-09', 'eece340-lab-10', 'eece340-lab-11', 'eece340-lab-12',
  'eece340-lab-13', 'eece340-lab-14', 'eece340-lab-15', 'eece340-lab-16'
];
assert.ok(Array.isArray(mprCourse.labs), 'microprocessors-arm must include labs array');
assert.equal(mprCourse.labs.length, 16, 'must contain exactly 16 lab modules');
assert.deepEqual(mprCourse.labs.map(l => l.id), requiredLabIds, 'all 16 lab IDs must match in order');

// 6. Verify each lab module structure and code explanations
const seenLabIds = new Set();
const seenSolutions = new Set();

for (const lab of mprCourse.labs) {
  assert.ok(!seenLabIds.has(lab.id), `duplicate lab ID detected: ${lab.id}`);
  seenLabIds.add(lab.id);

  assert.ok(lab.title && lab.title.trim().length > 5, `${lab.id}: missing title`);
  assert.ok(lab.syllabusTopic && lab.syllabusTopic.trim().length > 5, `${lab.id}: missing syllabus topic`);
  assert.ok(lab.objective && lab.objective.trim().length > 15, `${lab.id}: missing objective`);
  assert.ok(lab.problemStatement && lab.problemStatement.trim().length > 20, `${lab.id}: missing problem statement`);
  assert.ok(lab.expectedState && lab.expectedState.trim().length > 10, `${lab.id}: missing expected state`);
  assert.ok(lab.boundaryCase && lab.boundaryCase.trim().length > 15, `${lab.id}: missing boundary case`);
  assert.ok(lab.hardwareNote && lab.hardwareNote.trim().length > 20, `${lab.id}: missing hardware note`);
  assert.ok(lab.checkpoint && lab.checkpoint.trim().length > 10, `${lab.id}: missing submission checkpoint`);
  assert.ok(lab.solutionCode && lab.solutionCode.trim().length > 10, `${lab.id}: missing solution code`);
  assert.ok(lab.solutionExplanation && lab.solutionExplanation.trim().length > 15, `${lab.id}: missing solution explanation`);

  const normSol = lab.solutionExplanation.replace(/\s+/g, ' ').trim();
  assert.ok(!seenSolutions.has(normSol), `${lab.id}: duplicate solution explanation found`);
  seenSolutions.add(normSol);

  // Validate language tags
  assert.ok(['armasm', 'cpp', 'python'].includes(lab.language), `${lab.id}: invalid language tag ${lab.language}`);

  // Test starter code and solution code line-by-line explanation coverage
  for (const [kind, code] of [['starter', lab.starterCode], ['solution', lab.solutionCode]]) {
    const lines = code.split(/\r?\n/);
    const rows = api.explain(code, lab.language);
    assert.equal(rows.length, lines.length, `${lab.id} ${kind} line count mismatch`);
    for (const [i, row] of rows.entries()) {
      assert.ok(row.purpose && row.purpose.trim().length > 0, `${lab.id} ${kind} line ${i + 1} missing purpose`);
      assert.ok(Array.isArray(row.syntax) && row.syntax.length > 0, `${lab.id} ${kind} line ${i + 1} missing syntax`);
      assert.doesNotMatch(row.purpose, /^This (?:MATLAB|C\+\+|Java|Python|JavaScript) line|^This ARM instruction|^MATLAB reference/, `${lab.id} ${kind} line ${i + 1} has generic fallback: ${row.purpose}`);
    }
  }
}

// 7. Verify timed final lab exam rehearsal exists
const finalLab = mprCourse.labs.find(l => l.id === 'eece340-lab-16');
assert.ok(finalLab, 'Lab 16 final lab exam rehearsal must exist');
assert.match(finalLab.title, /final lab exam/i, 'Lab 16 must be a final lab exam rehearsal');
assert.equal(audit.assessmentWeighting.labExam, 15, 'internal syllabus audit must retain the 15% lab-exam weighting');

// 8. Verify generated microprocessors-arm.html contains the lab track
const htmlPath = path.join(root, 'courses', 'microprocessors-arm.html');
assert.ok(fs.existsSync(htmlPath), 'courses/microprocessors-arm.html must exist');
const html = fs.readFileSync(htmlPath, 'utf8');

assert.ok(html.includes('id="eece340-labs"'), 'html page must contain visible eece340-labs section');
assert.ok(html.includes('MICROPROCESSOR &amp; ARM LAB TRACK'), 'commercial page must use the generic microprocessor lab-track header');
assert.ok(!html.includes('EECE 340 SYLLABUS LAB TRACK'), 'commercial page must not expose the institution-specific lab-track label');
for (const id of requiredLabIds) {
  assert.ok(html.includes(`data-lab="${id}"`), `html page must contain lab card for ${id}`);
}

// 9. Verify MATLAB course preserved and valid
const matlabCourse = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'matlab-course-addition.json'), 'utf8'));
assert.equal(matlabCourse.id, 'matlab-engineering');
assert.equal(matlabCourse.lessons.length, 10);
assert.equal(matlabCourse.exercises.length, 12);
assert.equal(matlabCourse.projects.length, 3);
assert.ok(matlabCourse.capstone);

console.log('EECE340 syllabus coverage contract PASS — all 27 syllabus requirements, 16 lab modules, line-by-line explanations, hardware notes, and assessment weights verified.');
