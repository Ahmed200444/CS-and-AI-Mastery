'use strict';

const crypto = require('crypto');
const path = require('path');
const { execFileSync, spawn } = require('child_process');

const API_VERSION = '2022-11-28';
const MAX_FILE_BYTES = 900000;
const csrf = crypto.randomBytes(24).toString('hex');
let sessionEnabled = true;

function json(res, status, body) {
  const data = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': String(data.length),
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(data);
}

function html(res, status, body) {
  const data = Buffer.from(body);
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': String(data.length),
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(data);
}

function redirect(res, location) {
  res.writeHead(302, { Location: location, 'Cache-Control': 'no-store' });
  res.end();
}

function commandExists(command) {
  try {
    execFileSync(command, ['--version'], { stdio: 'ignore', timeout: 4000, windowsHide: true });
    return true;
  } catch (_) {
    return false;
  }
}

function tokenFromEnvironment() {
  return String(process.env.CSAI_GITHUB_TOKEN || process.env.GITHUB_TOKEN || '').trim();
}

function tokenFromGitHubCli() {
  try {
    return String(execFileSync('gh', ['auth', 'token'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 6000,
      windowsHide: true
    }) || '').trim();
  } catch (_) {
    return '';
  }
}

function getToken() {
  return tokenFromEnvironment() || tokenFromGitHubCli();
}

