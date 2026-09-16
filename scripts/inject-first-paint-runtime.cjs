#!/usr/bin/env node
// FIX #11/#12 -- verify-unified-learning-design.cjs requires every course page to reference a
// runtime-inline/courses-<id>-NNN.js chunk whose contents contain
//   document.documentElement.classList.add('csai-unified-design')
// Every one of the 62 courses HAS such a chunk, but the shipped pages reference only a subset of
// their chunks and the marker-bearing one is frequently not among them (e.g. rag.html references
// -001 and -003 only). The generators used to emit this tag; because shipped pages are preserved
// verbatim, this step attaches it.
//
// Idempotent: a page that already satisfies the check is left untouched.
'use strict';
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const courseDir = path.join(root, 'courses');
const inlineDir = path.join(root, 'assets', 'runtime-inline');
const MARKER = "document.documentElement.classList.add('csai-unified-design')";
const REF_RE = /<script\b[^>]*src=["']([^"']*runtime-inline\/courses-[^"']+\.js)[^"']*["'][^>]*><\/script>/gi;

if (!fs.existsSync(courseDir)) throw new Error('courses directory missing');
if (!fs.existsSync(inlineDir)) throw new Error('assets/runtime-inline directory missing');

// Map course id -> the chunk file that carries the first-paint marker.
const markerChunk = new Map();
for (const f of fs.readdirSync(inlineDir)) {
  const m = /^courses-(.+)-\d+\.js$/.exec(f);
  if (!m) continue;
  if (!fs.readFileSync(path.join(inlineDir, f), 'utf8').includes(MARKER)) continue;
  if (!markerChunk.has(m[1])) markerChunk.set(m[1], f);   // lowest-numbered match wins
}

const pages = fs.readdirSync(courseDir).filter(f => f.endsWith('.html'));
let added = 0, already = 0;
for (const file of pages) {
  const id = file.replace(/\.html$/, '');
  const p = path.join(courseDir, file);
  const html = fs.readFileSync(p, 'utf8');

  const refs = [...html.matchAll(REF_RE)].map(m => m[1].split('?')[0]);
  const satisfied = refs.some(ref => {
    const resolved = path.resolve(courseDir, ref);
    return fs.existsSync(resolved) && fs.readFileSync(resolved, 'utf8').includes(MARKER);
  });
  if (satisfied) { already += 1; continue; }

  const chunk = markerChunk.get(id);
  if (!chunk) throw new Error(file + ': no first-paint runtime chunk exists for course "' + id + '"');

  const tag = '<script src="../assets/runtime-inline/' + chunk + '"></script>';
  const at = html.toLowerCase().lastIndexOf('</body>');
  if (at < 0) throw new Error(file + ': final </body> missing');
  fs.writeFileSync(p, html.slice(0, at) + '\n' + tag + '\n' + html.slice(at), 'utf8');
  added += 1;
}

if (pages.length !== 62) throw new Error('Expected 62 course pages, found ' + pages.length);
if (added + already !== 62) throw new Error('First-paint coverage incomplete: ' + (added + already) + '/62');
console.log(`Unified-design first-paint runtime present on 62 course pages (${added} attached, ${already} already satisfied).`);
