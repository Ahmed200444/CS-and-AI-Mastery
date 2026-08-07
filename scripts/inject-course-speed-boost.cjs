const fs = require('fs');
const path = require('path');

const indexPath = path.join(process.cwd(), 'index.html');
const assetPath = '/assets/course-speed-boost.js?v=20260807-1';
const tag = `<script src="${assetPath}"></script>`;

if (!fs.existsSync(indexPath)) throw new Error(`Cannot find ${indexPath}`);
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(/<script[^>]*src=["']\/assets\/course-speed-boost\.js[^"']*["'][^>]*><\/script>\s*/gi, '');
const closingBody = html.toLowerCase().lastIndexOf('</body>');
html = closingBody >= 0
  ? `${html.slice(0, closingBody)}${tag}\n${html.slice(closingBody)}`
  : `${html}\n${tag}\n`;
fs.writeFileSync(indexPath, html, 'utf8');

const result = fs.readFileSync(indexPath, 'utf8');
const matches = result.match(/\/assets\/course-speed-boost\.js/g) || [];
if (matches.length !== 1) throw new Error(`Expected exactly one course speed script, found ${matches.length}`);
console.log('Injected course prefetch and fast-open optimization');
