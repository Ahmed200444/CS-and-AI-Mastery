'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname);
const CACHE_ROOT = path.join(ROOT, 'runtime-cache');

const SOURCES = [
  {
    prefix: '/runtime/pyodide/',
    dir: 'pyodide',
    remote: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
  },
  {
    prefix: '/runtime/sql/',
    dir: 'sql',
    remote: 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/',
  },
  {
    prefix: '/runtime/cpp/',
    dir: 'cpp',
    remote: 'https://cdn.jsdelivr.net/npm/JSCPP@2.0.9/dist/',
  },
];

const CORE = [
  '/runtime/pyodide/pyodide.js',
  '/runtime/pyodide/pyodide.asm.js',
  '/runtime/pyodide/pyodide.asm.wasm',
  '/runtime/pyodide/python_stdlib.zip',
  '/runtime/pyodide/pyodide-lock.json',
  '/runtime/sql/sql-wasm.js',
  '/runtime/sql/sql-wasm.wasm',
  '/runtime/cpp/JSCPP.es5.min.js',
];

const COMMON_PACKAGES = [
  'micropip',
  'numpy',
  'pandas',
  'matplotlib',
  'scipy',
  'scikit-learn',
  'sympy',
  'networkx',
];

const pending = new Map();

function safeRelative(value) {
  const rel = String(value || '').replace(/^\/+/, '');
  if (!rel || rel.includes('..') || /[^A-Za-z0-9._+@\/-]/.test(rel)) return null;
  return rel;
}

function sourceFor(pathname) {
  for (const source of SOURCES) {
    if (!pathname.startsWith(source.prefix)) continue;
    const rel = safeRelative(pathname.slice(source.prefix.length));
    if (!rel) return null;
    return {
      source,
      rel,
      file: path.join(CACHE_ROOT, source.dir, ...rel.split('/')),
      url: source.remote + rel,
    };
  }
  return null;
}

function contentType(file) {
  const ext = path.extname(file).toLowerCase();
  return ({
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.wasm': 'application/wasm',
    '.json': 'application/json; charset=utf-8',
    '.zip': 'application/zip',
    '.whl': 'application/zip',
    '.gz': 'application/gzip',
  })[ext] || 'application/octet-stream';
}

async function download(info) {
  if (fs.existsSync(info.file) && fs.statSync(info.file).size > 0) return info.file;
  if (pending.has(info.url)) return pending.get(info.url);

  const task = (async () => {
    fs.mkdirSync(path.dirname(info.file), { recursive: true });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let response;
    try {
      response = await fetch(info.url, { redirect: 'follow', signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) {
      throw new Error(`Runtime download failed: ${response.status} ${info.url}`);
    }
    const data = Buffer.from(await response.arrayBuffer());
    const temp = `${info.file}.tmp-${process.pid}-${Date.now()}`;
    fs.writeFileSync(temp, data);
    fs.renameSync(temp, info.file);
    return info.file;
  })().finally(() => pending.delete(info.url));

  pending.set(info.url, task);
  return task;
}

async function ensurePath(pathname) {
  const info = sourceFor(pathname);
  if (!info) return null;
  try {
    await download(info);
    return info;
  } catch (error) {
    return { info, error };
  }
}

async function route(req, res, pathname) {
  const info = sourceFor(pathname);
  if (!info) return false;

  const file = info.file;
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) {
    try {
      await download(info);
    } catch (error) {
      const body = Buffer.from(`Runtime asset unavailable: ${error.message || String(error)}`);
      res.writeHead(502, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Length': String(body.length),
      });
      res.end(body);
      return true;
    }
  }

  const stat = fs.statSync(file);
  res.writeHead(200, {
    'Content-Type': contentType(file),
    'Content-Length': String(stat.size),
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-CSAI-Runtime-Cache': 'local',
  });
  if (req.method === 'HEAD') res.end();
  else fs.createReadStream(file).pipe(res);
  return true;
}

async function warmCore() {
  const results = await Promise.allSettled(CORE.map(ensurePath));
  return {
    ok: results.filter((result) => result.status === 'fulfilled' && result.value && !result.value.error).length,
    total: CORE.length,
  };
}

async function readLock() {
  const info = sourceFor('/runtime/pyodide/pyodide-lock.json');
  if (!info) throw new Error('Pyodide lock path unavailable');
  await download(info);
  return JSON.parse(fs.readFileSync(info.file, 'utf8'));
}

async function warmPackages(names) {
  let lock;
  try {
    lock = await readLock();
  } catch (_) {
    return { ok: 0, total: 0 };
  }

  const packages = lock && lock.packages && typeof lock.packages === 'object' ? lock.packages : {};
  const wanted = new Set();
  const queue = Array.isArray(names) ? names.slice() : [];

  while (queue.length) {
    const name = queue.shift();
    if (!name || wanted.has(name)) continue;
    wanted.add(name);
    const spec = packages[name];
    if (!spec) continue;
    const deps = spec.depends || spec.dependencies || [];
    for (const dep of deps) if (!wanted.has(dep)) queue.push(dep);
  }

  const paths = [];
  for (const name of wanted) {
    const spec = packages[name];
    if (!spec) continue;
    const file = spec.file_name || spec.filename || spec.file;
    if (file) paths.push('/runtime/pyodide/' + file);
  }

  const results = await Promise.allSettled(paths.map(ensurePath));
  return {
    ok: results.filter((result) => result.status === 'fulfilled' && result.value && !result.value.error).length,
    total: paths.length,
  };
}

async function warmMaximum() {
  const core = await warmCore();
  const packages = await warmPackages(COMMON_PACKAGES);
  return { core, packages };
}

function stats() {
  let files = 0;
  let bytes = 0;
  if (fs.existsSync(CACHE_ROOT)) {
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else {
          files += 1;
          bytes += fs.statSync(full).size;
        }
      }
    };
    walk(CACHE_ROOT);
  }
  return { files, bytes, root: CACHE_ROOT };
}

module.exports = {
  route,
  warmCore,
  warmPackages,
  warmMaximum,
  stats,
  CACHE_ROOT,
  CORE,
  COMMON_PACKAGES,
  sourceFor,
};
