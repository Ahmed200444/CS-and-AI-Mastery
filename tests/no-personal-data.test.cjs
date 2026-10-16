// Guards the sellable package: no owner name, location, e-mail, GitHub handle or
// institution-specific references may appear in any tracked text file.
const assert=require('assert');const fs=require('fs');const path=require('path');const {execSync}=require('child_process');
const root=path.join(__dirname,'..');
const ALLOWED_DETECTORS=new Set(['scripts/sanitize-commercial-course-content.cjs','tests/commercial-content-quality.test.cjs','tests/platform-professional-audit.test.cjs','tests/no-personal-data.test.cjs']);
const TEXT=/\.(js|cjs|mjs|json|html|md|txt|css|py|bat|toml|webmanifest|svg)$/i;
const PATTERNS=[['owner first name',/ahmed/i],['owner surname',/alkadi/i],['owner location',/dubai/i],['regulator name',/\bkhda\b/i],['university course code',/\bEECE\s*3\d\d\b/i],['personal e-mail address',/[\w.+-]+@(?:gmail|hotmail|outlook|yahoo|icloud)\.com/i],['personal GitHub handle',/ahmed\d{3,}/i],['personal job-prep page',/bytedance-2027/i]];
let files;
try{files=execSync('git ls-files',{cwd:root,maxBuffer:1<<26}).toString().split('\n').filter(Boolean);}
catch(e){files=[];(function walk(d){for(const n of fs.readdirSync(d,{withFileTypes:true})){if(n.name==='node_modules'||n.name==='.git')continue;const p=path.join(d,n.name);n.isDirectory()?walk(p):files.push(path.relative(root,p));}})(root);}
let scanned=0;
for(const f of files){
  if(!TEXT.test(f)||ALLOWED_DETECTORS.has(f.replace(/\\/g,'/')))continue;
  const p=path.join(root,f);if(!fs.existsSync(p))continue;
  const s=fs.readFileSync(p,'utf8');scanned++;
  for(const [label,re] of PATTERNS)assert.ok(!re.test(s),`${f}: contains ${label}`);
}
console.log(`No-personal-data contract: PASS across ${scanned} tracked text files.`);
