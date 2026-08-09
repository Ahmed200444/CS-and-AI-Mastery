const fs=require('fs');
const path=require('path');
const root=process.cwd();
const assetPath=path.join(root,'assets','course-project-workspace.js');
const injectPath=path.join(root,'scripts','inject-course-project-workspace.cjs');
let s=fs.readFileSync(assetPath,'utf8');
let inject=fs.readFileSync(injectPath,'utf8');

function replaceOnce(source,from,to,label){
  if(source.includes(to))return source;
  if(!source.includes(from))throw new Error('Could not patch '+label);
  return source.replace(from,to);
}

s=replaceOnce(s,
"function ext(lang){return{python:'py',javascript:'js',sql:'sql',html:'html',json:'json',shell:'sh',text:'txt'}[lang]||'txt'}",
"function ext(lang){return{cpp:'cpp',python:'py',javascript:'js',sql:'sql',html:'html',json:'json',shell:'sh',text:'txt'}[lang]||'txt'}",
'C++ project extension');

s=replaceOnce(s,
"function label(lang){return{python:'Python',javascript:'JavaScript',sql:'SQL',html:'HTML',json:'JSON',shell:'Shell / config',text:'Project notes'}[lang]||lang}",
"function label(lang){return{cpp:'C++',python:'Python',javascript:'JavaScript',sql:'SQL',html:'HTML',json:'JSON',shell:'Shell / config',text:'Project notes'}[lang]||lang}",
'C++ project label');

s=replaceOnce(s,
"function starter(lang,title){\n if(lang==='python')return '# '+title+'\\n\\n# Build your project here.\\n\\nprint(\"Project workspace ready\")\\n';",
"function starter(lang,title){\n if(lang==='cpp')return '#include <iostream>\\nusing namespace std;\\n\\nint main() {\\n    cout << \"Project workspace ready\" << endl;\\n    return 0;\\n}\\n';\n if(lang==='python')return '# '+title+'\\n\\n# Build your project here.\\n\\nprint(\"Project workspace ready\")\\n';",
'C++ project starter');

s=replaceOnce(s,
"function languageOptions(current){return['python','javascript','sql','html','json','shell','text'].map(function(x){return'<option value=\"'+x+'\" '+(x===current?'selected':'')+'>'+esc(label(x))+'</option>'}).join('')}",
"function languageOptions(current){return['cpp','python','javascript','sql','html','json','shell','text'].map(function(x){return'<option value=\"'+x+'\" '+(x===current?'selected':'')+'>'+esc(label(x))+'</option>'}).join('')}",
'C++ project language option');

const executeNeedle="async function execute(lang,code,out,p){\n if(lang==='python')";
const cppHelper=`function runCppProject(code,out){\n return new Promise(function(resolve){\n  var host=document.createElement('div');host.setAttribute('data-lang-variant','cpp');host.setAttribute('data-project-cpp-proxy','');host.style.display='none';\n  var pre=document.createElement('pre');pre.className='csai-language-code';pre.setAttribute('data-csai-language-generated','');pre.textContent=code;\n  var proxyOut=document.createElement('pre');proxyOut.setAttribute('data-csai-example-output','');proxyOut.textContent='Ready.';\n  var button=document.createElement('button');button.type='button';button.setAttribute('data-run-language-example','');button.textContent='Run';\n  host.append(pre,button,proxyOut);document.body.appendChild(host);\n  var done=false;function finish(error){if(done)return;done=true;observer.disconnect();clearTimeout(timer);out.innerHTML=proxyOut.innerHTML;host.remove();resolve({error:!!error});}\n  var observer=new MutationObserver(function(){var text=String(proxyOut.textContent||'');if(/Output|Run error/.test(text))finish(/Run error/.test(text));else if(text&&text!=='Ready.')out.textContent=text;});\n  observer.observe(proxyOut,{childList:true,subtree:true,characterData:true});\n  var timer=setTimeout(function(){if(done)return;proxyOut.innerHTML='<span class=\"bad\">Run error</span>\\nC++ project run took too long. Press Run / Check to retry.';finish(true);},125000);\n  button.click();\n });\n}\nasync function execute(lang,code,out,p){\n if(lang==='cpp'){out.textContent='Preparing your C++ project…';await runCppProject(code,out);return}\n if(lang==='python')`;
if(!s.includes("function runCppProject(code,out)")){
  if(!s.includes(executeNeedle))throw new Error('Could not patch shared C++ project runner');
  s=s.replace(executeNeedle,cppHelper);
}

