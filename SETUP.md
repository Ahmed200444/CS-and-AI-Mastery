# CS & AI Mastery v5.19.1 — GitHub and Netlify setup

The platform can be viewed locally as static files, but secure GitHub publishing requires the Netlify Functions included in this repository.

## 1. Repository

Use the `Ahmed200444/CS-and-AI-Mastery` repository (or a fork/copy you control). The production build and quality gate are defined in the repository; do not manually remove the scripts or Netlify Functions that the build verifies.

## 2. GitHub App

On GitHub, create or maintain a GitHub App for the deployed site.

Recommended configuration:

- Homepage URL: the final Netlify site URL.
- Callback URL: `https://YOUR-SITE.netlify.app/api/github/callback`.
- Request user authorization during installation: enabled.
- Repository permission: **Contents — Read and write**.
- Metadata: read-only.
- Install the app only on the repository/repositories the learning platform should be able to publish to.

Keep the Client ID, Client secret, and app slug for the Netlify environment variables.

## 3. Netlify

Import the GitHub repository into Netlify. The repository's `netlify.toml` already defines the production build command, published directory, Functions directory, and `/api/github/*` redirects, so you should not replace it with a different manual build command.

Configure:

- `SITE_URL` — the final deployed site URL.
- `GITHUB_CLIENT_ID` — GitHub App Client ID.
- `GITHUB_CLIENT_SECRET` — GitHub App client secret.
- `GITHUB_APP_SLUG` — GitHub App slug.
- `SESSION_SECRET` — a long random value; use at least 32 characters.

Redeploy after changing environment variables.

## 4. Connect GitHub in the website

Open the deployed CS & AI Mastery site and use **Connect GitHub**. Approve the GitHub App for the intended repository.

The browser receives connection/status information and a CSRF value, but the access token itself remains in the encrypted HttpOnly session cookie and is not available to lesson JavaScript.

## 5. Portfolio publishing behavior

Exercises, examples, and projects publish under `student-code/`.

A single exercise can safely have both languages:

```text
student-code/practice/<course>/<exercise>/
  python/
    solution.py
    README.md
  cpp/
    solution.cpp
    README.md
```

**Publish to GitHub** writes the code once. Pressing it again for the same item/language reports that it is already published instead of overwriting it.

**Add a README** creates a README only in that exact item/language folder and only after the code exists.

## 6. Local verification

Install dependencies:

```bash
npm install
npm test
```

The GitHub Actions Quality Gate also runs the exact Netlify production build, generated Python/C++ certification, and Chromium browser certification.

## Security notes

- Never put GitHub tokens, the GitHub client secret, or `SESSION_SECRET` into HTML, JavaScript, course data, or `student-code/`.
- Publishing uses server-side session handling, CSRF/origin checks, safe-path validation, size limits, and secret-pattern detection.
- `student-code/` publishing is create-once by design.
- README creation requires its matching code path.
- Service-worker caching excludes `/api/` and `/.netlify/functions/`.
