(function(){
'use strict';

var applyTimer=0;
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function norm(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function uniq(xs){var seen={};return xs.filter(function(x){x=String(x||'').trim();var k=x.toLowerCase();if(!x||seen[k])return false;seen[k]=1;return true;});}
function lessonTitle(lesson){var n=lesson.querySelector('summary .title,summary');return String(n&&n.textContent||'Lesson').replace(/\s+Complete\s*$/i,'').trim();}
function body(lesson){return lesson.querySelector('.body');}
function headingList(b,label){var hs=Array.from(b.querySelectorAll('h3'));var h=hs.find(function(x){return norm(x.textContent)===norm(label);});if(!h)return[];var n=h.nextElementSibling;if(!n||!/^UL|OL$/.test(n.tagName))return[];return Array.from(n.querySelectorAll('li')).map(function(x){return x.textContent.trim();}).filter(Boolean);}
function concepts(b){var h=Array.from(b.querySelectorAll('h3')).find(function(x){return /key concepts/i.test(x.textContent||'');});var n=h&&h.nextElementSibling;var xs=n?Array.from(n.querySelectorAll('.pill')).map(function(x){return x.textContent.trim();}):[];if(!xs.length)xs=Array.from(b.querySelectorAll('.meta .pill')).map(function(x){return x.textContent.trim();});return uniq(xs).slice(0,8);}
function objectives(b){return uniq(headingList(b,'What you will learn')).slice(0,8);}
function countFor(b){return clamp(Math.max(concepts(b).length,objectives(b).length)+2,5,8);}
function conceptAt(b,i){var cs=concepts(b);return cs.length?cs[i%cs.length]:lessonTitle(b.closest('.lesson'));}
function objectiveAt(b,i){var os=objectives(b);return os.length?os[i%os.length]:'Apply the lesson concept correctly';}
function kindFor(i,total){if(i===0)return'Guided example';if(i===1)return'Different input';if(i===2)return'Step-by-step variation';if(i===total-2)return'Integrated example';if(i===total-1)return'Edge case / debug';return'Practice variation';}
function taskFor(b,i,total){var c=conceptAt(b,i),o=objectiveAt(b,i);if(i===0)return'Follow the code in execution order and connect each line to '+c+'.';if(i===1)return'Change the input and predict the new output before you run it.';if(i===2)return'Compare this version with the earlier example and explain what changed.';if(i===total-2)return'Combine '+c+' with another lesson idea and explain the trade-off.';if(i===total-1)return'Look for the edge case, run the code, and explain why the check prevents a failure.';return'Use this variation to practice '+c+' and connect it to: '+o+'.';}
function pythonLike(code){code=String(code||'');if(/#include\s*[<"]|\bstd::|\bcout\s*<<|\bcin\s*>>/.test(code))return false;return /(^|\n)\s*(def\s+|class\s+|from\s+|import\s+|for\s+\w+\s+in\s+|while\s+.+:|if\s+.+:|print\s*\()/.test(code)||/\b(len|range|enumerate)\s*\(/.test(code)||/^[\s\w]+\s*=\s*[^;]+$/m.test(code);}
function sourceExample(b){
 var h=Array.from(b.querySelectorAll('h3')).find(function(x){return /^examples?$/i.test(String(x.textContent||'').trim());});
 if(!h)return'';
 var host=h.nextElementSibling,code='';
 if(host){var src=host.matches&&host.matches('pre,code,textarea')?host:host.querySelector&&host.querySelector('textarea,pre code,pre');code=String(src&&(src.value||src.textContent)||'');}
 if(pythonLike(code))return code.trim();
 return'';
}
function hideOriginalExample(b){
 var h=Array.from(b.querySelectorAll('h3')).find(function(x){return /^examples?$/i.test(String(x.textContent||'').trim());});
 if(!h)return null;
 var host=h.nextElementSibling;h.hidden=true;h.setAttribute('data-study-source-hidden','1');
 if(host&&(host.matches('pre,code,textarea,.lesson-run-card,.csai-example,.csai-example-card')||host.querySelector&&host.querySelector('pre,textarea'))){host.hidden=true;host.setAttribute('data-study-source-hidden','1');}
 return h;
}
function seedNums(seed){return{a:seed+2,b:seed+5,c:(seed+2)*3};}
function program(topic,seed){var t=norm(topic),n=seedNums(seed),mode=seed%4;
 if(/variable|type|assignment|dynamic typing|boolean|bool/.test(t)){
  if(mode===0)return 'age = '+(18+n.a)+'\nname = "Ahmed"\nis_student = True\nprint(name, age, is_student)\nprint(type(age).__name__)';
  if(mode===1)return 'value = 12\nprint(value, type(value).__name__)\nvalue = "twelve"\nprint(value, type(value).__name__)';
  if(mode===2)return 'profile = {"name": "Ahmed", "level": '+n.a+', "active": True}\nfor key, value in profile.items():\n    print(key, value, type(value).__name__)';
  return 'score = '+(70+n.a)+'\npassed = score >= 60\nmessage = f"score={score}, passed={passed}"\nprint(message)';
 }
 if(/string|slice|format|f string/.test(t)){
  if(mode===0)return 'text = "computer engineering"\nprint(text.upper())\nprint(text[:8])\nprint(len(text))';
  if(mode===1)return 'first = "CS"\nsecond = "AI"\nlabel = f"{first} + {second} Mastery"\nprint(label)';
  if(mode===2)return 'email = "  student@example.com  "\nclean = email.strip().lower()\nprint(clean)\nprint(clean.endswith(".com"))';
  return 'word = "algorithm"\nprint(word[::-1])\nprint(word.count("a"))\nprint(word.replace("a", "A"))';
 }
 if(/loop|iteration|enumerate|travers/.test(t)){
  if(mode===0)return 'nums = [2, 4, 6, 8]\nfor index, value in enumerate(nums):\n    print(index, value * 2)';
  if(mode===1)return 'total = 0\nfor value in [3, 5, 7, '+n.a+']:\n    total += value\nprint("total:", total)';
  if(mode===2)return 'for row in range(1, 4):\n    for col in range(1, 4):\n        print(row, col)';
  return 'values = [4, -2, 7, 0, '+n.a+']\npositives = []\nfor value in values:\n    if value > 0:\n        positives.append(value)\nprint(positives)';
 }
 if(/function|parameter|argument|lambda|return/.test(t)){
  if(mode===0)return 'def transform(value, factor=2):\n    return value * factor\n\nprint(transform('+n.a+'))\nprint(transform('+n.b+', 3))';
  if(mode===1)return 'def describe(name, score):\n    status = "pass" if score >= 60 else "retry"\n    return f"{name}: {status}"\n\nprint(describe("Ahmed", '+(55+n.a)+'))';
  if(mode===2)return 'def average(values):\n    if not values:\n        return 0\n    return sum(values) / len(values)\n\nprint(average([10, 20, '+(20+n.a)+']))\nprint(average([]))';
  return 'square = lambda value: value * value\nvalues = [1, 2, 3, '+n.a+']\nprint([square(v) for v in values])';
 }
 if(/list|array|vector|comprehension|collection/.test(t)){
  if(mode===0)return 'nums = [1, 2, 3, 4, 5]\nsquares = [value * value for value in nums]\nprint(squares)';
  if(mode===1)return 'values = [8, 3, 8, 1, '+n.a+']\nunique = sorted(set(values))\nprint(unique)';
  if(mode===2)return 'names = ["Ali", "Ahmed", "Maya", "Omar"]\nlong_names = [name for name in names if len(name) >= 5]\nprint(long_names)';
  return 'matrix = [[1, 2], [3, 4], ['+n.a+', '+n.b+']]\nflat = [value for row in matrix for value in row]\nprint(flat)';
 }
 if(/dictionary|hash|map|key value/.test(t)){
  if(mode===0)return 'scores = {"Ali": 90, "Maya": 84}\nscores["Omar"] = '+(90+n.a)+'\nfor name, score in scores.items():\n    print(name, score)';
  if(mode===1)return 'inventory = {"cpu": 4, "ram": 12, "ssd": 7}\nitem = "ram"\nprint(inventory.get(item, 0))\nprint(sum(inventory.values()))';
  if(mode===2)return 'words = ["ai", "data", "ai", "python", "data", "ai"]\ncounts = {}\nfor word in words:\n    counts[word] = counts.get(word, 0) + 1\nprint(counts)';
  return 'users = [{"name":"A","active":True},{"name":"B","active":False}]\nactive = [u["name"] for u in users if u["active"]]\nprint(active)';
 }
 if(/class|object|inherit|encaps|polymorph|oop/.test(t)){
  if(mode===0)return 'class Account:\n    def __init__(self, balance):\n        self.balance = balance\n    def deposit(self, amount):\n        self.balance += amount\n\naccount = Account(100)\naccount.deposit('+n.b+')\nprint(account.balance)';
  if(mode===1)return 'class Student:\n    def __init__(self, name):\n        self.name = name\n        self.scores = []\n    def add_score(self, score):\n        self.scores.append(score)\n    def average(self):\n        return sum(self.scores) / len(self.scores)\n\ns = Student("Ahmed")\ns.add_score(80)\ns.add_score('+(80+n.a)+')\nprint(s.average())';
  if(mode===2)return 'class Shape:\n    def area(self):\n        raise NotImplementedError\n\nclass Square(Shape):\n    def __init__(self, side):\n        self.side = side\n    def area(self):\n        return self.side ** 2\n\nprint(Square('+n.a+').area())';
  return 'class Counter:\n    def __init__(self):\n        self._value = 0\n    def increment(self):\n        self._value += 1\n    @property\n    def value(self):\n        return self._value\n\nc = Counter()\nfor _ in range('+n.a+'):\n    c.increment()\nprint(c.value)';
 }
 if(/stack/.test(t))return 'stack = []\nfor value in [10, 20, '+(20+n.a)+']:\n    stack.append(value)\nprint("top:", stack[-1])\nprint("pop:", stack.pop())\nprint(stack)';
 if(/queue/.test(t))return 'from collections import deque\nqueue = deque([10, 20, '+(20+n.a)+'])\nprint("front:", queue[0])\nprint("remove:", queue.popleft())\nprint(list(queue))';
 if(/linked/.test(t))return 'class Node:\n    def __init__(self, value, next_node=None):\n        self.value = value\n        self.next = next_node\n\nhead = Node(10, Node(20, Node('+n.c+')))\ncurrent = head\nwhile current:\n    print(current.value)\n    current = current.next';
 if(/recurs/.test(t))return 'def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nprint(factorial('+clamp(n.a,3,7)+'))';
 if(/binary search/.test(t))return 'def binary_search(nums, target):\n    left, right = 0, len(nums) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n\nprint(binary_search([2, 4, 7, 9, 13, '+(13+n.a)+'], 9))';
 if(/sort|sorting|bubble|selection|insertion/.test(t)){
  if(mode<2)return 'nums = [5, 1, 4, 2, '+n.a+']\nprint("before:", nums)\nnums.sort()\nprint("after:", nums)';
  return 'nums = [5, 1, 4, 2, 8]\nfor i in range(len(nums)):\n    for j in range(len(nums) - i - 1):\n        if nums[j] > nums[j + 1]:\n            nums[j], nums[j + 1] = nums[j + 1], nums[j]\nprint(nums)';
 }
 if(/tree|bst|binary tree/.test(t))return 'tree = {"value": 8, "left": {"value": 3}, "right": {"value": '+n.c+'}}\nprint(tree["left"]["value"], tree["value"], tree["right"]["value"])';
 if(/graph|bfs|dfs/.test(t))return 'from collections import deque\ngraph = {0: [1, 2], 1: [3], 2: [3], 3: []}\nqueue = deque([0])\nseen = {0}\norder = []\nwhile queue:\n    node = queue.popleft()\n    order.append(node)\n    for nxt in graph[node]:\n        if nxt not in seen:\n            seen.add(nxt)\n            queue.append(nxt)\nprint(order)';
 if(/error|exception|debug|bug|validation/.test(t))return 'def safe_divide(a, b):\n    if b == 0:\n        raise ValueError("b cannot be zero")\n    return a / b\n\nfor divisor in [2, 0, '+n.a+']:\n    try:\n        print(safe_divide(10, divisor))\n    except ValueError as error:\n        print("handled:", error)';
 if(/test|assert|unit test|pytest/.test(t))return 'def add(a, b):\n    return a + b\n\ncases = [(2, 3, 5), (-1, 1, 0), ('+n.a+', '+n.b+', '+(n.a+n.b)+')]\nfor a, b, expected in cases:\n    actual = add(a, b)\n    assert actual == expected\n    print("passed", a, b)';
 if(/file|io|read write|stream/.test(t))return 'from io import StringIO\nfile_like = StringIO("alpha\\nbeta\\ngamma\\n")\nlines = [line.strip() for line in file_like if line.strip()]\nprint(lines)';
 if(/thread|concurr|race|lock|parallel|worker/.test(t))return 'jobs = [3, 1, 4, '+n.a+']\nworkers = {"worker-1": [], "worker-2": []}\nfor index, job in enumerate(jobs):\n    key = "worker-1" if index % 2 == 0 else "worker-2"\n    workers[key].append(job)\nprint(workers)';
 if(/process|subprocess|ipc|pipe|socket/.test(t))return 'messages = [{"from":"client","type":"request","id":1},{"from":"server","type":"response","id":1}]\nfor message in messages:\n    print(message["from"], message["type"], message["id"])';
 if(/cache|cpi|pipeline|latency|throughput|branch|memory|tlb|architecture/.test(t)){
  if(mode===0)return 'instructions = '+(1000+n.c*10)+'\ncycles = '+(1300+n.c*12)+'\ncpi = cycles / instructions\nprint(f"CPI={cpi:.2f}")';
  if(mode===1)return 'hit_time = 1\nmiss_rate = 0.'+(5+seed)+'\nmiss_penalty = 80\namat = hit_time + miss_rate * miss_penalty\nprint("AMAT:", round(amat, 2))';
  if(mode===2)return 'predicted = [True, True, False, True]\nactual = [True, False, False, True]\ncorrect = sum(p == a for p, a in zip(predicted, actual))\nprint("accuracy:", correct / len(actual))';
  return 'addresses = [0, 4, 8, 16, 0, 4]\nline_size = 4\nsets = 4\nprint([((address // line_size) % sets) for address in addresses])';
 }
 if(/interrupt|sensor|gpio|embedded|timer|adc|pwm|microcontroller/.test(t))return 'samples = [21.3, 21.8, 22.1, '+(23+seed/10).toFixed(1)+']\nlimit = 23.0\nfor tick, value in enumerate(samples):\n    state = "ALARM" if value > limit else "OK"\n    print(tick, value, state)';
 if(/sql|database|query|table|join|record/.test(t)){
  if(mode<2)return 'rows = [{"name":"Ali","score":90},{"name":"Maya","score":84},{"name":"Ahmed","score":'+(80+n.a)+'}]\nselected = [row for row in rows if row["score"] >= 85]\nprint(selected)';
  return 'orders = [{"user":"A","total":20},{"user":"B","total":35},{"user":"A","total":15}]\ntotals = {}\nfor order in orders:\n    totals[order["user"]] = totals.get(order["user"], 0) + order["total"]\nprint(totals)';
 }
 if(/html|css|web|dom|frontend|react/.test(t))return 'title = "CS & AI Mastery"\nitems = ["Learn", "Practice", "Build"]\nhtml = f"<h1>{title}</h1>" + "<ul>" + "".join(f"<li>{item}</li>" for item in items) + "</ul>"\nprint(html)';
 if(/api|http|rest|backend|request|response|endpoint/.test(t))return 'request = {"method": "GET", "path": "/courses", "user": "student"}\nallowed = request["method"] == "GET" and request["path"].startswith("/")\nresponse = {"status": 200 if allowed else 400, "ok": allowed}\nprint(response)';
 if(/machine learning|model|regression|classification|neural|gradient|deep learning|embedding|transformer|llm|rag|agent/.test(t)){
  if(mode===0)return 'features = [0.6, 0.2, 0.9]\nweights = [0.8, -0.3, 0.5]\nbias = 0.1\nscore = sum(x * w for x, w in zip(features, weights)) + bias\nprint("score:", round(score, 3))';
  if(mode===1)return 'actual = [1, 0, 1, 1]\npredicted = [1, 0, 0, 1]\ncorrect = sum(a == p for a, p in zip(actual, predicted))\nprint("accuracy:", correct / len(actual))';
  if(mode===2)return 'documents = {"python":"Python uses dynamic typing.","sql":"SQL queries relational data."}\nquery = "dynamic typing"\nbest = max(documents, key=lambda key: sum(word in documents[key].lower() for word in query.split()))\nprint(best, documents[best])';
  return 'tokens = ["learn", "practice", "build"]\ncontext = " | ".join(tokens)\nprint("context:", context)';
 }
 if(/probability|statistics|mean|median|data analysis|pandas/.test(t))return 'values = [12, 15, 14, '+(10+n.a)+', '+(12+n.b)+']\nmean = sum(values) / len(values)\nordered = sorted(values)\nmedian = ordered[len(ordered)//2]\nprint("mean:", mean)\nprint("median:", median)';
 if(/security|auth|token|password|permission|access/.test(t))return 'session = {"user":"student","role":"learner","active":True}\nallowed_roles = {"learner", "admin"}\ncan_access = session["active"] and session["role"] in allowed_roles\nprint("access:", can_access)';
 if(/git|version control|commit|branch/.test(t))return 'commits = ["setup", "add lessons", "fix tests"]\nbranch = "feature/study-examples"\nprint("branch:", branch)\nfor number, message in enumerate(commits, start=1):\n    print(number, message)';
 return 'concept = '+JSON.stringify(String(topic||'lesson concept'))+'\nvalues = ['+n.a+', '+n.b+', '+n.c+']\nresult = [value * 2 for value in values]\nprint(concept)\nprint("input:", values)\nprint("result:", result)';
}
function card(b,i,total,source){var c=conceptAt(b,i),kind=kindFor(i,total),title=lessonTitle(b.closest('.lesson'))+' — Example '+(i+1)+': '+c;var code=i===0&&source?source:program(lessonTitle(b.closest('.lesson'))+' '+c+' '+objectiveAt(b,i),i+1);return '<article class="csai-study-example csai-example-card" data-language="python" data-title="'+esc(title)+'"><div class="csai-study-example-head"><div><span class="csai-study-number">Example '+(i+1)+' of '+total+'</span><h4>'+esc(c)+'</h4></div><span class="csai-study-kind">'+esc(kind)+'</span></div><p class="description csai-study-task">'+esc(taskFor(b,i,total))+'</p><textarea class="csai-study-code" data-editor data-language="python" spellcheck="false">'+esc(code)+'</textarea><div class="csai-example-actions csai-study-actions"><button type="button" class="csai-study-run" data-study-run>▶ Run / Check</button><button type="button" class="csai-study-reset" data-study-reset>Reset</button><button type="button" class="csai-clean-publish" data-final-publish data-final-kind="example">Publish to GitHub</button><button type="button" class="csai-clean-readme" data-final-readme data-final-kind="example">Add a README</button><span class="csai-final-publish-status" data-final-publish-status aria-live="polite"></span></div><div class="csai-study-output" data-study-output>Ready.</div><div class="csai-study-explain"><b>What to learn:</b> '+esc('Focus on '+c+'. '+objectiveAt(b,i)+'. After running it, change one value and explain why the output changes.')+'</div></article>';}
function style(){if(document.getElementById('csai-study-examples-style'))return;var s=document.createElement('style');s.id='csai-study-examples-style';s.textContent='[data-adaptive-lab]{display:none!important}.csai-study-set{margin:18px 0 8px;padding-top:4px}.csai-study-set-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin:0 0 12px}.csai-study-set-head h3{margin:0!important}.csai-study-set-head p{margin:4px 0 0;color:var(--muted);font-size:.88rem}.csai-study-count{padding:5px 9px;border-radius:999px;background:var(--pill);color:var(--pilltext);font-size:.72rem;font-weight:900}.csai-study-list{display:grid;gap:14px}.csai-study-example{overflow:hidden;border:1px solid var(--border);border-radius:14px;background:var(--panel);box-shadow:0 8px 24px rgba(0,0,0,.06)}.csai-study-example-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:13px 14px;border-bottom:1px solid var(--border)}.csai-study-example-head h4{margin:4px 0 0;font-size:1rem}.csai-study-number{font-size:.72rem;font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}.csai-study-kind{padding:5px 8px;border-radius:999px;background:var(--pill);color:var(--pilltext);font-size:.7rem;font-weight:900}.csai-study-task{margin:0;padding:11px 14px;color:var(--muted);line-height:1.55}.csai-study-code{display:block;width:100%;min-height:155px;resize:vertical;border:0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);outline:0;padding:14px;background:#0b111b;color:#f4f7fb;font:500 13px/1.58 ui-monospace,SFMono-Regular,Consolas,monospace;tab-size:4}.csai-study-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:10px 12px}.csai-study-run,.csai-study-reset{min-height:38px;border-radius:10px;padding:.62rem .9rem;font:850 12px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer}.csai-study-run{border:1px solid #17649a;background:#17649a;color:#fff}.csai-study-reset{border:1px solid var(--border);background:var(--panel);color:var(--text)}.csai-study-run:disabled{opacity:.58;cursor:wait}.csai-study-output{min-height:56px;padding:11px 14px;border-top:1px solid var(--border);background:var(--bg);white-space:pre-wrap;font:500 12.5px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace}.csai-study-explain{padding:11px 14px;border-top:1px solid var(--border);color:var(--muted);font-size:.82rem;line-height:1.55}@media(max-width:640px){.csai-study-set-head,.csai-study-example-head{align-items:flex-start;flex-direction:column}.csai-study-actions>button{flex:1 1 145px}}';document.head.appendChild(s);}
function buildLesson(lesson){var b=body(lesson);if(!b||b.querySelector('[data-study-example-set]'))return;var total=countFor(b),source=sourceExample(b),anchor=hideOriginalExample(b);var set=document.createElement('section');set.className='csai-study-set';set.setAttribute('data-study-example-set','');set.setAttribute('data-study-count',String(total));var cards=[];for(var i=0;i<total;i++)cards.push(card(b,i,total,source));set.innerHTML='<div class="csai-study-set-head"><div><h3>Study examples</h3><p>Work through every example, run it, change it, then save the strongest ones to GitHub.</p></div><span class="csai-study-count">'+total+' examples</span></div><div class="csai-study-list">'+cards.join('')+'</div>';if(anchor)anchor.insertAdjacentElement('beforebegin',set);else{var mistake=Array.from(b.children).find(function(n){return /common mistake/i.test(n.textContent||'');});if(mistake)b.insertBefore(set,mistake);else b.appendChild(set);}set.querySelectorAll('.csai-study-code').forEach(function(area){area.defaultValue=area.value;});}
function fixHomeStat(){document.querySelectorAll('.av4-stat strong').forEach(function(n){if(/^4\s*[–-]\s*8$/.test(String(n.textContent||'').trim()))n.textContent='5–8';});document.querySelectorAll('.av4-stat span').forEach(function(n){if(/Examples per lesson/i.test(n.textContent||''))n.textContent='Examples per lesson, based on concepts';});}
async function runExample(button){var root=button.closest('.csai-study-example'),area=root&&root.querySelector('.csai-study-code'),out=root&&root.querySelector('[data-study-output]');if(!root||!area||!out)return;button.disabled=true;out.textContent=window.CSAIPythonRunner&&window.CSAIPythonRunner.isReady&&window.CSAIPythonRunner.isReady()?'Running Python…':'Preparing Python…';try{if(!window.CSAIPythonRunner||typeof window.CSAIPythonRunner.runSource!=='function')throw new Error('Python runner is still loading. Try again in a moment.');var result=await window.CSAIPythonRunner.runSource(area.value);out.textContent=(result.error?'Run error':'Run complete ✓')+'\n'+(result.text||'(no output)')+'\n\nPython run: '+result.milliseconds+' ms';}catch(error){out.textContent='Runner error\n'+(error.message||String(error));}finally{button.disabled=false;}}
function bind(){document.addEventListener('click',function(e){var run=e.target.closest&&e.target.closest('[data-study-run]');if(run){e.preventDefault();runExample(run);return;}var reset=e.target.closest&&e.target.closest('[data-study-reset]');if(reset){e.preventDefault();var root=reset.closest('.csai-study-example'),area=root&&root.querySelector('.csai-study-code'),out=root&&root.querySelector('[data-study-output]');if(area)area.value=area.defaultValue;if(out)out.textContent='Reset.';}},true);document.addEventListener('pointerover',function(e){if(e.target.closest&&e.target.closest('.csai-study-example')&&window.CSAIPythonRunner&&typeof window.CSAIPythonRunner.prewarm==='function')window.CSAIPythonRunner.prewarm();},true);document.addEventListener('focusin',function(e){if(e.target.matches&&e.target.matches('.csai-study-code')&&window.CSAIPythonRunner&&typeof window.CSAIPythonRunner.prewarm==='function')window.CSAIPythonRunner.prewarm();},true);}
function apply(){style();fixHomeStat();document.querySelectorAll('.lesson').forEach(buildLesson);}
function queue(){clearTimeout(applyTimer);applyTimer=setTimeout(apply,40);}
function boot(){apply();bind();setTimeout(apply,180);setTimeout(apply,700);setTimeout(fixHomeStat,1200);new MutationObserver(function(records){if(records.some(function(r){return r.addedNodes&&r.addedNodes.length;}))queue();}).observe(document.documentElement,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