const publishRe=/async function publish\(card,p,button\)\{[\s\S]*?\n\nfunction bind\(section\)/;
const publishReplacement=`function readmeForProject(p,lang,fileName){\n var title=String(p.title||'Project'),description=String(p.description||'Build this project using the concepts from the course.'),tick=String.fromCharCode(96);\n var requirements=arr(p.requirements);\n var run='Open '+fileName+' in the appropriate development environment.';\n if(lang==='cpp')run='Compile with '+tick+'g++ -std=c++17 '+fileName+' -o app'+tick+', then run '+tick+'./app'+tick+' (Windows: '+tick+'app.exe'+tick+').';\n else if(lang==='python')run='Run '+tick+'python '+fileName+tick+'.';\n else if(lang==='javascript')run='Run '+tick+'node '+fileName+tick+'.';\n else if(lang==='html')run='Open '+tick+fileName+tick+' in a web browser.';\n else if(lang==='sql')run='Open '+tick+fileName+tick+' in your SQL environment and execute the statements.';\n var lines=['# '+title,'',description,'','## Course','',String(DATA.courseTitle||courseId),'','## What this project practices',''];\n if(requirements.length)requirements.forEach(function(r){lines.push('- '+String(r));});else lines.push('- Apply the concepts from this course in a complete project.');\n lines.push('','## Files','','- '+tick+fileName+tick+' — main project work','- '+tick+'README.md'+tick+' — project overview and run instructions','','## How to run','',run,'','---','','Created from the CS & AI Mastery project workspace.');\n return lines.join('\\n')+'\\n';\n}\nasync function publish(card,p,button){\n var editor=card.querySelector('[data-project-editor]'),lang=card.querySelector('[data-project-lang]').value,content=String(editor.value||'').trimEnd(),status=card.querySelector('[data-project-status]');\n if(!content){status.textContent='Add your project work before publishing.';return}\n var projectSlug=slug(p.title||'project'),base='student-code/projects/'+slug(courseId)+'/'+projectSlug,fileName=projectSlug+'.'+ext(lang),path=base+'/'+fileName,readmePath=base+'/README.md',old=button.textContent;\n button.disabled=true;button.textContent='Publishing…';status.textContent='Publishing project files and README…';\n try{\n  var d=await githubStatus(),repo=chooseRepo(d);if(!repo)throw new Error('No GitHub repository is available');\n  async function send(target,body,message){var r=await fetch(FILE_URL,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSAI-CSRF':d.csrf},body:JSON.stringify({repository:repo,path:target,content:body,message:message})}),result=await r.json().catch(function(){return{}});if(!r.ok)throw new Error(result.error||'GitHub publish failed for '+target);return result}\n  await send(path,content+'\\n','Update '+fileName+' project from CS & AI Mastery');\n  await send(readmePath,readmeForProject(p,lang,fileName),'Update '+projectSlug+' README from CS & AI Mastery');\n  button.textContent='Published ✓';status.textContent='Published ✓  '+path+' + README.md';setTimeout(function(){button.textContent=old;button.disabled=false},1800);\n }catch(error){button.textContent=old;button.disabled=false;status.textContent=error.message||String(error)}\n}\n\nfunction bind(section)`;
if(!s.includes('function readmeForProject(p,lang,fileName)')){
  if(!publishRe.test(s))throw new Error('Could not patch project README publisher');
  s=s.replace(publishRe,publishReplacement);
}

inject=replaceOnce(inject,
"const SQL=new Set(['sql','databases']);\nconst SHELL=",
"const SQL=new Set(['sql','databases']);\nconst CPP=new Set(['cpp']);\nconst SHELL=",
'C++ project language set');
inject=replaceOnce(inject,
"function lang(id){if(PY.has(id))return'python';if(JS.has(id))return'javascript';if(SQL.has(id))return'sql';if(SHELL.has(id))return'shell';return'text'}",
"function lang(id){if(CPP.has(id))return'cpp';if(PY.has(id))return'python';if(JS.has(id))return'javascript';if(SQL.has(id))return'sql';if(SHELL.has(id))return'shell';return'text'}",
'C++ project default language');
inject=inject.replace('/assets/course-project-workspace.js?v=20260808-1','/assets/course-project-workspace.js?v=20260809-2');

if(!/README\.md/.test(s)||!/readmeForProject/.test(s))throw new Error('README publishing patch did not install');
if(!/lang==='cpp'/.test(s)||!/cpp:'cpp'/.test(s))throw new Error('C++ project support did not install');
if(!/CPP=new Set\(\['cpp'\]\)/.test(inject))throw new Error('C++ project language injection did not install');
fs.writeFileSync(assetPath,s,'utf8');
fs.writeFileSync(injectPath,inject,'utf8');
console.log('Project workspace patched: C++ run support, project-folder publishing, and automatic README.md publishing enabled.');
