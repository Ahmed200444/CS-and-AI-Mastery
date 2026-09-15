'use strict';
const runtime = require('./runtime-cache');

(async () => {
  process.stdout.write('Preparing local runtimes for maximum Run / Check speed...\n');
  try {
    const result = await runtime.warmMaximum();
    const stats = runtime.stats();
    process.stdout.write(`Core Python/SQL/C++ runtime: ${result.core.ok}/${result.core.total} files cached.\n`);
    process.stdout.write(`Common Python package files: ${result.packages.ok}/${result.packages.total} cached.\n`);
    process.stdout.write(`Runtime cache size: ${(stats.bytes / 1024 / 1024).toFixed(1)} MB.\n`);
    if (result.core.ok < result.core.total) {
      process.stdout.write('Anything missing will be fetched and cached automatically on first use.\n');
    }
  } catch (error) {
    process.stdout.write(`Pre-cache could not finish: ${error.message || String(error)}\n`);
    process.stdout.write('The app will still fetch/cache runtime files automatically while it is open.\n');
  }
})();
