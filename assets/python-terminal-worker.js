'use strict';

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js';
const PYODIDE_INDEX = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/';

let pyodidePromise = null;

function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      importScripts(PYODIDE_URL);
      return self.loadPyodide({ indexURL: PYODIDE_INDEX });
    })();
  }
  return pyodidePromise;
}

function post(runId, type, extra = {}) {
  self.postMessage({ runId, type, ...extra });
}

async function runPython({ runId, code, controlBuffer, dataBuffer }) {
  const pyodide = await getPyodide();
  const control = new Int32Array(controlBuffer);
  const data = new Uint8Array(dataBuffer);
  const stdoutDecoder = new TextDecoder();
  const stderrDecoder = new TextDecoder();
  const stdinDecoder = new TextDecoder();

  // control[0]: 0 idle, 1 waiting for input, 2 input ready, 3 cancelled
  // control[1]: number of valid bytes in dataBuffer
  pyodide.setStdout({
    write(buffer) {
      post(runId, 'stdout', { text: stdoutDecoder.decode(buffer, { stream: true }) });
      return buffer.length;
    },
    isatty: true,
  });

  pyodide.setStderr({
    write(buffer) {
      post(runId, 'stderr', { text: stderrDecoder.decode(buffer, { stream: true }) });
      return buffer.length;
    },
    isatty: true,
  });

  pyodide.setStdin({
    stdin() {
      Atomics.store(control, 0, 1);
      Atomics.store(control, 1, 0);
      post(runId, 'input-request');

      while (Atomics.load(control, 0) === 1) {
        Atomics.wait(control, 0, 1, 1000);
      }

      if (Atomics.load(control, 0) === 3) {
        throw new Error('Execution cancelled.');
      }

      const length = Math.max(0, Math.min(Atomics.load(control, 1), data.length));
      const text = stdinDecoder.decode(data.subarray(0, length));
      Atomics.store(control, 0, 0);
      Atomics.store(control, 1, 0);
      return text;
    },
    isatty: true,
  });

  try {
    try {
      await pyodide.loadPackagesFromImports(code);
    } catch (_) {
      // The Python run below will surface a useful import error if needed.
    }
    await pyodide.runPythonAsync(code, { filename: '<course-project>' });
    post(runId, 'done');
  } catch (error) {
    post(runId, 'error', {
      text: error && (error.stack || error.message) ? (error.stack || error.message) : String(error),
    });
  } finally {
    pyodide.setStdin();
    pyodide.setStdout();
    pyodide.setStderr();
  }
}

self.onmessage = (event) => {
  const message = event.data || {};
  if (message.type === 'run') {
    runPython(message);
  }
};
