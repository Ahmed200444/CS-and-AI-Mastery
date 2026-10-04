const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'courses', 'matlab-engineering.html');
if (!fs.existsSync(file)) throw new Error('MATLAB course page is missing');
let html = fs.readFileSync(file, 'utf8');
html = html.replace(/\s*<script\b[^>]*src=["'](?:\.\.\/|\/)assets\/matlab-visualizer\.js[^"']*["'][^>]*><\/script>\s*/gi, '\n');
const notice = '<section class="card matlab-preview-intro" aria-label="MATLAB browser preview"><h2>MATLAB preview lab</h2><p>Features a side-by-side <b>Script / Editor Window (.m)</b> and <b>Command Window &amp; Workspace (&gt;&gt;)</b>. Run scripts, inspect live matrix/array values, and view figure plots directly in the lesson workbench. The preview follows the course examples in MATLAB syntax and labels unsupported features clearly; use MATLAB or GNU Octave for the full language.</p></section>\n';
html = html.replace(/\s*<section class="card matlab-preview-intro"[\s\S]*?<\/section>\s*/i, '\n');
html = html.replace(/(<section class="lessons">)/i, notice + '$1');
const tag = '<script defer src="../assets/matlab-visualizer.js?v=20261004-v585"></script>\n';
const at = html.toLowerCase().lastIndexOf('</body>');
if (at < 0) throw new Error('MATLAB course closing body tag is missing');
html = html.slice(0, at) + tag + html.slice(at);
fs.writeFileSync(file, html, 'utf8');
console.log('MATLAB visual previews injected into the MATLAB course page.');
