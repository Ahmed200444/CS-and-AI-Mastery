#!/usr/bin/env node
// FIX #22 -- tests/try-it-yourself-v568-contract.test.js requires the v5.68 "Try it yourself"
// layer on all 62 course pages AND on index.html, bytedance-2027-prep.html and github-setup.html.
// The shipped release carries it on the 62 course pages and the two static pages, but not on the
// homepage, so that one contract assertion could never pass on the pristine tree. Inject it.
//
// Idempotent: an existing tag is left exactly as it is.
'use strict';
const fs = require('fs');
const path = require('path');

const indexPath = path.join(process.cwd(), 'index.html');
if (!fs.existsSync(indexPath)) throw new Error('index.html is missing');

let html = fs.readFileSync(indexPath, 'utf8');

if (/<script\b[^>]*src=["'][^"']*try-it-yourself-v568\.js[^"']*["'][^>]*>/i.test(html)) {
  console.log('Homepage already loads the v5.68 Try it yourself layer.');
  process.exit(0);
}

// Bare root-relative path, matching the other root-level pages the contract checks.
const tag = '<script defer src="assets/try-it-yourself-v568.js?v=20260822-v568"></script>';
const at = html.toLowerCase().lastIndexOf('</body>');
if (at < 0) throw new Error('index.html: final </body> missing');

html = html.slice(0, at) + tag + '\n' + html.slice(at);
fs.writeFileSync(indexPath, html, 'utf8');

const result = fs.readFileSync(indexPath, 'utf8');
const count = (result.match(/try-it-yourself-v568\.js/g) || []).length;
if (count !== 1) throw new Error('Expected exactly one Try it yourself script on the homepage, found ' + count);
console.log('Homepage now loads the v5.68 Try it yourself layer.');
