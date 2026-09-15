const fs=require('fs');
const path=require('path');

const file=path.join(process.cwd(),'assets','evergreen-learning-engine.js');
if(!fs.existsSync(file))throw new Error('evergreen-learning-engine.js is missing');
let src=fs.readFileSync(file,'utf8');
const before=src;

src=src.replace(/<input class="evergreen-predict" data-evergreen-predict placeholder="Predict the output before you run">/g,'');
src=src.replace(/var pred=card\.querySelector\('\[data-evergreen-predict\]'\);if\(pred&&pred\.value\.trim\(\)\)out\.innerHTML\+='\\n\\nPrediction: '\+esc\(pred\.value\.trim\(\)\)/g,'');
src=src.replace(/\.evergreen-predict\{[^}]*\}/g,'');
src=src.replace(/\.evergreen-predict\{width:100%;flex-basis:100%\}/g,'');

if(src===before)throw new Error('Evergreen predict-output patch made no changes');
if(src.includes('data-evergreen-predict')||src.includes('Predict the output before you run'))throw new Error('Predict-output UI is still present after patch');
fs.writeFileSync(file,src,'utf8');
console.log('Removed Evergreen predict-output field and prediction echo logic.');
