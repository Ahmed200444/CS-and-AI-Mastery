'use strict';

const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');

const ROOT = __dirname;
const PORT = 5711;
const RELEASE = '5.74';
const HEALTH = `http://127.0.0.1:${PORT}/__health`;
const HOME = `http://127.0.0.1:${PORT}/index.html`;
const LOG = path.join(ROOT, 'csai-server.log');
const PID_FILE = path.join(ROOT, '.csai-server.pid');
const BOOTSTRAP = path.join(ROOT, 'server-bootstrap.js');

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function appendLog(text) {
  try { fs.appendFileSync(LOG, String(text || '') + '\n', 'utf8'); } catch (_) {}
}
function existsCommand(command) {
  try { execFileSync(command, ['--version'], { stdio: 'ignore', timeout: 4000, windowsHide: true }); return true; }
  catch (_) { return false; }
}
function githubStatus() {
  if (!existsCommand('gh')) return { installed: false, connected: false, repo: false };
  try {
    execFileSync('gh', ['auth', 'status'], { stdio: 'ignore', timeout: 5000, windowsHide: true });
  } catch (_) {
    return { installed: true, connected: false, repo: false };
  }
  let login = '';
  try { login = String(execFileSync('gh', ['api', 'user', '--jq', '.login'], { encoding: 'utf8', timeout: 7000, windowsHide: true })).trim(); } catch (_) {}
  return { installed: true, connected: true, login };
}
async function probeHealth() {
  try {
    const r = await fetch(HEALTH, { cache: 'no-store', signal: AbortSignal.timeout(1400) });
    let data = null;
    try { data = await r.json(); } catch (_) {}
    return { reachable: true, status: r.status, data };
  } catch (_) {
    return { reachable: false, status: 0, data: null };
  }
}
function currentHealth(probe) {
  const data = probe && probe.data;
  return data && data.ok && data.release === RELEASE ? data : null;
}
function openBrowser(url) {
  if (process.platform === 'win32') {
    const c = spawn('cmd.exe', ['/d', '/s', '/c', 'start', '', url], { detached: true, stdio: 'ignore', windowsHide: true });
    c.unref();
  } else if (process.platform === 'darwin') {
    const c = spawn('open', [url], { detached: true, stdio: 'ignore' }); c.unref();
  }
}
function removeStalePidFile() {
  try {
    const raw = fs.readFileSync(PID_FILE, 'utf8').trim();
    if (!/^\d+$/.test(raw)) fs.unlinkSync(PID_FILE);
  } catch (_) {}
}
function stopOldCsaiServerOnPort() {
  if (process.platform !== 'win32') return { stopped: false, occupied: false };
  const ps = [
    "$ErrorActionPreference='SilentlyContinue'",
    `$c=Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort ${PORT} -State Listen | Select-Object -First 1`,
    "if(-not $c){exit 0}",
    "$p=Get-CimInstance Win32_Process -Filter ('ProcessId=' + $c.OwningProcess)",
    "$cmd=($p.CommandLine | Out-String)",
    "$exe=($p.ExecutablePath | Out-String)",
    "if($cmd -match 'CS-and-AI-Mastery' -or $cmd -match 'local-server\\.js' -or $cmd -match 'server-bootstrap\\.js'){Stop-Process -Id $c.OwningProcess -Force; Write-Output ('STOPPED:'+$c.OwningProcess); exit 0}",
    "Write-Output ('OCCUPIED:'+$c.OwningProcess+':'+$exe.Trim())"
  ].join('; ');
  try {
    const out = String(execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps], {
      encoding: 'utf8', timeout: 7000, windowsHide: true
    }) || '').trim();
    if (out.startsWith('STOPPED:')) return { stopped: true, occupied: false, detail: out };
    if (out.startsWith('OCCUPIED:')) return { stopped: false, occupied: true, detail: out };
  } catch (error) {
    appendLog('[launcher] Port cleanup check failed: ' + (error && error.message || error));
  }
  return { stopped: false, occupied: false };
}
function startServer() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(BOOTSTRAP)) {
      reject(new Error('Missing server-bootstrap.js in ' + ROOT));
      return;
    }
    if (!fs.existsSync(path.join(ROOT, 'local-server.js'))) {
      reject(new Error('Missing local-server.js in ' + ROOT));
      return;
    }

    fs.writeFileSync(LOG,
      `CS & AI Mastery server log\nLauncher release: ${RELEASE}\nStarted: ${new Date().toISOString()}\nNode: ${process.execPath}\nFolder: ${ROOT}\n\n`,
      'utf8');

    let child;
    try {
      child = spawn(process.execPath, [BOOTSTRAP], {
        cwd: ROOT,
        detached: true,
        windowsHide: true,
        env: { ...process.env, CSAI_NO_AUTO_OPEN: '1' },
        stdio: 'ignore'
      });
    } catch (error) {
      appendLog('[launcher] spawn threw: ' + (error && error.stack || error));
      reject(error);
      return;
    }

    let settled = false;
    const state = { child, pid: null, exited: false, exitCode: null, signal: null };
    const fail = (error) => {
      appendLog('[launcher] Server process spawn error: ' + (error && error.stack || error));
      if (!settled) { settled = true; reject(error); }
    };
    child.once('error', fail);
    child.once('exit', (code, signal) => {
      state.exited = true;
      state.exitCode = code;
      state.signal = signal;
      appendLog(`[launcher] Server process exited. code=${code} signal=${signal || ''}`);
    });
    child.once('spawn', () => {
      state.pid = child.pid;
      try { fs.writeFileSync(PID_FILE, String(child.pid), 'utf8'); } catch (error) { appendLog('[launcher] PID file write failed: ' + error.message); }
      appendLog('[launcher] Detached server process created. PID=' + child.pid);
      child.unref();
      if (!settled) { settled = true; resolve(state); }
    });
  });
}
function tailLog() {
  try {
    const text = fs.readFileSync(LOG, 'utf8');
    return text.split(/\r?\n/).slice(-45).join('\n');
  } catch (_) { return 'No server log was created.'; }
}
function launchGitHubSetup() {
  const batch = path.join(ROOT, 'CONNECT_GITHUB.bat');
  if (process.platform === 'win32' && fs.existsSync(batch)) {
    const c = spawn('cmd.exe', ['/d', '/s', '/c', 'start', 'CSAI GitHub Login', 'cmd.exe', '/k', batch], { detached: true, stdio: 'ignore', windowsHide: false });
    c.unref();
  }
}

