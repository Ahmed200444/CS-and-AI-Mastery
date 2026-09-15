# CS & AI Mastery

> **Windows installable build:** Extract the ZIP and run `INSTALL_ON_MY_COMPUTER.bat` once. It creates a permanent copy under `%LOCALAPPDATA%\CS-and-AI-Mastery` plus a desktop shortcut, avoiding OneDrive/Documents sync issues. After installation, ChatGPT is not required.


CS & AI Mastery is an interactive learning platform for building practical computer science, software engineering, and AI skills. It is designed around learning a concept, seeing it work, practicing it, reviewing it later, and turning completed work into a clean GitHub portfolio.

## What the platform includes
- 62 generated course pages across core CS, software engineering, and AI topics.
- A dedicated **C++ Programming & DSA** mastery course: 54 lessons from C++ fundamentals through modern C++ and interview-grade data structures/algorithms.
- Structured lessons with explanations, examples, review tools, exercises, and projects.
- Guided practice scaffolding across every course, lesson, example, exercise, project/capstone, and knowledge check: it tells you what building blocks to use and what order to work in without giving you the finished solution.
- Browser-based execution for supported Python, C++, JavaScript, SQL, and HTML learning activities.
- Safe simulation and validation guidance for infrastructure topics that should not execute real system or cloud commands in a learning browser.
- Practice and project workspaces with Run, Check/Submit, Reset, Reveal, and GitHub publishing tools where appropriate.
- Review states and recurring mastery tools for returning to material later.

## Learning tracks
The repository covers foundations and internship-oriented topics including Python, SQL, Git, Linux, DSA, integrated Python OOP, software engineering practice, APIs/backend/web development, classical AI, machine learning, deep learning, transformers, LLMs, reinforcement learning and LLM post-training, RAG, AI agents with MCP, distributed AI training/inference, deployment, Docker, cloud concepts, and system design.

## GitHub portfolio publishing
Course exercises, examples, and projects publish into deterministic folders under `student-code/`. Portfolio code paths are create-once so revisiting a lesson cannot silently overwrite an earlier submission or create duplicate update commits. A separate **Add a README** action documents an item only after its code exists, and README creation is duplicate-protected too.

```text
student-code/
  practice/<course>/<item>/
    <item>.<ext>
    README.md
  examples/<course>/<item>/
    example.<ext>
    README.md
  projects/<course>/<project>/
    <project>.<ext>
    README.md
```

## Repository structure
- `assets/` — shared browser UI, runners, editors, review systems, and learning tools.
- `scripts/` — course generation, injection, audits, build-time repairs, and verification gates.
- `netlify/functions/` — server-side GitHub OAuth/session and publishing endpoints.
- `tests/` — repository contracts and final quality checks.
- `student-code/` — completed practice and portfolio submissions.
- `courses/` — generated during the production build and verified as a 62-course set.

## Development and verification
Requirements: Node.js 20 or newer.
```bash
npm ci
npm test
```
The Netlify production build runs the course-generation pipeline and the repository's audits/verifiers. A GitHub Actions quality gate executes the same build command from `netlify.toml` on a complete checkout so generated-course failures are caught before merging quality upgrades.

## Security and safety
GitHub access uses two secure backends: Netlify functions for an optional hosted deployment, and the included local Node/GitHub-CLI backend when using `START_SITE.bat`. Both flows keep credentials out of page JavaScript and apply CSRF/path/size/secret checks before publishing. Infrastructure-oriented examples are simulated or validated in the browser rather than executing real operating-system, network, Docker, cloud, or deployment commands.

## Goal
The goal is a platform that remains useful months later: understand the mental model, run or simulate the idea, inspect output, practice it, debug mistakes, review it, and keep strong completed work in a readable GitHub portfolio.

## Local GitHub publishing (no Netlify required)

For the local VS Code/Windows build, start the site with `START_SITE.bat`. GitHub publishing is handled by the included local Node server.

One-time setup:

```text
CONNECT_GITHUB.bat
```

If GitHub CLI is not installed, the launcher shows the `winget` install command. Authentication is performed by GitHub CLI; CS & AI Mastery reads the credential at runtime and does not store the token in the project files.

## Automatic fast Run / Check

This build automatically prewarms the Python runtime on Python-heavy courses, the C++ runtime on C++ Programming & DSA, and the SQL runtime on SQL/Databases pages. The currently open Python source is also prepared in the background, and repeated import preparation is cached. This reduces the delay on the first Run/Check and keeps later runs fast without changing lesson, project, GitHub, README, or inline-input behavior.

Python Run/Check also recovers automatically from abandoned `input()` prompts: starting another Python run cancels the stale run instead of leaving the platform locked. The inline terminal has a **Cancel** button, and simple `int(input(...))` / `float(input(...))` programs validate numeric input before submission. Plain `input()` still accepts normal text exactly like Python.


Code workspaces support direct editing and automatic indentation across examples, exercises, assessments, and projects.

## Reliable local startup

The Windows launcher now starts the study server in the background, waits for the local health check to pass, and only then opens `http://127.0.0.1:5711/`. The launcher window may be closed after startup; the study server stays running. If startup fails, `csai-server.log` records the error. Use `STOP_CSAI.bat` to stop the background server.

The installer and launcher can detect a local GitHub CLI sign-in, but no repository is selected automatically. Use the **GitHub** page to connect your own account and choose your own repository. GitHub credentials remain in GitHub CLI and are never copied into the project.
