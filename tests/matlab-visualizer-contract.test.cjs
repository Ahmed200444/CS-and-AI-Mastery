const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const assetPath = path.join(root, 'assets', 'matlab-visualizer.js');
const asset = fs.readFileSync(assetPath, 'utf8');
const page = fs.readFileSync(path.join(root, 'courses', 'matlab-engineering.html'), 'utf8');
assert.doesNotThrow(() => new Function(asset), 'MATLAB visualizer must parse');
for (const marker of ['MATLAB teaching preview', 'plotSvg', 'matlab-result-table', 'matlab-plot-card', 'Matrix multiplication needs matching inner dimensions', 'Preview notes', 'matlab-file-tabs', 'virtualFiles', 'Command Window']) {
  assert.ok(asset.includes(marker), `MATLAB visualizer missing ${marker}`);
}
assert.match(page, /matlab-visualizer\.js\?v=/, 'MATLAB page must load the visualizer');
assert.equal((page.match(/matlab-visualizer\.js/g) || []).length, 1, 'MATLAB visualizer must load once');
assert.match(page, /MATLAB preview lab/, 'MATLAB page must explain the graph/table preview');

const lessons = [...page.matchAll(/<details class="lesson" data-lesson="([^"]+)"[\s\S]*?<\/details>/g)];
assert.equal(lessons.length, 10, 'MATLAB course must keep all 10 syllabus lessons');
for (const lesson of lessons) {
  assert.match(lesson[0], /<(?:pre|textarea)[^>]*data-language="matlab"/i, `${lesson[1]} must include MATLAB source for its lesson workbench`);
}
assert.match(asset, /\.matlab-workbench\{display:grid;grid-template-columns:/, 'MATLAB workbench must use a two-column desktop layout');
assert.match(asset, /\.matlab-pane-editor/, 'MATLAB workbench must include the Editor pane');
assert.match(asset, /\.matlab-pane-command/, 'MATLAB workbench must include the Command Window/Workspace pane');
assert.match(asset, /Results beside code/, 'MATLAB result tables and figures must be labeled as beside the Editor code');
assert.match(asset, /grid-template-columns:minmax\(0,1\.05fr\) minmax\(420px,1fr\)/, 'MATLAB desktop layout must keep results beside code');
assert.match(asset, /pre\[data-language="matlab"\],textarea\[data-language="matlab"\]/, 'visualizer must mount on every MATLAB lesson code block');
assert.match(page, /calculate_average\.m/, 'function lesson must show the function as an Editor file');
assert.match(page, /grades\.m/, 'function lesson must show the main script as a separate Editor file');
const visualizer = require(assetPath);
const plot = visualizer.execute("x = 0:0.1:1;\ny = sin(x);\nplot(x,y);\nxlabel('x');");
assert.equal(plot.plots.length, 1, 'plot calls should produce one figure model');
assert.deepEqual(plot.env.x.slice(0, 3), [0, 0.1, 0.2], 'colon ranges should preserve MATLAB values');
const matrix = visualizer.execute('A = [1 2; 3 4];\nB = [5; 6];\nC = A*B;');
assert.deepEqual(matrix.env.C, [[17], [39]], 'matrix multiplication should preserve MATLAB row/column shape');
const projectSource = `% file: calculate_average.m
function average = calculate_average(numbers)
total = sum(numbers);
count = length(numbers);
average = total / count;
end

% file: grades.m
sam = [87 81 94 90 79];
sam_average = calculate_average(sam)`;
const files = visualizer.virtualFiles(projectSource);
assert.deepEqual(files.map(file => file.name), ['calculate_average.m', 'grades.m'], 'function and main script must remain separate Editor files');
assert.equal(files[0].kind, 'function', 'calculate_average.m must be recognized as a function file');
assert.equal(files[1].kind, 'script', 'grades.m must be recognized as the main script');
const project = visualizer.execute(visualizer.runnableProjectSource(files));
assert.equal(project.env.sam_average, 86.2, 'main script must be able to call the separate function file');
console.log('MATLAB visualizer contract PASS — Editor code stays beside Command Window, Workspace tables and figures, with function/main scripts as separate .m files.');
