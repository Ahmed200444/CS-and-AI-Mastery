const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const netlifyToml = fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8');

const endpoints = ['authorize', 'callback', 'status', 'sync', 'file', 'disconnect'];
for (const endpoint of endpoints) {
  const route = `/api/github/${endpoint}`;
  const target = `/.netlify/functions/github-${endpoint}`;
  assert.ok(netlifyToml.includes(`from = "${route}"`), `Missing redirect for ${route}`);
  assert.ok(netlifyToml.includes(`to = "${target}"`), `Missing redirect target ${target}`);
  assert.ok(fs.existsSync(path.join(root, 'netlify', 'functions', `github-${endpoint}.js`)), `Missing Netlify function: github-${endpoint}.js`);
}

const integrationPath = path.join(root, 'assets', 'github-integration.js');
assert.ok(fs.existsSync(integrationPath), 'Missing browser GitHub integration module');
const integrationSource = fs.readFileSync(integrationPath, 'utf8');
for (const endpoint of ['status', 'file']) {
  assert.ok(integrationSource.includes(`/api/github/${endpoint}`), `Browser integration no longer references /api/github/${endpoint}`);
}
assert.ok(integrationSource.includes('/api/github/authorize'), 'Browser integration no longer exposes GitHub connection');
assert.ok(integrationSource.includes('X-CSAI-CSRF'), 'Browser publishing must send the CSRF token');

const finalPublisher = fs.readFileSync(path.join(root, 'assets', 'portfolio-publish-controls.js'), 'utf8');
assert.ok(finalPublisher.includes('/api/github/status'), 'Portfolio publisher must read GitHub status');
assert.ok(finalPublisher.includes('/api/github/file'), 'Portfolio publisher must use the file endpoint');
assert.ok(finalPublisher.includes('createOnly:true'), 'Portfolio publishing must be duplicate protected');

const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.ok(indexSource.includes('assets/github-integration.js'), 'index.html no longer loads the GitHub integration module');

console.log('GitHub integration contract: OK');
