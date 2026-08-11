# CS & AI Mastery

CS & AI Mastery is an interactive learning platform for building practical computer science, software engineering, and AI skills. It is designed around learning a concept, seeing it work, practicing it, reviewing it later, and turning completed work into a clean GitHub portfolio.

## What the platform includes
- 57 generated course pages across core CS, software engineering, and AI topics.
- Structured lessons with explanations, examples, review tools, exercises, and projects.
- Browser-based execution for supported Python, JavaScript, SQL, and HTML learning activities.
- Safe simulation and validation guidance for infrastructure topics that should not execute real system or cloud commands in a learning browser.
- Practice and project workspaces with Run, Check/Submit, Reset, Reveal, and GitHub publishing tools where appropriate.
- Review states and recurring mastery tools for returning to material later.

## Learning tracks
The repository covers foundations and internship-oriented topics including Python, SQL, Git, Linux, data structures and algorithms, object-oriented programming, debugging, testing, APIs, backend development, web development, machine learning, deep learning, transformers, LLMs, RAG, AI agents, deployment, Docker, cloud concepts, and system design.

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
- `courses/` — generated during the production build and verified as a 57-course set.

## Development and verification
Requirements: Node.js 20 or newer.
```bash
npm ci
npm test
```
The Netlify production build runs the course-generation pipeline and the repository's audits/verifiers. A GitHub Actions quality gate executes the same build command from `netlify.toml` on a complete checkout so generated-course failures are caught before merging quality upgrades.

## Security and safety
GitHub access is handled server-side through Netlify functions. Publishing requests use the authenticated session, CSRF validation, safe repository paths, file-size checks, and basic secret-pattern detection. Infrastructure-oriented examples are simulated or validated in the browser rather than executing real operating-system, network, Docker, cloud, or deployment commands.

## Goal
The goal is a platform that remains useful months later: understand the mental model, run or simulate the idea, inspect output, practice it, debug mistakes, review it, and keep strong completed work in a readable GitHub portfolio.
