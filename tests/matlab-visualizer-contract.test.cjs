const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const assetPath = path.join(root, 'assets', 'matlab-visualizer.js');
const asset = fs.readFileSync(assetPath, 'utf8');
const page = fs.readFileSync(path.join(root, 'courses', 'matlab-engineering.html'), 'utf8');
assert.doesNotThrow(() => new Function(asset), 'MATLAB visualizer must parse');
for (const marker of ['MATLAB teaching preview', 'plotSvg', 'matlab-result-table', 'matlab-plot-card', 'Matrix multiplication needs matching inner dimensions', 'Preview notes']) {
  assert.ok(asset.includes(marker), `MATLAB visualizer missing ${marker}`);
}
assert.match(page, /matlab-visualizer\.js\?v=/, 'MATLAB page must load the visualizer');
assert.equal((page.match(/matlab-visualizer\.js/g) || []).length, 1, 'MATLAB visualizer must load once');
assert.match(page, /MATLAB preview lab/, 'MATLAB page must explain the graph/table preview');
const visualizer = require(assetPath);
const plot = visualizer.execute("x = 0:0.1:1;\ny = sin(x);\nplot(x,y);\nxlabel('x');");
assert.equal(plot.plots.length, 1, 'plot calls should produce one figure model');
assert.deepEqual(plot.env.x.slice(0, 3), [0, 0.1, 0.2], 'colon ranges should preserve MATLAB values');
const matrix = visualizer.execute('A = [1 2; 3 4];\nB = [5; 6];\nC = A*B;');
assert.deepEqual(matrix.env.C, [[17], [39]], 'matrix multiplication should preserve MATLAB row/column shape');
console.log('MATLAB visualizer contract PASS — arrays, matrices, plots, tables, and browser-safe notes are wired.');
