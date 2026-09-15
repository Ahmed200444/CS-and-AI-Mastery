'use strict';

// This tiny wrapper owns the log file itself.  The launcher can therefore start
// the study server with stdio fully detached, which is more reliable on Windows
// than passing an inherited log-file handle into a detached Node process.
const fs = require('fs');
const path = require('path');
const util = require('util');

const ROOT = __dirname;
const LOG = path.join(ROOT, 'csai-server.log');

function append(prefix, args) {
  try {
    const text = util.format(...args);
    fs.appendFileSync(LOG, `${prefix}${text}\n`, 'utf8');
  } catch (_) {}
}

console.log = (...args) => append('', args);
console.info = (...args) => append('', args);
console.warn = (...args) => append('[WARN] ', args);
console.error = (...args) => append('[ERROR] ', args);

process.on('uncaughtException', (error) => {
  append('[FATAL] ', [error && error.stack || error]);
  process.exit(1);
});
process.on('unhandledRejection', (error) => {
  append('[FATAL] Unhandled rejection: ', [error && error.stack || error]);
  process.exit(1);
});

append('', [`Bootstrap Node: ${process.execPath}`]);
append('', [`Bootstrap PID: ${process.pid}`]);
append('', [`Bootstrap cwd: ${process.cwd()}`]);
append('', [`Bootstrap time: ${new Date().toISOString()}`]);
append('', ['']);

try {
  require('./local-server.js');
} catch (error) {
  append('[FATAL] Could not load local-server.js: ', [error && error.stack || error]);
  process.exit(1);
}
