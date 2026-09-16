#!/usr/bin/env node
// FIX #18 -- inject-course-loader.cjs (step 9) exports assets/course-data/<id>.json from the
// index.html coursedata island. Several LATER steps then rewrite that island's lesson/exercise
// text (the concise v5.64+ wording), so the mirrors written at step 9 keep the older copy.
// tests/aud-eece355-uml-contract.test.js compares the software-engineering-practice mirror
// against the island with deepStrictEqual and reports "course-data mirror drift".
//
// Re-export the mirrors from the FINAL island so they always match what the page ships.
// This is a pure re-export: it reads the island and writes one file per course, so it cannot
// lose courses or lessons.
'use strict';
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const indexPath = path.join(root, 'index.html');
const outDir = path.join(root, 'assets', 'course-data');

if (!fs.existsSync(indexPath)) throw new Error('index.html is missing');

const html = fs.readFileSync(indexPath, 'utf8');
const m = /(<script\b[^>]*\bid=["']coursedata["'][^>]*>)([\s\S]*?)(<\/script>)/i.exec(html);
if (!m) throw new Error('index.html: coursedata island not found');

let value;
try {
  value = JSON.parse(m[2]);
} catch (e) {
  throw new Error('index.html: coursedata island is not valid JSON: ' + e.message);
}
const courses = Array.isArray(value) ? value : value.courses;
if (!Array.isArray(courses) || courses.length === 0) throw new Error('coursedata island holds no courses');

fs.mkdirSync(outDir, { recursive: true });

let written = 0, lessons = 0;
for (const course of courses) {
  if (!course || typeof course.id !== 'string' || !/^[A-Za-z0-9._-]+$/.test(course.id)) {
    throw new Error('Unsafe or missing course id: ' + (course && course.id));
  }
  fs.writeFileSync(path.join(outDir, course.id + '.json'), JSON.stringify(course), 'utf8');
  written++;
  lessons += Array.isArray(course.lessons) ? course.lessons.length : 0;
}

if (written !== 62) throw new Error('Expected 62 course-data mirrors, wrote ' + written);
if (lessons !== 800) throw new Error('Expected 800 lessons across the mirrors, found ' + lessons);

// Prove the drift is gone for the course the contract checks.
const mirror = JSON.parse(fs.readFileSync(path.join(outDir, 'software-engineering-practice.json'), 'utf8'));
const island = courses.find(c => c.id === 'software-engineering-practice');
if (JSON.stringify(mirror) !== JSON.stringify(island)) {
  throw new Error('software-engineering-practice mirror still differs from the island after re-export');
}

console.log('Course-data mirrors re-exported from the final island: ' + written + ' files, ' + lessons + ' lessons.');
