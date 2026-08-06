const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const netlifyToml = fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8');

const endpoints = [
  'authorize',
  'callback',
  'status',
  'sync',
  'file',
  'disconnect',
];

for (const endpoint of endpoints) {
  const route = `/api/github/${endpoint}`;
  const target = `/.netlify/functions/github-${endpoint}`;
  assert.ok(netlifyToml.includes(`from = "${route}"`), `Missing redirect for ${route}`);
  assert.ok(netlifyToml.includes(`to = "${target}"`), `Missing redirect target ${target}`);

  const functionPath = path.join(root, 'netlify', 'functions', `github-${endpoint}.js`);
  assert.ok(fs.existsSync(functionPath), `Missing Netlify function: github-${endpoint}.js`);
}

const integrationPath = path.join(root, 'assets', 'github-integration.js');
assert.ok(fs.existsSync(integrationPath), 'Missing browser GitHub integration module');

const integrationSource = fs.readFileSync(integrationPath, 'utf8');
for (const endpoint of ['status', 'sync', 'file', 'disconnect']) {
  assert.ok(
    integrationSource.includes(`/api/github/${endpoint}`),
    `Browser integration no longer references /api/github/${endpoint}`,
  );
}

const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.ok(
  indexSource.includes('assets/github-integration.js'),
  'index.html no longer loads the GitHub integration module',
);

console.log('GitHub integration contract: OK');
