const fs = require('fs');
const path = require('path');

const indexPath = path.join(process.cwd(), 'index.html');
const assetPath = '/assets/course-theme-toggle.js?v=20260807-2';
const tag = `<script src="${assetPath}"></script>`;

if (!fs.existsSync(indexPath)) throw new Error(`Cannot find ${indexPath}`);
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(/<script[^>]*src=["']\/assets\/course-theme-toggle\.js[^"']*["'][^>]*><\/script>\s*/gi, '');
const closingBody = html.toLowerCase().lastIndexOf('</body>');
html = closingBody >= 0
  ? `${html.slice(0, closingBody)}${tag}\n${html.slice(closingBody)}`
  : `${html}\n${tag}\n`;
fs.writeFileSync(indexPath, html, 'utf8');

const result = fs.readFileSync(indexPath, 'utf8');
const matches = result.match(/\/assets\/course-theme-toggle\.js/g) || [];
if (matches.length !== 1) throw new Error(`Expected exactly one course theme toggle script, found ${matches.length}`);
console.log('Injected Light/Dark course theme toggle');