function safePath(value) {
  let p = String(value || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (p.startsWith('student-code/Projects/')) {
    p = 'student-code/projects/' + p.slice('student-code/Projects/'.length);
  }
  if (!p || p.includes('..') || p.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error('Invalid repository file path.');
  }
  return p;
}

function strongSecret(text) {
  const rules = [
    [/github_pat_[A-Za-z0-9_]{20,}/, 'GitHub token'],
    [/gh[pousr]_[A-Za-z0-9]{20,}/, 'GitHub token'],
    [/sk-[A-Za-z0-9_-]{20,}/, 'API key'],
    [/AKIA[0-9A-Z]{16}/, 'AWS access key'],
    [/AIza[0-9A-Za-z_-]{30,}/, 'Google API key'],
    [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key']
  ];
  for (const [re, name] of rules) if (re.test(text)) return name;
  return null;
}

async function gh(apiPath, token, options = {}) {
  const response = await fetch(`https://api.github.com${apiPath}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': API_VERSION,
      'User-Agent': 'CS-AI-Mastery-Local',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (_) {}
  if (!response.ok) {
    const error = new Error(data.message || `GitHub request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

function originAllowed(req) {
  const origin = String(req.headers.origin || '');
  if (!origin) return true;
  return /^http:\/\/(127\.0\.0\.1|localhost):5711$/i.test(origin);
}

function csrfOk(req) {
  return originAllowed(req) && String(req.headers['x-csai-csrf'] || '') === csrf;
}

function readBody(req, maxBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(Object.assign(new Error('Request body is too large.'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function parseJson(req) {
  const raw = await readBody(req);
  try { return raw ? JSON.parse(raw) : {}; }
  catch (_) { throw Object.assign(new Error('Invalid JSON request.'), { status: 400 }); }
}

async function localStatus() {
  const ghInstalled = commandExists('gh');
  if (!sessionEnabled) {
    return { connected: false, local: true, ghInstalled, authMethod: 'gh-cli', csrf: null, repositories: [] };
  }
  const token = getToken();
  if (!token) {
    return {
      connected: false,
      local: true,
      ghInstalled,
      authMethod: 'gh-cli',
      csrf: null,
      repositories: [],
      message: ghInstalled
        ? 'GitHub CLI is installed but not signed in. Click Connect GitHub.'
        : 'GitHub CLI is not installed. Run CONNECT_GITHUB.bat for the one-time setup.'
    };
  }

  const user = await gh('/user', token);
  const rawRepos = await gh('/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member', token);
  const repositories = (Array.isArray(rawRepos) ? rawRepos : [])
    .filter(repo => !repo.permissions || repo.permissions.push !== false)
    .map(repo => ({
      id: repo.id,
      full_name: repo.full_name,
      private: !!repo.private,
      default_branch: repo.default_branch || 'main'
    }))
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  return {
    connected: true,
    local: true,
    ghInstalled,
    authMethod: tokenFromEnvironment() ? 'environment-token' : 'gh-cli',
    csrf,
    user: { login: user.login, avatar_url: user.avatar_url },
    repositories,
    installUrl: null
  };
}

function launchGitHubLogin(rootDir) {
  if (!commandExists('gh')) return false;
  try {
    if (process.platform === 'win32') {
      const batch = path.join(rootDir, 'CONNECT_GITHUB.bat');
      const child = spawn('cmd.exe', ['/c', 'start', 'CSAI GitHub Login', 'cmd.exe', '/k', batch], {
        detached: true,
        stdio: 'ignore',
        windowsHide: false
      });
      child.unref();
      return true;
    }
    return false;
  } catch (_) {
    return false;
  }
}

function authPage({ launched, ghInstalled }) {
  const title = ghInstalled ? 'Connect GitHub locally' : 'GitHub CLI required';
  const primary = ghInstalled
    ? (launched
      ? 'A GitHub login window was opened. Finish signing in there. This page will detect it automatically.'
      : 'Run <code>gh auth login --web --git-protocol https</code> in the VS Code terminal, then click Check again.')
    : 'GitHub CLI is not installed yet. Run <code>CONNECT_GITHUB.bat</code> from the project folder; it will show the one-time install command.';
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#0b111b;color:#eef4fb;max-width:760px;margin:60px auto;padding:24px}main{border:1px solid #314155;border-radius:16px;padding:24px;background:#111b29}h1{margin-top:0}code{background:#08101a;padding:3px 7px;border-radius:6px}button,a{display:inline-block;margin-top:12px;border:0;border-radius:9px;padding:10px 14px;background:#4fd1c5;color:#06211f;font-weight:800;text-decoration:none;cursor:pointer}.muted{color:#aab8c8}</style></head><body><main><h1>${title}</h1><p>${primary}</p><p id="status" class="muted">Checking GitHub authentication…</p><button onclick="checkNow()">Check again</button> <a href="/github-setup.html">Back to GitHub</a></main><script>async function checkNow(){const el=document.getElementById('status');try{const r=await fetch('/api/github/status',{cache:'no-store'}),d=await r.json();if(d.connected){el.textContent='Connected as '+(d.user&&d.user.login||'GitHub user')+'. Redirecting…';location.href='/github-setup.html?github=connected';return}el.textContent=d.message||'Not connected yet. Finish the GitHub login and try again.'}catch(e){el.textContent=e.message}}setInterval(checkNow,2500);checkNow();</script></body></html>`;
}

async function handleStatus(req, res) {
  try { json(res, 200, await localStatus()); }
  catch (error) { json(res, error.status || 500, { connected: false, local: true, error: error.message }); }
}

async function handleAuthorize(req, res, rootDir) {
  sessionEnabled = true;
  try {
    const token = getToken();
    if (token) return redirect(res, '/github-setup.html?github=connected');
    const ghInstalled = commandExists('gh');
    const launched = ghInstalled ? launchGitHubLogin(rootDir) : false;
    return html(res, 200, authPage({ launched, ghInstalled }));
  } catch (error) {
    return html(res, 500, authPage({ launched: false, ghInstalled: commandExists('gh') }) + `\n<!-- ${String(error.message).replace(/-->/g, '')} -->`);
  }
}

async function handleFile(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
  if (!csrfOk(req)) return json(res, 403, { error: 'Invalid or expired local request. Refresh the page and try again.' });
  try {
    const token = getToken();
    if (!sessionEnabled || !token) return json(res, 401, { error: 'Connect GitHub locally first.' });
    const body = await parseJson(req);
    const repository = String(body.repository || '').trim();
    if (!repository) return json(res, 400, { error: 'Choose a GitHub repository first in GitHub.' });
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) return json(res, 400, { error: 'Invalid repository.' });
    const filePath = safePath(body.path);
    const content = String(body.content ?? '');
    const createOnly = body.createOnly === true || filePath.startsWith('student-code/');
    const requirePath = body.requirePath ? safePath(body.requirePath) : null;
    if (!content.trim()) return json(res, 400, { error: 'The file is empty.' });
    if (Buffer.byteLength(content, 'utf8') > MAX_FILE_BYTES) return json(res, 413, { error: 'File is too large to publish from the local app.' });
    const secret = strongSecret(content);
    if (secret) return json(res, 400, { error: `Remove the detected ${secret} before publishing.` });

    const [owner, repo] = repository.split('/');
    const repoInfo = await gh(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, token);
    const branch = String(body.branch || repoInfo.default_branch || 'main').trim();
    const encoded = p => p.split('/').map(encodeURIComponent).join('/');

    if (requirePath) {
      try { await gh(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encoded(requirePath)}?ref=${encodeURIComponent(branch)}`, token); }
      catch (error) {
        if (error.status === 404) return json(res, 400, { error: 'Publish the code first.' });
        throw error;
      }
    }

    let sha = null;
    let currentUrl = null;
    try {
      const current = await gh(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encoded(filePath)}?ref=${encodeURIComponent(branch)}`, token);
      sha = current.sha;
      currentUrl = current.html_url || null;
    } catch (error) {
      if (error.status !== 404) throw error;
    }

    if (sha && createOnly) {
      return json(res, 200, {
        ok: true,
        alreadyExists: true,
        path: filePath,
        repository,
        commit: null,
        url: currentUrl || `https://github.com/${repository}/blob/${branch}/${filePath}`
      });
    }

    const message = String(body.message || `${sha ? 'Update' : 'Add'} ${filePath} from CS & AI Mastery`).slice(0, 200);
    const payload = { message, content: Buffer.from(content, 'utf8').toString('base64'), branch };
    if (sha) payload.sha = sha;
    const saved = await gh(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encoded(filePath)}`, token, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return json(res, 200, {
      ok: true,
      alreadyExists: false,
      path: filePath,
      repository,
      commit: saved.commit?.sha || null,
      url: saved.content?.html_url || `https://github.com/${repository}/blob/${branch}/${filePath}`
    });
  } catch (error) {
    return json(res, error.status || 500, { error: error.message || 'GitHub publish failed.' });
  }
}

async function handleSync(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
  if (!csrfOk(req)) return json(res, 403, { error: 'Security check failed. Refresh the page and try again.' });
  try {
    const token = getToken();
    if (!sessionEnabled || !token) return json(res, 401, { error: 'Connect GitHub locally first.' });
    const body = await parseJson(req);
    const owner = String(body.owner || '');
    const repo = String(body.repo || '');
    const branch = String(body.branch || 'main');
    const filePath = safePath(body.path);
    const content = String(body.content || '');
    if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) return json(res, 400, { error: 'Invalid repository.' });
    if (Buffer.byteLength(content, 'utf8') > 600000) return json(res, 413, { error: 'This code file is too large to sync.' });
    const secret = strongSecret(content);
    if (secret) return json(res, 400, { error: `Sync blocked because the file appears to contain a ${secret}.` });

    const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
    const apiPath = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`;
    let existing = null;
    try { existing = await gh(`${apiPath}?ref=${encodeURIComponent(branch)}`, token); }
    catch (error) { if (error.status !== 404) throw error; }

    if (existing?.content) {
      const old = Buffer.from(existing.content.replace(/\n/g, ''), 'base64').toString('utf8');
      if (old === content) return json(res, 200, { ok: true, unchanged: true, commitUrl: null, path: filePath });
    }

    const payload = {
      message: String(body.message || `Update ${filePath}`).slice(0, 200),
      content: Buffer.from(content, 'utf8').toString('base64'),
      branch
    };
    if (existing?.sha) payload.sha = existing.sha;

    let result;
    try {
      result = await gh(apiPath, token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (error) {
      if (error.status !== 409) throw error;
      const latest = await gh(`${apiPath}?ref=${encodeURIComponent(branch)}`, token);
      payload.sha = latest.sha;
      result = await gh(apiPath, token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    return json(res, 200, { ok: true, unchanged: false, path: filePath, commitUrl: result.commit?.html_url || null });
  } catch (error) {
    return json(res, error.status || 500, { error: error.message || 'GitHub sync failed.' });
  }
}

async function route(req, res, pathname, rootDir) {
  if (!pathname.startsWith('/api/github/')) return false;
  if (pathname === '/api/github/status') { await handleStatus(req, res); return true; }
  if (pathname === '/api/github/authorize') { await handleAuthorize(req, res, rootDir); return true; }
  if (pathname === '/api/github/file') { await handleFile(req, res); return true; }
  if (pathname === '/api/github/sync') { await handleSync(req, res); return true; }
  if (pathname === '/api/github/disconnect') {
    if (req.method !== 'POST') { json(res, 405, { error: 'Method not allowed.' }); return true; }
    sessionEnabled = false;
    json(res, 200, { ok: true, local: true });
    return true;
  }
  if (pathname === '/api/github/callback') {
    redirect(res, '/github-setup.html?github=connected');
    return true;
  }
  json(res, 404, { error: 'Unknown local GitHub route.' });
  return true;
}

module.exports = { route, safePath, strongSecret, getToken, commandExists };
