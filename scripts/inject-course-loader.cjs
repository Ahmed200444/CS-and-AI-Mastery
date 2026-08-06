const fs = require('fs');
const path = require('path');

const indexPath = path.join(process.cwd(), 'index.html');
const loaderPath = '/assets/course-practice-routing.js?v=20260806-3';
const loaderTag = `<script type="module" src="${loaderPath}"></script>`;

if (!fs.existsSync(indexPath)) {
  throw new Error(`Cannot find ${indexPath}`);
}

let html = fs.readFileSync(indexPath, 'utf8');

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
const matches = result.match(/\/assets\/course-practice-routing\.js/g) || [];
if (matches.length !== 1) {
  throw new Error(`Expected exactly one course loader, found ${matches.length}`);
}

console.log(`Injected ${loaderPath} into deploy copy of index.html`);