(async () => {
  console.log('\nCS & AI Mastery — reliable launcher');
  console.log('===================================');

  const gh = githubStatus();
  if (gh.connected) {
    console.log(`GitHub CLI: connected${gh.login ? ' as ' + gh.login : ''} ✓`);
    console.log('Repository: choose one from the GitHub page in the website.');
  } else if (gh.installed) {
    console.log('GitHub CLI: installed, but not signed in. GitHub is optional; connect it from the GitHub page when needed.');
  } else {
    console.log('GitHub CLI: not installed. The website will still open; run CONNECT_GITHUB.bat to connect GitHub.');
  }

  removeStalePidFile();
  let probe = await probeHealth();
  let h = currentHealth(probe);

  if (!h && probe.reachable) {
    const release = probe.data && probe.data.release;
    if (probe.data && probe.data.ok) {
      console.log(`An older CS & AI Mastery server is running${release ? ' (v' + release + ')' : ''}. Replacing it…`);
    } else {
      console.log(`Port ${PORT} is already responding, but it is not the current CS & AI Mastery server.`);
    }
    const cleanup = stopOldCsaiServerOnPort();
    if (cleanup.stopped) {
      console.log('Old CS & AI Mastery server stopped ✓');
      await sleep(700);
      probe = await probeHealth();
      h = currentHealth(probe);
    } else if (cleanup.occupied) {
      console.error(`Port ${PORT} is being used by another program. Close that program, then run CS & AI Mastery again.`);
      console.error('Details: ' + cleanup.detail);
      process.exitCode = 1;
      return;
    }
  }

  let serverState = null;
  if (!h) {
    console.log('Local server is not running. Starting it now…');
    try {
      serverState = await startServer();
    } catch (error) {
      console.error('\nWindows could not create the local server process.');
      console.error('Reason: ' + (error && error.message || error));
      console.error('Server log: ' + LOG);
      console.error('\nLast log lines:\n' + tailLog());
      process.exitCode = 1;
      return;
    }

    // Give slower Windows/antivirus systems plenty of time, but stop early if
    // the detached process has already failed.  v5.36 waited only 10 seconds.
    for (let i = 0; i < 120; i++) {
      await sleep(250);
      probe = await probeHealth();
      h = currentHealth(probe);
      if (h || (serverState && serverState.exited)) break;
    }
  }

  if (!h) {
    console.error('\nThe local server could not start.');
    if (serverState && serverState.exited) {
      console.error(`Server process exited early (code ${serverState.exitCode}${serverState.signal ? ', signal ' + serverState.signal : ''}).`);
    }
    console.error('Server log: ' + LOG);
    console.error('\nLast log lines:\n' + tailLog());
    console.error('\nKeep this window open and send a screenshot of the error above if needed.');
    process.exitCode = 1;
    return;
  }

  console.log(`Local server: ready ✓  (${h.files || '?'} files, build ${h.build || '?'}, v${h.release || RELEASE})`);
  console.log('Opening: ' + HOME);
  openBrowser(HOME + `?launcher=${RELEASE}`);
  console.log('\nYou may close this launcher window. The study server will keep running in the background.');
  console.log('Use STOP_CSAI.bat if you want to stop the local server.\n');
})().catch(err => {
  appendLog('[launcher] Fatal launcher error: ' + (err && err.stack || err));
  console.error('\nLauncher error: ' + (err && err.stack || err));
  process.exitCode = 1;
});
