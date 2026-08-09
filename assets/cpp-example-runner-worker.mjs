const BUNDLE_URL = new URL('./emception-vite/emception-browser-bundle.mjs?v=20260809-4', import.meta.url).href;

let api = null;
let apiPromise = null;
let queue = Promise.resolve();
let activeRequestId = null;

function post(type, id, payload = {}) {
  self.postMessage({ type, id, ...payload });
}

function progress(id, message) {
  post('progress', id, { message: String(message || '') });
}

async function compileSource(em, sourcePath, outputPath) {
  const tools = ['em++', 'clang++', 'clang'];
  let last = '';
  for (const tool of tools) {
    try {
      const result = await em.run(tool, [sourcePath, '-std=c++17', '-O0', '-o', outputPath]);
      if (result && result.exitCode === 0) return result;
      last = String(result?.stderr || '') || String(result?.stdout || '');
    } catch (error) {
      last = error?.message || String(error);
    }
  }
  throw new Error(last || 'C++ compilation failed.');
}

async function smokeTest(em) {
  progress(activeRequestId, 'Checking the C++ compiler…');
  const stamp = `smoke-${Date.now().toString(36)}`;
  const sourcePath = `/home/user/${stamp}.cpp`;
  const outputPath = `/home/user/${stamp}.out`;
  await em.writeFile(sourcePath, '#include <iostream>\nusing namespace std;\nint main(){ cout << "CSAI_CPP_OK" << endl; return 0; }\n');
  await compileSource(em, sourcePath, outputPath);
  const result = await em.run(outputPath, []);
  const text = String(result?.stdout || '') + String(result?.stderr || '');
  if (!result || result.exitCode !== 0 || !text.includes('CSAI_CPP_OK')) {
    throw new Error(`C++ compiler smoke test failed. ${text}`.trim());
  }
}

async function getCompiler(id) {
  activeRequestId = id;
  if (api) return api;
  if (!apiPromise) {
    apiPromise = (async () => {
      progress(id, 'Loading the C++ compiler in the background…');
      const mod = await import(BUNDLE_URL);
      if (!mod || typeof mod.createEmception !== 'function') {
        throw new Error('Local C++ compiler module did not load.');
      }
      progress(id, 'Starting the C++ compiler…');
      const em = await mod.createEmception({ tty: 'none' });
      if (typeof em.on === 'function') {
        em.on('progress', info => {
          if (!activeRequestId) return;
          const message = info && (info.message || info.phase);
          if (message) progress(activeRequestId, String(message));
        });
      }
      await smokeTest(em);
      api = em;
      progress(id, 'C++ compiler ready. Compiling your example…');
      return em;
    })().catch(error => {
      apiPromise = null;
      api = null;
      throw error;
    });
  }
  return apiPromise;
}

async function runCode(id, code) {
  try {
    const em = await getCompiler(id);
    activeRequestId = id;
    const stamp = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const sourcePath = `/home/user/csai-${stamp}.cpp`;
    const outputPath = `/home/user/csai-${stamp}.out`;
    progress(id, 'Compiling C++…');
    await em.writeFile(sourcePath, String(code || ''));
    await compileSource(em, sourcePath, outputPath);
    progress(id, 'Running C++…');
    const result = await em.run(outputPath, []);
    const text = String(result?.stdout || '') + String(result?.stderr || '');
    post('result', id, {
      error: !result || result.exitCode !== 0,
      text: text || '(no output)'
    });
  } catch (error) {
    post('result', id, {
      error: true,
      text: error?.message || String(error)
    });
    if (!api) apiPromise = null;
  } finally {
    if (activeRequestId === id) activeRequestId = null;
  }
}

self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type === 'dispose') {
    try { api?.dispose?.(); } catch (_) {}
    api = null;
    apiPromise = null;
    activeRequestId = null;
    return;
  }
  if (data.type !== 'run' || !data.id) return;
  queue = queue.then(() => runCode(data.id, data.code)).catch(error => {
    post('result', data.id, { error: true, text: error?.message || String(error) });
  });
});
