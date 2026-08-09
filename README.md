# CS & AI Mastery

CS & AI Mastery is a long-term interactive learning platform for computer science, software engineering, and AI. It is built to be something you can return to months later, reopen a concept, understand the reasoning again, run the code, practice it, debug mistakes, and keep the strongest completed work in a clean GitHub portfolio.

The platform currently generates **54 course pages** and hundreds of lessons, exercises, examples, review activities, and projects from one repository.

## How learning works

A lesson is meant to move through the same learning loop every time:

1. **Understand the mental model** — what the concept means and why it exists.
2. **See examples** — basic, practical, and edge-case examples where the topic supports them.
3. **Run or safely simulate** — executable code runs in the browser; infrastructure topics show clearly labeled validation/simulation output instead of pretending a browser executed a real machine or cloud command.
4. **Inspect the output** — the result appears next to the code so the relationship between code and behavior is visible.
5. **Read the explanation** — examples include step-by-step explanations of what important lines and structures are doing.
6. **Practice** — exercises provide an editor, Run/Check, output, Reset, Reveal, and Submit/Mark controls as appropriate.
7. **Build** — projects use the same editor/output workflow and preserve drafts.
8. **Review later** — Evergreen review tools and progress state make the platform useful for revision instead of only first-time study.

The goal is not to add as many pages as possible. The goal is for each page to remain understandable when you come back to it later.

## Compilers and output

Supported browser learning paths include:

- **Python** — Pyodide-based execution with captured stdout and tracebacks.
- **C++** — a dedicated Worker-based clang++/wasm-ld/WASI toolchain for supported course examples and C++ workspaces.
- **JavaScript** — isolated Worker execution for supported examples and exercises.
- **SQL** — an in-browser SQL database for supported exercises.
- **HTML** — sandboxed browser preview.
- **Shell, Git, Docker, networking, cloud, and system/infrastructure work** — safe validation/simulation output instead of executing privileged system commands from a learning page.

Heavy runtimes are loaded on demand so opening a lesson does not need to download a compiler before you ask to run code.

## Editor experience

Coding workspaces use four-space indentation, visual indentation guides, Tab/Shift+Tab support, and smart newline indentation. Python block keywords such as `elif`, `else`, `except`, and `finally` are handled specially so the editor behaves closer to a normal development editor rather than a plain textarea.

Python, C++, and Dual course modes preserve language-specific drafts where those modes apply. Dual mode keeps one editor and uses the language represented by the active code when running or publishing.

## Language-safe GitHub portfolio

Every publishable item has two separate actions:

- **Publish to GitHub**
- **Add a README**

Publishing is **create-once** for `student-code/` paths. Revisiting a lesson and pressing Publish again does not overwrite the earlier solution or create a pointless update commit. README creation is also create-once, and the server requires the corresponding code file to exist first.

Python and C++ versions of the **same exercise** live in separate folders:

```text
student-code/
  practice/<course>/<exercise>/
    python/
      solution.py
      README.md
    cpp/
      solution.cpp
      README.md

  examples/<course>/<example>/
    python/
      example.py
      README.md
    cpp/
      example.cpp
      README.md

  projects/<course>/<project>/
    python/
      solution.py
      README.md
    cpp/
      solution.cpp
      README.md
```

This means completing an exercise in Python never overwrites the C++ version, and completing it later in C++ never overwrites the Python version.

The README beside a solution is generated from the **exact item currently being published**: its course, title, task/description, available requirements, selected language, code filename, run command, and code structures that can be detected without inventing claims. It is not a generic README copied across unrelated exercises.

## Repository structure

- `assets/` — browser UI, editors, compilers/runners, GitHub publishing controls, review tools, and shared course behavior.
- `scripts/` — course generation, content expansion, injection, audits, repairs, and deployment verifiers.
- `netlify/functions/` — GitHub OAuth/session and secure publishing endpoints.
- `tests/` — repository contracts, browser certification, and live-site smoke testing.
- `student-code/` — completed practice/project portfolio work.
- `courses/` — generated during the production build; exactly 54 pages are required by the quality gates.

## Architecture

At a high level:

```text
Source course data
      │
      ▼
Build / injection pipeline
      │
      ├── content expansion and example auditing
      ├── practice + project workspaces
      ├── language-mode controllers
      ├── compiler/output integrations
      ├── GitHub portfolio controls
      └── final quality verification
      │
      ▼
54 static course pages
      │
      ├── browser learning/runtime features
      └── /api/github/* → Netlify Functions → GitHub
```

The site is intentionally static-first. Course pages are generated during the build, while privileged GitHub operations stay server-side.

## Verification and reliability

A GitHub Actions **Quality Gate** runs on the certification branch and `main`. It:

1. installs repository dependencies,
2. runs contract tests,
3. executes the exact production build command from `netlify.toml`,
4. verifies the 54-course generated platform,
5. executes or compiles every generated Python/C++ runnable candidate discovered in the generated course pages,
6. launches Chromium with Playwright and click-tests the generated platform,
7. checks language switching, editor workspaces, output feedback, projects, publishing paths, per-item README placement, and UI response budgets,
8. and, on `main`, performs a smoke check against the live Netlify deployment.

The browser test uses a mocked GitHub write endpoint so certification cannot create junk portfolio commits. Real GitHub repository access and server-side security are verified separately.

## Performance approach

The platform favors immediate page interaction over eager compiler downloads:

- course pages are static,
- compiler runtimes are lazy-loaded,
- Python prewarming is disabled where it would slow first interaction,
- UI controls show feedback immediately,
- the service worker excludes `/api/` and Netlify Function requests,
- failed non-navigation asset requests never fall back to `index.html`,
- and browser certification enforces a sub-second budget for local page/UI response.

A cold Python or C++ compiler initialization can still take longer than one second because it may need to initialize a WebAssembly runtime/toolchain. That cold-runtime cost is measured separately from whether the website itself reacted immediately.

## Security model

GitHub credentials are not embedded into lesson HTML or stored in page JavaScript. GitHub access is handled through Netlify Functions using the authenticated session.

Publishing requests include:

- CSRF validation,
- repository/path validation,
- file-size limits,
- secret-pattern detection,
- create-once portfolio semantics,
- and README-to-code dependency checks.

The service worker deliberately avoids caching authenticated GitHub API/function responses.

## Development

Requirements: **Node.js 20 or newer**.

```bash
npm install
npm test
```

To reproduce the full certification locally after the production build has generated `courses/`:

```bash
npm run certify:code
npx playwright install chromium
npm run certify:browser
```

## Purpose

This repository is both a learning system and an engineering portfolio. Its standard is simple: when you reopen a lesson later, the platform should help you understand the idea again; when you run code, the result should be visible; when something fails, the error should be useful; and when you publish completed work, the GitHub structure should remain readable and accurate.
