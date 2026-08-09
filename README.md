# CS & AI Mastery

CS & AI Mastery is an interactive computer-science and artificial-intelligence learning platform built for deep revision, hands-on practice, and software/AI internship preparation.

The repository combines structured lessons with runnable examples, exercises, projects, review scheduling, and a GitHub portfolio workflow so learning does not stop at reading notes.

## What the platform covers

The generated platform contains **54 course pages** spanning core computer science, software engineering, and applied AI topics, including:

- Python, C++, SQL, object-oriented programming, and data structures & algorithms
- Git, Linux, debugging, testing, APIs, backend engineering, and system design
- Machine learning, deep learning, transformers, generative AI, LLMs, RAG, AI agents, and model deployment
- Docker, cloud/platform engineering, networking, and other internship-relevant engineering skills

## Learning experience

Each course is designed around active learning rather than passive reading:

- Expanded lesson explanations and mental models
- Guided, practical, and edge/failure-case examples
- Step-by-step code explanations
- In-browser editors with smart indentation and Tab / Shift+Tab support
- Real output for browser-safe languages
- Safe simulation/validation output for Linux, Git, Docker, cloud, and networking commands
- Exercises, quizzes, reveal/reset controls, and course projects
- Evergreen review states: **Need review**, **Getting it**, and **Confident**

## Browser runners

The platform supports runnable or previewable examples for:

- **Python** — Pyodide
- **C++** — browser toolchain with a lightweight fallback where appropriate
- **JavaScript** — isolated Web Worker execution
- **SQL** — in-browser SQLite
- **HTML** — sandboxed browser preview

System-level commands are never pretended to have executed. Shell, Git, Docker, cloud, and networking material uses clearly labeled simulation/validation output instead.

## GitHub portfolio workflow

Exercises, lesson examples, and projects can be saved as portfolio items from the course UI.

Each item uses its own directory under `student-code/`, with separate actions for:

- **Publish to GitHub**
- **Add a README**

Learner portfolio files are **create-once**. Revisiting a lesson and publishing the same item again does not overwrite the existing solution or create another commit. A README is also create-once and can only be added after its matching code file exists.

Example structure:

```text
student-code/
├── practice/
│   ├── python/
│   │   └── fizzbuzz/
│   │       ├── fizzbuzz.py
│   │       └── README.md
│   └── dsa/
│       └── two-sum/
│           ├── dsa-two-sum.py
│           └── README.md
├── examples/
└── projects/
```

## Repository structure

```text
assets/                 Browser learning/runtime modules
netlify/functions/      GitHub OAuth and publishing API
scripts/                Course generation, injection, audit, and verification tools
student-code/           Published practice/examples/projects
 tests/                  Automated contract and release-quality checks
index.html               Main application shell
netlify.toml             Production build and Netlify routing
```

## Build and verification

The production build generates the static course pages and runs a large verification chain covering course count, navigation, language modes, lesson examples, practice tools, compiler runners, project workspaces, and the final quality layer.

Run the repository tests with:

```bash
npm test
```

The permanent GitHub Actions quality gate also runs the production build on release branches and `main` before a release is considered healthy.

## Security notes

GitHub integration uses server-side OAuth handling with encrypted HttpOnly session cookies, CSRF/origin checks, repository-path validation, and secret-pattern checks. Browser code never receives the GitHub access token.

See `SETUP.md` for deployment and environment configuration.
