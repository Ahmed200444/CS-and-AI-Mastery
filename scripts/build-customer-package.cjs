#!/usr/bin/env node
'use strict';
/* Builds a clean customer package: only what the site needs to run, with no tests, build scripts,
   QA reports, launchers or developer notes.
   Run it AFTER the normal build (the Netlify build command) has produced the final site in --from.
   usage: node scripts/build-customer-package.cjs [--from <builtDir>] [--out <dir>] */
const fs=require('fs');
const path=require('path');
const args=process.argv.slice(2);
const opt=(n,d)=>{const i=args.indexOf('--'+n);return i>=0&&args[i+1]?args[i+1]:d;};
const from=path.resolve(opt('from',process.cwd()));
const out=path.resolve(opt('out',path.join(from,'dist-customer')));
if(out===from||from.startsWith(out+path.sep))throw new Error('--out must be a separate folder');
if(!fs.existsSync(path.join(from,'index.html'))||!fs.existsSync(path.join(from,'courses')))throw new Error('--from must be a built site (index.html and courses/ expected)');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
function copy(rel){const s=path.join(from,rel),d=path.join(out,rel);if(!fs.existsSync(s))return false;fs.mkdirSync(path.dirname(d),{recursive:true});fs.cpSync(s,d,{recursive:true});return true;}
for(const rel of ['index.html','courses','assets','github-setup.html','manifest.webmanifest','icon.svg','sw.js','_headers','netlify/functions']){
  if(!copy(rel)&&['index.html','courses','assets'].includes(rel))throw new Error('missing required '+rel);
}
// Hosting config without the developer build pipeline: the site is already built.
let toml=fs.readFileSync(path.join(from,'netlify.toml'),'utf8');
toml=toml.replace(/^\s*command\s*=.*$/m,'').replace(/^\s*ignore\s*=.*$/m,'');
fs.writeFileSync(path.join(out,'netlify.toml'),toml.replace(/\n{3,}/g,'\n\n'),'utf8');
fs.writeFileSync(path.join(out,'README-FIRST.md'),`# CS & AI Mastery — setup guide

This folder is the finished website. Nothing needs to be built.

## 1. Put your details in
Open \`assets/product-config.js\` and fill in your name or business, support email and website. They appear in the footer, About, Terms and Privacy. Leave a value empty to hide it.

## 2. Host it
Any static host works. On Netlify, drag this whole folder onto the Netlify dashboard (or connect it to a Git repository). \`netlify.toml\` already contains the redirects and headers the site needs, including the proxies that supply the Python, SQL and C++ code engines.

Opening \`index.html\` straight from disk shows the lessons, but the code engines and the optional services below need a web server.

## 3. Optional: connect GitHub publishing
Lets each learner save their own work to their own GitHub repository.
1. In GitHub, create a GitHub App for your site's address (Settings → Developer settings → GitHub Apps). Ask for read/write access to repository contents.
2. In Netlify → Site settings → Environment variables, add: \`GITHUB_CLIENT_ID\`, \`GITHUB_CLIENT_SECRET\`, \`GITHUB_APP_SLUG\`, \`SESSION_SECRET\` (a long random string) and \`SITE_URL\` (your site's address).
3. Redeploy. Learners sign in with their own GitHub account; nothing of yours is shared.

If these are not set, the GitHub bar and Publish buttons stay hidden.

## 4. Optional: AI tutor
Without any key the tutor gives built-in guided hints. For open-ended answers add one key in Netlify environment variables: \`GROQ_API_KEY\`, \`GOOGLE_GENERATIVE_AI_API_KEY\` or \`OPENROUTER_API_KEY\`. Usage is billed to your provider account.

## 5. Before you sell
- Terms and Privacy are generic template wording. Have them reviewed for your country and your licence model.
- Confirm you have the rights to everything you distribute, including third-party engines (Pyodide, sql.js, JSCPP) under their own licences.
- Test a deployed copy end to end: open a few courses, run a Python and a SQL example, and (if enabled) the GitHub and tutor features.
`,'utf8');
let files=0,bytes=0;(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else{files++;bytes+=fs.statSync(p).size;}}})(out);
console.log(`Customer package: ${files} files, ${(bytes/1048576).toFixed(1)} MB -> ${out}`);
