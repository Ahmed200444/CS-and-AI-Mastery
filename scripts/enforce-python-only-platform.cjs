const fs=require('fs');
const path=require('path');
const root=process.cwd();
const coursesDir=path.join(root,'courses');
const dataDir=path.join(root,'assets','course-data');
const catalogPath=path.join(root,'assets','catalog-data.json');
const indexPath=path.join(root,'index.html');

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function cleanText(v){return String(v==null?'':v)
 .replace(/Python\s*(?:&|\+)\s*C\+\+/gi,'Python')
 .replace(/Python\s*\/\s*C\+\+/gi,'Python')
 .replace(/C\s*\/\s*C\+\+/gi,'Python')
 .replace(/C\+\+/g,'Python')
 .replace(/\.cpp\b/gi,'.py')
 .replace(/\bboth languages\b/gi,'Python')
 .replace(/\bDual\b/g,'Python');}
function looksCpp(v){return /#include\s*[<"]|\bstd::|\bcout\s*<<|\bcin\s*>>|\busing\s+namespace\s+std\b|\bvector\s*<|\bunique_ptr\s*</.test(String(v||''));}
function pyExample(lesson){
 const title=String(lesson&&lesson.title||'Lesson example'),t=title.toLowerCase(),concepts=Array.isArray(lesson&&lesson.concepts)?lesson.concepts:[];
 if(/gpio|sensor|microcontroller|embedded|adc|pwm/.test(t))return 'samples = [21.4, 22.0, 23.2, 24.1]\nlimit = 23.0\nfor tick, value in enumerate(samples):\n    state = "ALARM" if value > limit else "OK"\n    print(tick, value, state)';
 if(/timer|interrupt/.test(t))return 'import time\n\nlast = time.monotonic()\nfor _ in range(3):\n    now = time.monotonic()\n    print(f"elapsed={now-last:.6f}s")\n    last = now';
 if(/uart|i²c|i2c|spi|communication|driver/.test(t))return 'class DeviceBus:\n    def read(self, address):\n        return {"address": address, "value": 42}\n\nbus = DeviceBus()\nprint(bus.read(7))';
 if(/stack, heap|lifetime|ownership|resource/.test(t))return 'from contextlib import contextmanager\n\n@contextmanager\ndef resource(name):\n    print("open", name)\n    try:\n        yield name\n    finally:\n        print("close", name)\n\nwith resource("data") as handle:\n    print("using", handle)';
 if(/file|descriptor|system call/.test(t))return 'from pathlib import Path\npath = Path("sample.txt")\npath.write_text("alpha\\nbeta\\n")\nprint(path.read_text().strip())\npath.unlink()';
 if(/process|program execution/.test(t))return 'import subprocess\nresult = subprocess.run(["python", "-c", "print(6 * 7)"], capture_output=True, text=True)\nprint(result.stdout.strip())';
 if(/thread|race|synchron|concurrency/.test(t))return 'from concurrent.futures import ThreadPoolExecutor\n\ndef work(value):\n    return value * value\n\nwith ThreadPoolExecutor(max_workers=3) as pool:\n    print(list(pool.map(work, [2, 3, 4])))';
 if(/ipc|pipe|socket|shared memory/.test(t))return 'from multiprocessing import Pipe\nleft, right = Pipe()\nleft.send({"task": "ping"})\nprint(right.recv())';
 if(/pipeline|cpi|throughput|latency/.test(t))return 'instructions = 1200\ncycles = 1560\ncpi = cycles / instructions\nprint(f"CPI={cpi:.2f}")';
 if(/hazard|forwarding|stall/.test(t))return 'instructions = ["LOAD R1", "ADD R2,R1", "STORE R2"]\nstalls = 1\nfor cycle, instruction in enumerate(instructions, start=1):\n    print(cycle, instruction)\nprint("estimated stalls:", stalls)';
 if(/branch prediction|speculation/.test(t))return 'predictions = [True, True, False, True]\nactual =      [True, False, False, True]\ncorrect = sum(p == a for p, a in zip(predictions, actual))\nprint("accuracy:", correct / len(actual))';
 if(/cache|locality|associativity|replacement|write polic/.test(t))return 'addresses = [0, 4, 8, 0, 16, 4]\nline_size = 4\ncache_lines = 4\nfor address in addresses:\n    line = address // line_size\n    index = line % cache_lines\n    print(address, "-> cache index", index)';
 if(/virtual memory|tlb|page/.test(t))return 'address = 0x12345\npage_size = 4096\npage = address // page_size\noffset = address % page_size\nprint("page", page, "offset", offset)';
 if(/multicore|coherence|false sharing/.test(t))return 'from threading import Lock\nlock = Lock()\ncounters = [0, 0]\nwith lock:\n    counters[0] += 1\nprint(counters)';
 const concept=concepts[0]||'lesson concept';
 return '# '+cleanText(title)+'\nvalues = [1, 2, 3, 4]\nresult = [value * 2 for value in values]\nprint("'+String(concept).replace(/["\\]/g,'')+'", result)';
}
function convertValue(value,ctx){
 if(Array.isArray(value))return value.map(v=>convertValue(v,ctx));
 if(!value||typeof value!=='object')return typeof value==='string'?cleanText(value):value;
 const out={};
 for(const [k,v] of Object.entries(value)){
  if((k==='language'||k==='defaultLanguage')&&/^(cpp|c\+\+|dual)$/i.test(String(v||''))){out[k]='python';continue;}
  if(k==='starter'&&typeof v==='string'&&looksCpp(v)){out[k]='# '+cleanText(value.title||ctx&&ctx.title||'Project')+'\n# Build your Python solution here.\n\nprint("Project workspace ready")\n';continue;}
  out[k]=convertValue(v,value);
 }
 if(Array.isArray(out.examples)&&out.examples.length){out.examples=out.examples.map(ex=>looksCpp(ex)?pyExample(out):cleanText(ex));}
 if(Array.isArray(out.lessons))out.lessons=out.lessons.map(l=>{const x=convertValue(l,l);if(Array.isArray(l.examples))x.examples=l.examples.map(ex=>looksCpp(ex)?pyExample(l):cleanText(ex));return x;});
 return out;
}
function replaceJsonScript(html,id,fn){const re=new RegExp(`(<script\\b[^>]*\\bid=["']${id}["'][^>]*>)([\\s\\S]*?)(<\\/script>)`,'i');return html.replace(re,(all,a,b,c)=>{try{return a+JSON.stringify(fn(JSON.parse(b))).replace(/<\//g,'<\\/')+c}catch(e){return all}});}
function stripOldLanguageAssets(html){return html.replace(/\s*<script\b[^>]*src=["'][^"']*(?:cpp-runner-ui-worker|primary-language-mode|dual-single-editor-publish|course-language-mode-controller|lesson-language-variants)[^"']*["'][^>]*><\/script>/gi,'');}
function stripOldLanguageControls(html){
 html=html.replace(/<button\b[^>]*(?:data-lang-mode|data-adaptive-mode)=["'](?:cpp|dual)["'][^>]*>[\s\S]*?<\/button>/gi,'');
 html=html.replace(/<option\b[^>]*value=["'](?:cpp|c\+\+|dual)["'][^>]*>[\s\S]*?<\/option>/gi,'');
 html=html.replace(/<textarea\b[^>]*data-dual-cpp-editor[^>]*>[\s\S]*?<\/textarea>/gi,'');
 html=html.replace(/data-csai-active-language=["'](?:cpp|dual)["']/gi,'data-csai-active-language="python"');
 html=html.replace(/data-csai-oa-cpp-run/gi,'data-csai-oa-python-run').replace(/data-csai-oa-cpp-editor/gi,'data-csai-oa-python-editor');
 return html;
}
function replaceCodeBlocks(html){return html.replace(/<(pre|code)(\b[^>]*)>([\s\S]*?)<\/\1>/gi,(all,tag,attrs,body)=>{const decoded=body.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'");if(!looksCpp(decoded))return all;return `<${tag}${attrs}>${esc('# Python-focused example\nvalues = [1, 2, 3, 4]\nprint(sum(values))')}</${tag}>`;});}
function replaceEditors(html){return html.replace(/<textarea(\b[^>]*)>([\s\S]*?)<\/textarea>/gi,(all,attrs,body)=>{const decoded=body.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'");if(!looksCpp(decoded))return all;return `<textarea${attrs}>${esc('# Write your Python solution here.\n\nprint("Start your solution")\n')}</textarea>`;});}
function injectRuntime(html){if(html.includes('python-only-ui.js'))return html;const tag='<script src="/assets/python-only-ui.js?v=20260811-2" defer></script>';return html.replace(/\s*<\/body>/i,'\n'+tag+'\n</body>');}
function cleanHtml(html){
 html=stripOldLanguageAssets(html);
 html=stripOldLanguageControls(html);
 html=replaceJsonScript(html,'csai-project-data',convertValue);
 html=replaceJsonScript(html,'csai-assessment-data',convertValue);
 html=replaceJsonScript(html,'course-page-meta',convertValue);
 html=replaceCodeBlocks(html);
 html=replaceEditors(html);
 html=cleanText(html);
 html=html.replace(/Practice Python languages/gi,'Practice Python').replace(/real Python\s*\/\s*Python runners?/gi,'real Python runner').replace(/Python\s*&\s*Python/gi,'Python').replace(/Python\s*\+\s*Python/gi,'Python');
 return injectRuntime(html);
}

let dataFiles=0,pageFiles=0;
if(fs.existsSync(dataDir))for(const name of fs.readdirSync(dataDir).filter(x=>x.endsWith('.json'))){const p=path.join(dataDir,name);const data=JSON.parse(fs.readFileSync(p,'utf8'));fs.writeFileSync(p,JSON.stringify(convertValue(data),null,2)+'\n');dataFiles++;}
if(fs.existsSync(catalogPath)){const data=JSON.parse(fs.readFileSync(catalogPath,'utf8'));fs.writeFileSync(catalogPath,JSON.stringify(convertValue(data),null,2)+'\n');}
if(fs.existsSync(coursesDir))for(const name of fs.readdirSync(coursesDir).filter(x=>x.endsWith('.html'))){const p=path.join(coursesDir,name);fs.writeFileSync(p,cleanHtml(fs.readFileSync(p,'utf8')),'utf8');pageFiles++;}
if(fs.existsSync(indexPath)){
 let html=fs.readFileSync(indexPath,'utf8');
 html=replaceJsonScript(html,'coursedata',convertValue);
 html=replaceJsonScript(html,'csai-inline-catalog-data',convertValue);
 html=cleanHtml(html);
 fs.writeFileSync(indexPath,html,'utf8');
}
if(pageFiles!==57)throw new Error(`Python-only cleanup expected 57 course pages, found ${pageFiles}`);
console.log(`Python-only platform cleanup complete: ${pageFiles} course pages and ${dataFiles} course-data files normalized.`);
