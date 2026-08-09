# CS & AI Mastery — GitHub connection setup

The learning platform works as a static site. Secure GitHub publishing uses the included Netlify functions, so GitHub credentials never need to be placed in browser code.

## 1. Host the repository on GitHub

Push or upload this repository to GitHub. Keep the included `netlify.toml`, `netlify/functions/`, `assets/`, and `scripts/` directories intact because the production build and GitHub integration depend on them.

## 2. Create a GitHub App

On GitHub, open **Settings → Developer settings → GitHub Apps → New GitHub App**.

Use:

- Homepage URL: your Netlify site URL
- Callback URL: `https://YOUR-SITE.netlify.app/api/github/callback`
- Request user authorization during installation: enabled
- Repository permissions: **Contents: Read and write**
- Metadata: Read-only
- Installation: only the account/repositories you intend to use

After creating the app, copy the **Client ID**, create a **Client secret**, and note the app slug. Install the app only on repositories that should be available to the platform.

## 3. Deploy with Netlify

In Netlify choose **Add new site → Import an existing project → GitHub** and select this repository. The production build command and function directory are already defined in `netlify.toml`; do not replace them with a blank custom build.

Add these environment variables:

- `SITE_URL` = the final HTTPS site origin, with no trailing slash
- `GITHUB_CLIENT_ID` = GitHub App Client ID
- `GITHUB_CLIENT_SECRET` = GitHub App client secret
- `GITHUB_APP_SLUG` = GitHub App slug
- `SESSION_SECRET` = a long random value of at least 32 characters

Redeploy after setting or changing environment variables.

## 4. Connect GitHub from the platform

Open the deployed platform and use **Code Vault & GitHub Sync → Connect GitHub**. Complete the GitHub authorization flow once, then select the repository you want to use.

### Learner portfolio publishing

Exercises, lesson examples, and course projects use separate controls:

- **Publish to GitHub** creates the code file.
- **Add a README** creates the README only after the matching code exists.

Files under `student-code/` are **create-once**. If the target code or README already exists, the platform reports that it is already published and does not overwrite it or create another commit. This is intentional so revisiting a lesson cannot silently replace earlier work.

The broader Code Vault sync flow remains separate from these create-once learner portfolio items.

## Security design

- GitHub access tokens and client secrets are never stored in the HTML or localStorage.
- The user session is encrypted and stored in an HttpOnly, Secure cookie unavailable to page JavaScript.
- Write requests require the session CSRF token and the expected site origin.
- Repository file paths are validated server-side.
- Common high-risk secret patterns are blocked before browser publishing.
- The service worker does not cache `/api/` or Netlify function responses.
- System-level lesson commands are simulated/validated in the browser rather than executed against a real machine or cloud account.

## Local checks

With Node.js 20 or newer installed:

```bash
npm install
npm test
```

The production build and GitHub Actions quality gate run additional course-generation and platform verification checks.
