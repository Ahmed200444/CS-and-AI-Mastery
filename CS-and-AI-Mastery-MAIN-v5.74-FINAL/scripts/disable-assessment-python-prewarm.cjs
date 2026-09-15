const fs=require('fs');
const path=require('path');

const file=path.join(process.cwd(),'assets','assessment-practice.js');
if(!fs.existsSync(file))throw new Error('assessment-practice.js is missing');
let src=fs.readFileSync(file,'utf8');

const pattern=/;if\(defaultLanguage==='python'&&host\.querySelector\('\[data-editor\]'\)\)setTimeout\(function\(\)\{var state=host\.querySelector\('\[data-runner-state\]'\);if\(state\)state\.textContent='Python runner warming up…';getPy\(\)\.then\(function\(\)\{if\(state\)state\.textContent='✓ Python ready'\}\)\.catch\(function\(\)\{if\(state\)state\.textContent='Python loads when Run is pressed'\}\)\},600\)/;

if(pattern.test(src)){
  src=src.replace(pattern,";var state=host.querySelector('[data-runner-state]');if(state)state.textContent='Runner loads when Run / Check is pressed'");
  fs.writeFileSync(file,src,'utf8');
  console.log('Disabled automatic Python runtime preloading; runner now loads only on Run / Check.');
}else if(src.includes("Runner loads when Run / Check is pressed")){
  console.log('Assessment Python runtime is already configured for on-demand loading.');
}else{
  throw new Error('Could not find the assessment Python prewarm block; refusing to patch an unexpected file.');
}
