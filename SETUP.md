# CS & AI Mastery v5.18.2 — GitHub connection setup (browser-only workflow)

You do not need VS Code. The platform works locally immediately; secure GitHub sync needs hosting.

## 1. Put this folder in a GitHub repository
Use GitHub.com in your browser: create a repository, choose **Add file → Upload files**, and upload everything in this bundle.

## 2. Create a GitHub App
On GitHub.com, open **Settings → Developer settings → GitHub Apps → New GitHub App**.

Use:
- Homepage URL: your Netlify site URL
- Callback URL: `https://YOUR-SITE.netlify.app/api/github/callback`
- Request user authorization during installation: enabled
- Repository permissions: **Contents: Read and write**
- Metadata: Read-only (automatic)
- Installation: Only on this account

After creating it, copy the **Client ID**, generate a **Client secret**, and note the app slug from its URL. Install the app on only the repository you want the platform to use.

## 3. Deploy on Netlify
In Netlify's browser dashboard choose **Add new site → Import an existing project → GitHub**, select the repository, and deploy. No build command is required.

Add these environment variables in Netlify:
- `SITE_URL` = your final Netlify site URL
- `GITHUB_CLIENT_ID` = GitHub App Client ID
- `GITHUB_CLIENT_SECRET` = GitHub App Client secret
- `GITHUB_APP_SLUG` = the app slug
- `SESSION_SECRET` = a long random value (at least 32 characters)

Redeploy after adding them.

## 4. Connect
Open the hosted platform, choose **Code Vault & GitHub Sync**, paste the repository link, and press **Connect GitHub**. Approve access once on GitHub. After that, the platform uses the default `main` branch and `cs-ai-mastery` folder unless you open Advanced settings and change them.

## Security design
- No GitHub password, token, client secret, or private key is stored in the HTML or localStorage.
- The user token is encrypted into an HttpOnly, Secure cookie and is unavailable to page JavaScript.
- The GitHub App can be installed on one selected repository with only Contents read/write.
- Strong secret patterns are blocked before upload.
