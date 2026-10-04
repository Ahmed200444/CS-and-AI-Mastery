const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const assetPath = path.join(root, 'assets', 'matlab-visualizer.js');
const asset = fs.readFileSync(assetPath, 'utf8');
const page = fs.readFileSync(path.join(root, 'courses', 'matlab-engineering.html'), 'utf8');
assert.doesNotThrow(() => new Function(asset), 'MATLAB visualizer must parse');
for (const marker of ['MATLAB teaching preview', 'plotSvg', 'matlab-result-table', 'matlab-plot-card', 'Matrix multiplication needs matching inner dimensions', 'Preview notes', 'matlab-file-tabs', 'virtualFiles', 'Command Window', 'preserveAspectRatio="xMidYMid meet"', 'stroke-opacity=".55"', 'var ticks=5']) {
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
assert.match(asset, /setTimeout\(run,0\)/, 'every MATLAB lesson must populate the beside-code result pane automatically');
assert.match(asset, /Command Window · Workspace · Table\/Figure/, 'MATLAB result pane must clearly include tables and figures beside the Editor');
assert.match(asset, /pre\[data-language="matlab"\],textarea\[data-language="matlab"\]/, 'visualizer must mount on every MATLAB lesson code block');
assert.match(page, /calculate_average\.m/, 'function lesson must show the function as an Editor file');
assert.match(page, /grades\.m/, 'function lesson must show the main script as a separate Editor file');
const visualizer = require(assetPath);
const plot = visualizer.execute("x = 0:0.1:1;\ny = sin(x);\nplot(x,y);\nxlabel('x');");
assert.equal(plot.plots.length, 1, 'plot calls should produce one figure model');
const plottedHtml = visualizer.renderResult(visualizer.execute("x = 0:0.25:1;\\ny = x.^2;\\nplot(x,y);\\nxlabel('Time');\\nylabel('Value');\\ntitle('Quadratic');\\nlegend('x squared');"), 'plot_demo');
assert.match(plottedHtml, /Quadratic/, 'figure preview must render its title');
assert.match(plottedHtml, /Time/, 'figure preview must render the x-axis label');
assert.match(plottedHtml, /Value/, 'figure preview must render the y-axis label');
assert.match(plottedHtml, /x squared/, 'figure preview must render the legend');
assert.match(plottedHtml, /stroke-opacity="\.55"/, 'figure preview must render readable gridlines');
assert.deepEqual(plot.env.x.slice(0, 3), [0, 0.1, 0.2], 'colon ranges should preserve MATLAB values');
const matrix = visualizer.execute('A = [1 2; 3 4];\nB = [5; 6];\nC = A*B;');
assert.deepEqual(matrix.env.C, [[17], [39]], 'matrix multiplication should preserve MATLAB row/column shape');
const concat = visualizer.execute('r = [2 4 10];\nw = [12 24 60];\nu = [r w];');
assert.deepEqual(concat.env.u, [2,4,10,12,24,60], 'MATLAB horizontal concatenation must flatten compatible row vectors');
const dims = visualizer.execute('Z = zeros(1,3);\ncols = size(Z,2);');
assert.deepEqual(dims.env.Z, [0,0,0], 'zeros(1,3) must create a 1x3 row vector');
assert.equal(dims.env.cols, 3, 'size(A,2) must return the column count');
const sourceCourse = JSON.parse(fs.readFileSync(path.join(root,'assets','coursedata-source.json'),'utf8')).find(course=>course.id==='matlab-engineering');
const projectSource = sourceCourse.lessons.find(lesson=>lesson.id==='mat-06').examples[0];
const files = visualizer.virtualFiles(projectSource);
assert.deepEqual(files.map(file => file.name), ['calculate_average.m', 'grades.m'], 'function and main script must remain separate Editor files');
assert.equal(files[0].kind, 'function', 'calculate_average.m must be recognized as a function file');
assert.equal(files[1].kind, 'script', 'grades.m must be recognized as the main script');
const project = visualizer.execute(visualizer.runnableProjectSource(files));
assert.equal(project.env.sam_average, 86.2, 'main script must calculate Sam average correctly');
assert.equal(project.env.ann_average, 88.8, 'main script must calculate Ann average correctly');
assert.equal(project.env.mark_average, 80.2, 'main script must calculate Mark average correctly');
assert.equal(project.env.sue_average, 93, 'main script must calculate Sue average correctly');
assert.match(project.output.join('\n'), /Sam Average = 86\.20/, 'fprintf must substitute formatted numeric values');
assert.match(project.output.join('\n'), /Sue Average = 93\.00/, 'fprintf must preserve requested decimal precision');
for (const id of ['mat-08','mat-10']) {
  const state=visualizer.execute(sourceCourse.lessons.find(lesson=>lesson.id===id).examples[0]);
  assert.deepEqual(state.notes, [], id+' example must execute without preview errors');
}

console.log('MATLAB visualizer contract PASS — Editor code stays beside Command Window, Workspace tables and figures, with function/main scripts as separate .m files.');
