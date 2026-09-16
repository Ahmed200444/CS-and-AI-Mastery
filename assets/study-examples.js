(function(){
'use strict';

var applyTimer=0;
var generatedCourseSignatures={};
function claimGeneratedSignature(course,sig,used){var cid=String(course||'unknown').toLowerCase(),bucket=generatedCourseSignatures[cid]||(generatedCourseSignatures[cid]={});if(!sig||(used&&used[sig])||bucket[sig])return false;if(used)used[sig]=1;bucket[sig]=1;return true;}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function norm(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function uniq(xs){var seen={};return xs.filter(function(x){x=String(x||'').trim();var k=x.toLowerCase();if(!x||seen[k])return false;seen[k]=1;return true;});}
function lessonTitle(lesson){var n=lesson.querySelector('summary .title,summary');return String(n&&n.textContent||'Lesson').replace(/\s+Complete\s*$/i,'').trim();}
function body(lesson){return lesson.querySelector('.body');}
function headingList(b,label){var hs=Array.from(b.querySelectorAll('h3'));var h=hs.find(function(x){return norm(x.textContent)===norm(label);});if(!h)return[];var n=h.nextElementSibling;if(!n||!/^UL|OL$/.test(n.tagName))return[];return Array.from(n.querySelectorAll('li')).map(function(x){return x.textContent.trim();}).filter(Boolean);}
function concepts(b){var h=Array.from(b.querySelectorAll('h3')).find(function(x){return /key concepts/i.test(x.textContent||'');});var n=h&&h.nextElementSibling;var xs=n?Array.from(n.querySelectorAll('.pill')).map(function(x){return x.textContent.trim();}):[];if(!xs.length)xs=Array.from(b.querySelectorAll('.meta .pill')).map(function(x){return x.textContent.trim();});return uniq(xs);}
function objectives(b){return uniq(headingList(b,'What you will learn'));}
function countFor(b){return Math.max(5,concepts(b).length+2);}
function conceptAt(b,i){var cs=concepts(b);return cs.length?cs[i%cs.length]:lessonTitle(b.closest('.lesson'));}
function objectiveAt(b,i){var os=objectives(b);return os.length?os[i%os.length]:'Apply the lesson concept correctly';}
function kindFor(i,total){if(i===0)return'Guided example';if(i===1)return'New use case';if(i===2)return'Different operation';if(i===total-2)return'Integrated application';if(i===total-1)return'Edge case / debug';return'Concept transfer';}
function taskFor(b,i,total){var c=conceptAt(b,i),o=objectiveAt(b,i),title=lessonTitle(b.closest('.lesson')),course=studyCourseId();if(i===0)return'Follow the example in execution order and connect each important line to '+c+'.';if(i===1)return practicalUseFor(course,title,c,i);if(i===2)return practicalUseFor(course,title,c,i+2);if(i===total-2)return'Combine the important '+title+' ideas in one small application and check how the result of one step becomes the input or condition for the next.';if(i===total-1)return'Test '+title+' with a realistic boundary, invalid, empty, missing, repeated, or failure case and explain the correct behavior.';return practicalUseFor(course,title,c,i)+' '+o;}
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
function legacyProgram(topic,seed,cid){cid=String(cid||studyCourseId()||'').toLowerCase();var t=norm(topic),n=seedNums(seed),mode=seed%4;
 /* v5.66: concept-first examples. These rules intentionally use the concept name itself,
    so a lesson title such as "memory" cannot accidentally turn an identity example into cache code. */
 if(/^references?$|object references?|python references?/.test(t))return 'a = [1, 2]\nb = a\nprint(a is b)\nb.append(3)\nprint(a)';
 if(/^identity$|object identity/.test(t))return 'a = [1, 2]\nb = [1, 2]\nprint(a == b)  # same values\nprint(a is b)  # different objects';
 if(/^aliasing$|object aliasing/.test(t))return 'original = {"status": "new"}\nalias = original\nalias["status"] = "done"\nprint(original)';
 if(/^mutation$|mutability|mutable objects?/.test(t))return 'items = [1, 2]\nitems.append(3)\nprint(items)';
 if(/automatic memory management|garbage collection|reference counting/.test(t))return 'import sys\nobj = []\nalias = obj\nprint(sys.getrefcount(obj) >= 2)\ndel alias\nprint(sys.getrefcount(obj) >= 1)';
 if(/^index$|indexing|o 1 access|constant time access/.test(t))return 'values = [10, 20, 30]\nprint(values[1])';
 if(/^traversal$|array traversal|list traversal/.test(t))return 'values = [10, 20, 30]\nfor value in values:\n    print(value)';
 if(/^set$|sets|set membership|uniqueness/.test(t))return 'nums = [1, 2, 1, 3, 2]\nunique = set(nums)\nprint(unique)\nprint(2 in unique)';
 if(/^tuple$|tuples|immutability/.test(t))return 'point = (4, 7)\nprint(point[0])\nprint(point)';
 if(/list comprehension/.test(t))return 'nums = [1, 2, 3, 4]\nsquares = [n * n for n in nums]\nprint(squares)';
 if(/^membership$|membership test/.test(t))return 'seen = {1, 2, 3}\nprint(2 in seen)\nprint(5 in seen)';
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
 if((cid==='dsa'||cid==='cpp-dsa')&&/(^| )stack( |$)/.test(t))return 'stack = []\nfor value in [10, 20, '+(20+n.a)+']:\n    stack.append(value)\nprint("top:", stack[-1])\nprint("pop:", stack.pop())\nprint(stack)';
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
 if(['comparch-os','digital-hardware','advanced-computer-organization','embedded-systems'].includes(cid)&&/cache|cpi|pipeline|latency|throughput|branch|memory|tlb|architecture/.test(t)){
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
function structureSignature(code){return String(code||'').replace(/#.*$/gm,'').replace(/(["'])(?:\\.|(?!\1).)*\1/g,'STR').replace(/\b\d+(?:\.\d+)?\b/g,'NUM').replace(/\s+/g,' ').trim();}
function pitfallText(b){var h=Array.from(b.querySelectorAll('h3')).find(function(x){return /common pitfalls?/i.test(x.textContent||'');});var n=h&&h.nextElementSibling;if(n){var li=n.querySelector&&n.querySelector('li');if(li&&li.textContent.trim())return li.textContent.trim();}var note=b.querySelector('.note');return String(note&&note.textContent||'').replace(/^Common mistake:\s*/i,'').trim();}
function shortSentences(v,maxChars){
 var text=String(v||'').replace(/\s+/g,' ').trim();if(!text)return'';
 var parts=text.split(/(?<=[.!?])\s+/),out='';
 for(var i=0;i<parts.length&&i<2;i++){var next=(out?out+' ':'')+parts[i];if(out&&next.length>maxChars)break;out=next;if(out.length>=maxChars)break;}
 return out||text.slice(0,maxChars).trim();
}
function lessonConciseText(b){
 var p=b&&b.querySelector('.lesson-main-explanation p');
 return shortSentences(p&&p.textContent,320)||'This is the main idea explained in this lesson.';
}
function conceptSourceDefinition(b,label){
 var raw=String(label||'').trim(), target=norm(raw);
 if(!b||!target)return'';
 var stop={the:1,and:1,or:1,for:1,with:1,from:1,into:1,that:1,this:1,case:1,idea:1,concept:1};
 var terms=target.split(/\s+/).filter(function(w){return w.length>2&&!stop[w];});
 function stem(w){w=String(w||'');if(w.length<5)return w;return w.replace(/(ations?|itions?|ments?|ness|ingly|ingly|ing|ers?|ors?|ed|es|s)$/,'');}
 var stems=terms.map(stem).filter(function(w){return w.length>=4;});
 var candidates=[];
 Array.from(b.querySelectorAll('.lesson-main-explanation p, .lesson-main-explanation li')).forEach(function(node){
  String(node.textContent||'').replace(/\s+/g,' ').trim().split(/(?<=[.!?])\s+/).forEach(function(text){
   text=String(text||'').trim();if(!text)return;
   var n=norm(text),words=n.split(/\s+/),score=0;
   if(target&&n.indexOf(target)>=0)score+=12;
   terms.forEach(function(w){if(words.indexOf(w)>=0)score+=2;});
   stems.forEach(function(st){if(words.some(function(w){return w.indexOf(st)===0||st.indexOf(w)===0&&w.length>=4;}))score+=1.5;});
   if(terms.length&&terms.every(function(w){return words.indexOf(w)>=0;}))score+=4;
   if(score)candidates.push({text:text,score:score});
  });
 });
 candidates.sort(function(a,b){return b.score-a.score||a.text.length-b.text.length;});
 if(!candidates.length||candidates[0].score<4)return'';
 var chosen=[candidates[0].text];
 for(var i=1;i<candidates.length&&chosen.length<2;i++){
  if(candidates[i].score<4)break;
  if(norm(chosen.join(' ')).indexOf(norm(candidates[i].text))<0)chosen.push(candidates[i].text);
 }
 return shortSentences(chosen.join(' '),520);
}
function relatedConceptNames(b,label,max){
 var target=norm(label);return concepts(b).filter(function(c){return norm(c)!==target;}).slice(0,max||3);
}
function contextualGeneratedDefinition(b,label){
 var t=norm(label),title=lessonTitle(b.closest('.lesson')),related=relatedConceptNames(b,label,4),focus=related.length?related.join(', '):title;
 if(/integrated application/.test(t))return'An integrated application combines several ideas from '+title+' in one complete task instead of practicing each idea separately. Here, the focus is on using '+focus+' together and following how one operation affects the next. The goal is to understand how the lesson concepts work together in a realistic solution.';
 if(/edge case.*debug|debug.*edge case/.test(t))return'An edge case is a boundary or unusual input where normal assumptions can fail. Debugging means tracing the program or system to find why the actual behavior differs from the expected behavior. In '+title+', use this example to test the lesson idea with unusual, minimum, maximum, empty, missing, repeated, or failure inputs when those cases make sense.';
 if(/concept transfer/.test(t))return'Concept transfer means recognizing the same underlying '+title+' idea in a different problem instead of memorizing one example. The important skill is to identify which part of the new problem matches the concept, apply the same rule correctly, and check that the resulting behavior still makes sense.';
 return'';
}
function expandedConceptDefinition(b,label){
 var raw=String(label||'').trim(),t=norm(raw),title=lessonTitle(b.closest('.lesson')),cid=studyCourseId();
 var meta=contextualGeneratedDefinition(b,raw);if(meta)return meta;
 if(/maintainability/.test(t))return'Maintainability is how easy and safe software is to understand, change, fix, and extend over time. Maintainable code limits the number of unrelated places that must change when requirements move. In '+title+', focus on structure that keeps future changes local and predictable.';
 if(/testability/.test(t)&&!/cost/.test(t))return'Testability is how easily a piece of software can be checked in isolation with reliable tests. Testable code has clear inputs, outputs, and dependencies so failures can be reproduced without setting up the whole system. In '+title+', notice which design choices make behavior easier to verify.';
 if(/separation of concerns/.test(t))return'Separation of concerns means giving different responsibilities to different parts of a program instead of mixing them together. Each part should have a clear reason to change. This reduces accidental coupling and makes code easier to understand, test, and modify.';
 if(/^coupling$|coupling and cohesion|coupling & cohesion/.test(t))return'Coupling describes how strongly one module depends on another module’s details. Lower coupling usually means one component can change without forcing unrelated components to change. The lesson pairs this with cohesion so responsibilities stay focused inside each module.';
 if(/^cohesion$|cohesion in practice/.test(t))return'Cohesion describes how closely the responsibilities inside one module belong together. High cohesion means the module has one clear purpose instead of several unrelated jobs. This usually makes the module easier to understand, test, and change.';
 if(/propagation delay/.test(t))return'Propagation delay is the small amount of time a hardware signal needs to travel through a gate or circuit and produce the new output. A digital value does not change everywhere instantly. This matters for timing because several delays can add up along a path.';
 if(/fan out|fan-out/.test(t))return'Fan-out is the number of other inputs that one digital output can drive reliably. Driving too many loads can weaken or slow the signal. The concept helps you reason about whether one gate or signal source can safely feed all of the components connected to it.';
 if(/active high/.test(t))return'Active-high means a control or signal is considered asserted when its value is HIGH, usually logic 1. When the signal is LOW, the function is inactive. The name tells you which electrical/logical level turns the behavior on.';
 if(/active low/.test(t))return'Active-low means a control or signal is considered asserted when its value is LOW, usually logic 0. It is often written with a bar, slash, or suffix such as `_n`. The important point is that LOW turns the function on rather than off.';
 if(/^overflow$/.test(t))return'Overflow happens when a numeric result is outside the range that the chosen number of bits or data type can represent. The stored result can wrap, lose information, or trigger a flag depending on the system. You should learn to recognize when the available representation is too small for the calculation.';
 if(/^alu$|arithmetic logic unit/.test(t))return'An ALU (Arithmetic Logic Unit) is the part of a processor that performs arithmetic and logical operations such as addition, subtraction, AND, and comparisons. Control signals select which operation it performs. Its output becomes data used by later processor steps.';
 if(/critical path/.test(t))return'The critical path is the longest chain of dependent hardware operations that must finish before a result is ready. Its total delay limits how fast the circuit can safely be clocked. Shortening this path can allow a higher clock frequency.';
 if(/enable signal/.test(t))return'An enable signal controls whether a hardware component is allowed to perform its normal action. When enable is inactive, the component usually holds its state or ignores the operation. It lets the system decide when a register, counter, or other block should respond.';
 if(/reset signal/.test(t))return'A reset signal forces a hardware component or system into a known starting state. It is used at startup or recovery so stored state does not begin unpredictably. The lesson should make clear what state is restored and whether reset is active-high or active-low.';
 if(/shift register/.test(t))return'A shift register is a group of storage bits that moves its stored data left or right on clock events. Each shift transfers a bit to a neighboring position. It is useful for serial data movement, delays, and bit-level transformations.';
 if(/^sram$/.test(t))return'SRAM stores bits using small latch-like circuits and keeps them as long as power is supplied. It is fast and does not need periodic refresh, but it uses more hardware per bit. That makes it common for small, fast memories such as CPU caches.';
 if(/^dram$/.test(t))return'DRAM stores each bit as charge that leaks away over time, so the memory must be refreshed periodically. It is denser and cheaper per bit than SRAM but generally slower. That trade-off makes DRAM common for main system memory.';
 if(/^rom$/.test(t))return'ROM is memory intended mainly for data that should remain available without being rewritten during normal operation. Its contents are non-volatile, so they remain when power is removed. It is commonly used for fixed firmware or startup information.';
 if(/event loop/.test(t))return'An event loop repeatedly waits for work, takes ready events or callbacks, and runs them one at a time on its thread. In asynchronous programs, it lets other tasks make progress while one operation is waiting. The key is that waiting work does not have to block the entire program.';
 if(/^ownership$/.test(t))return'Ownership describes which part of a program is responsible for a resource or piece of data and therefore controls its lifetime or mutation rules. Clear ownership prevents multiple parts of a system from making conflicting assumptions. The exact rules depend on the language or framework used in this lesson.';
 if(/reproducibility/.test(t))return'Reproducibility means being able to run the same experiment, build, or workflow again under the same recorded conditions and obtain the same or meaningfully equivalent result. That requires tracking important inputs such as code, data, configuration, dependencies, and random seeds. It lets you verify results instead of relying on a one-time run.';
 if(/root cause/.test(t))return'A root cause is the underlying reason a failure happened, not merely the visible symptom. Root-cause analysis traces evidence backward until you find the condition that actually created the problem. Fixing the root cause prevents the same class of failure from returning.';
 if(/dead letter queue|dead-letter queue/.test(t))return'A dead-letter queue stores messages or jobs that could not be processed successfully after the normal retry policy. Keeping them separate prevents one bad item from blocking healthy work. Engineers can inspect, fix, or replay those failed items later.';
 if(/i o bound|io bound|i\/o bound/.test(t))return'An I/O-bound task spends most of its time waiting for external input/output such as files, databases, networks, or APIs rather than doing CPU calculations. Concurrency can help because another task may run while one task is waiting. The bottleneck is the external operation, not raw processor speed.';
 if(/^consistency$/.test(t)&&cid==='distributed-systems')return'Consistency describes what values different clients are allowed to observe when data has copies on multiple machines. A stronger consistency model gives stricter guarantees about when writes become visible, often at a cost to latency or availability. The lesson asks you to reason about which guarantee a design actually needs.';
 if(/^isolation$/.test(t)&&(cid==='databases'||cid==='sql'))return'Isolation controls how concurrent database transactions can observe or interfere with one another. Stronger isolation prevents more anomalies but can reduce concurrency or increase coordination. The goal is to choose a level that protects the required correctness rules.';
 if(/race condition/.test(t))return'A race condition occurs when the result depends on the unpredictable timing or ordering of concurrent operations. Two operations can each be correct alone but produce the wrong result when they interleave. Preventing races requires controlling shared state or coordinating access.';
 if(/factory pattern/.test(t))return'The Factory pattern moves object-creation decisions into a dedicated function or component. Callers ask for the kind of object they need without depending on every concrete constructor. This makes creation rules easier to change and can reduce coupling.';
 if(/observer pattern/.test(t))return'The Observer pattern lets one object publish a change to multiple interested subscribers without hard-coding every receiver. Observers register for notifications and react when the subject emits an event. It is useful when several parts of a program must stay informed about the same state change.';
 if(/page table/.test(t))return'A page table is the data structure the operating system and hardware use to map virtual memory pages to physical memory frames or other page states. Each process can therefore use virtual addresses without needing to know the exact physical location. Page-table entries also carry permissions and status information.';
 if(/page fault/.test(t))return'A page fault happens when a process accesses a virtual page that is not currently mapped in the way the CPU needs. The operating system handles the fault, for example by loading the page from storage, allocating it, or rejecting an invalid access. The program can then continue if the access is valid.';
 if(/error budget/.test(t))return'An error budget is the amount of unreliability a service can tolerate while still meeting its reliability target or SLO. Teams can spend that budget on releases and experimentation while the service remains within its target. When the budget is exhausted, reliability work usually takes priority.';
 if(/^grounding$|grounded answer/.test(t))return'Grounding means tying an AI answer to supplied evidence or trusted data instead of relying only on the model’s internal memory. A grounded system should make the answer consistent with the retrieved context and allow you to verify where important claims came from. This is especially important in RAG systems.';
 if(/^retrieval$/.test(t)&&cid==='rag')return'Retrieval is the step that searches a document or knowledge collection for information relevant to the user’s query. The selected evidence is then passed to later stages, such as an LLM, so the answer can use current or private information. Retrieval quality strongly affects whether the final answer has the right evidence.';
 return'';
}
function fallbackShapeDefinition(raw,behavior,title){
 var t=norm(raw),action=String(behavior||'').replace(/[.]$/,'').trim(),lower=action?action.charAt(0).toLowerCase()+action.slice(1):'';
 if(/trade off|tradeoff/.test(t))return raw+' describes a balance where improving one property can make another property worse. The important skill is to identify both sides of the trade-off and choose the balance that fits the requirement.';
 if(/policy|strategy|rule/.test(t))return raw+' is the rule or decision strategy that controls which action the program or system takes in this situation. Its purpose is to make the choice predictable instead of leaving the behavior accidental.';
 if(/validation|verification/.test(t))return raw+' is the process of checking that the relevant input, result, or system state satisfies the rules expected by '+title+'. A good check makes failure visible before later steps depend on bad data or behavior.';
 if(/handling|recovery/.test(t))return raw+' describes how the program or system responds when the related condition occurs. The goal is to preserve a correct state, report useful evidence, and continue or stop in a controlled way.';
 if(/management|lifecycle|lifetime/.test(t))return raw+' describes how the related resource or state is created, tracked, used, and eventually released or replaced. Understanding the lifecycle prevents code from using something too early, too late, or after it is no longer valid.';
 if(/architecture|design|structure|organization/.test(t))return raw+' describes how the relevant parts are arranged and how responsibility or data moves between them. The structure matters because it changes what can be modified, scaled, tested, or recovered independently.';
 if(/pipeline|workflow|flow/.test(t))return raw+' is a sequence of connected stages where the output or state from one stage becomes input to the next. To understand it, trace what enters each stage, what changes there, and what leaves it.';
 if(/state/.test(t))return raw+' is the information the program or system must remember at a particular moment so later decisions can use it. State changes as operations occur, so tracing those changes explains why the next result is produced.';
 if(/protocol/.test(t))return raw+' is a set of agreed rules for how two parts of a system communicate or coordinate. The rules define what messages or actions are valid and how each side should respond.';
 if(/metric|score|rate|ratio|accuracy|precision|recall|latency|throughput/.test(t))return raw+' is a measurement used to describe one aspect of behavior or performance. Its value only becomes useful when you know exactly what is being measured and what a higher or lower value means for the task.';
 if(/cost|complexity/.test(t))return raw+' describes how much time, memory, communication, or other work the related operation requires. Compare how that cost changes as the input or system scale changes rather than relying on one tiny run.';
 if(/failure|fault|error/.test(t))return raw+' describes a condition where the normal expected behavior is not achieved. The lesson focuses on how to recognize the condition, understand its effect, and keep the failure from silently producing an incorrect result.';
 if(lower&&lower!=='apply this lesson idea to a concrete engineering case and trace the starting state, the important decision or transformation, and an observable result')return'For '+raw+', the behavior to understand is this: '+lower+'. Trace the starting state, the rule or mechanism that acts on it, and the observable change so you can recognize the same idea in a new problem.';
 return'For '+raw+', focus on the exact rule, mechanism, or relationship that '+title+' is teaching. Identify what information it acts on, what it changes or decides, and what observable result distinguishes correct behavior from an incorrect one.';
}
function contextualConceptFallback(b,label){
 var raw=String(label||'').trim(),title=lessonTitle(b.closest('.lesson')),course=studyCourseId(),source=conceptSourceDefinition(b,raw);
 var behavior=professionalBehavior(course,title,raw),related=relatedConceptNames(b,raw,2),lesson=lessonConciseText(b);
 if(source){
  var action=String(behavior||'').replace(/[.]$/,'').trim();
  if(action)return shortSentences(source,480)+' For '+raw+', focus specifically on '+action.charAt(0).toLowerCase()+action.slice(1)+'.';
  return source+' This example focuses specifically on '+raw+'.';
 }
 var first=fallbackShapeDefinition(raw,behavior,title),parts=[];
 if(lesson&&lesson!=='This is the main idea explained in this lesson.')parts.push(lesson);
 if(!parts.length||norm(parts.join(' ')).indexOf(norm(first).slice(0,48))<0)parts.push(first);
 if(related.length)parts.push('It connects with '+related.join(' and ')+' in this lesson, so compare their roles instead of treating them as interchangeable.');
 return parts.slice(0,3).join(' ');
}
function conceptDefinition(b,label){
 var t=norm(label),raw=String(label||'').trim(),title=lessonTitle(b.closest('.lesson')),cid=studyCourseId();
 /* v5.71: definitions belong to the exact concept. Generated example types get an explicit
    learning explanation, and unknown labels use lesson evidence instead of generic filler. */
 var expanded=expandedConceptDefinition(b,raw);if(expanded)return expanded;
 if(/^references?$|object references?|python references?/.test(t)){if(cid==='cpp-dsa'||cid==='systems-programming')return'A C++ reference is an alias for an existing object: after it is initialized, operations through the reference act on that same object. References are useful for passing or modifying objects without copying them, while still using normal variable syntax.';return'A Python reference is the connection from a variable name to an object. Assigning the same object to another name can make both names refer to that one object, so mutating it through either name can be visible through the other.';}
 if(/^identity$|object identity/.test(t))return'Identity asks whether two names refer to the exact same object. In Python, `is` checks identity, while `==` usually compares values.';
 if(/^aliasing$|object aliasing/.test(t))return'Aliasing happens when two or more names refer to the same object, so a change made through one name can be visible through the others.';
 if(/^mutation$|mutability|mutable objects?/.test(t))return'Mutation means changing an existing object instead of replacing the variable with a different object.';
 if(/automatic memory management/.test(t))return'Automatic memory management means Python tracks object lifetime for you and can reclaim objects that are no longer needed.';
 if(/garbage collection/.test(t))return'Garbage collection is the process of reclaiming memory from objects that can no longer be used by the program.';
 if(/reference counting/.test(t))return'Reference counting tracks how many active references point to an object and helps Python manage that object’s lifetime.';

 if(/^compiler$/.test(t))return'A compiler translates C++ source code into lower-level object or machine code and reports compile-time errors it can detect. It handles each translation unit before the linker combines the compiled pieces into the final program.';
 if(/^linker$|linking/.test(t))return'The linker combines compiled object files and required libraries into the final executable. It resolves references between separately compiled pieces, so missing or duplicate definitions often appear as linker errors rather than compiler syntax errors.';
 if(/^main$|main function/.test(t))return'`main()` is the normal entry point of a C++ program: execution begins there after the program starts. Its return value is an exit status that can tell the operating system whether the program finished successfully.';
 if(/^token$|tokens/.test(t))return'A token is one meaningful unit of source code recognized by the language, such as a keyword, identifier, literal, operator, or punctuation symbol. The compiler reads source as tokens before it can understand larger expressions and statements.';
 if(/^scope$|variable scope/.test(t))return'Scope is the region of code where a name is visible and refers to a particular declaration. Local, class, namespace, and other scopes let the same spelling be used in different places without always referring to the same object.';
 if(/^namespace$|namespaces/.test(t))return'A C++ namespace groups names under a shared scope so libraries and projects can avoid name collisions. `std` is the standard-library namespace; `using namespace std;` makes its names available without writing the `std::` prefix each time.';
 if(/^auto$|type inference/.test(t))return'`auto` asks the C++ compiler to deduce a variable’s type from its initializer at compile time. The variable is still statically typed; `auto` removes repeated type spelling rather than making the type dynamic.';
 if(/^const$/.test(t))return'`const` prevents code from modifying a value through that particular name or access path after initialization. It communicates that the program should treat the value as read-only in that context.';
 if(/^constexpr$/.test(t))return'`constexpr` marks a value or function so it can participate in compile-time evaluation when its inputs and context allow it. It is useful when a result should be known before the program runs, not merely protected from modification.';
 if(/numeric limits/.test(t))return'Numeric limits are the minimum, maximum, and other representation properties of a C++ numeric type. They matter when an input or calculation may exceed the range the chosen type can safely store.';
 if(/^cin$/.test(t))return'`cin` is C++ standard input. The extraction operator `>>` reads formatted values into variables, and the stream enters a failure state if the incoming text cannot be converted as requested.';
 if(/^cout$/.test(t))return'`cout` is C++ standard output. The insertion operator `<<` sends values to the output stream in the order written so the program can display results.';
 if(/^iomanip$/.test(t))return'`<iomanip>` provides stream-formatting tools such as `setw`, `setprecision`, and `fixed`. These manipulators control how values are displayed without changing the underlying stored value.';
 if(/^pointer$|^pointers$/.test(t)){if(cid==='cpp-dsa'||cid==='systems-programming')return'A C++ pointer stores the memory address of another object or function. Dereferencing a valid pointer accesses the object at that address, while a null, dangling, or otherwise invalid pointer must not be dereferenced.';return'In Python/DSA examples, a pointer usually means a variable or reference that tracks a current position or node rather than a raw memory address. Moving the pointer changes which item or node the algorithm is currently examining.';}
 if(/^vector$|std vector|dynamic array/.test(t)&&cid==='cpp-dsa')return'`vector` is C++’s dynamic array container: it stores elements in contiguous memory, supports fast indexed access, and can grow when items are appended. Growing may reallocate the storage, which can invalidate pointers, references, or iterators to old elements.';
 if(/^append$|append\(\)|\.append/.test(t))return'`.append(value)` adds one item to the end of a Python list. It changes the existing list in place, so later code using that same list sees the new item.';
 if(/^len$|len\(\)/.test(t))return'`len(collection)` returns the number of items in a Python collection. For a list, the last valid index is therefore `len(list) - 1` because indexes start at 0.';
 if(/^sorted$|sorted\(\)/.test(t))return'`sorted(iterable)` reads the values from an iterable and returns a new list containing those values in sorted order. The original collection is not changed by `sorted()`.';
 if(/^sort$|\.sort\(\)/.test(t))return'`.sort()` rearranges an existing Python list in place and returns `None`. Use it when you want to change that list itself rather than create a separate sorted list.';
 if(/^join$|join\(\)|\.join/.test(t))return'`separator.join(strings)` combines a sequence of strings into one string and places the separator between neighboring items. Every item being joined must be a string.';
 if(/insert delete costs|insertion deletion costs/.test(t))return'Insert/delete cost describes how much work is needed to add or remove an item at a particular position. In an array/list, changing the middle can require shifting later elements, so the cost can grow with the number of items.';
 if(/^recurrence$|recurrence relation/.test(t))return'A recurrence describes the cost or result of a problem in terms of smaller instances of the same problem. It is commonly used to reason about recursive algorithms by expressing how one call depends on the work of its subcalls.';
 if(/union find|disjoint set|dsu/.test(t))return'Union-Find (Disjoint Set Union, DSU) maintains a collection of non-overlapping groups. `find` tells which group an item belongs to, while `union` merges two groups; path compression and union-by-rank/size make repeated operations very fast.';
 if(/minimum spanning tree|mst/.test(t))return'A minimum spanning tree connects every vertex of a weighted, connected, undirected graph using no cycles and the smallest possible total edge weight. Algorithms such as Kruskal and Prim choose edges while preserving those conditions.';
 if(/event sweep|sweep line/.test(t))return'A sweep-line algorithm sorts important start/end events and processes them in order while maintaining the state of what is currently active. It turns many interval or geometry problems into an ordered sequence of local updates instead of comparing every pair.';
 if(/^regression$|regression testing/.test(t)){if(cid==='testing'||cid==='debugging')return'Regression testing reruns checks for behavior that previously worked so a new change does not silently break it. A good regression test captures a real bug or important contract and fails if that same problem returns.';if(cid==='ai-ml'||cid==='data-science')return'Regression is a supervised-learning task where the target is a continuous numeric value rather than a category. The model learns a relationship from features to that numeric target and is evaluated with an error metric such as MAE or MSE.';}
 if(/time complexity/.test(t))return'Time complexity describes how the amount of work grows as the input size grows.';
 if(/space complexity/.test(t))return'Space complexity describes how much extra memory an approach needs as the input size grows.';
 if(/growth rate/.test(t))return'Growth rate describes how quickly an algorithm’s work or memory use increases as the input gets larger.';
 if(/^big o$|big o notation/.test(t))return'Big-O notation describes the growth rate of an algorithm’s time or extra space as the input size increases.';
 if(/best.*average.*worst|best case|average case|worst case/.test(t))return'Best, average, and worst cases describe how the same algorithm behaves on easier, typical, and most expensive inputs.';

 if(/stack trace/.test(t))return'A stack trace records the chain of function calls that led to an exception or failure, usually including file names and line numbers. Read it from the failure location back through its callers to find where the incorrect state or call originated.';
 if(/deque/.test(t)&&!(/queue/.test(t)))return'A deque (double-ended queue) allows efficient insertion and removal at both the front and the back. That makes it useful when an algorithm needs queue behavior plus the ability to work from either end.';
 if(/fast.*slow pointers|slow.*fast pointers/.test(t))return'Fast/slow pointers track two positions that move through a sequence or linked structure at different speeds. Their relative movement can find a middle element, detect a cycle, or locate another structural relationship without storing every visited position.';
 if(/stack/.test(t)&&!(/call stack/.test(t)))return'A stack stores items in LIFO order: the most recently added item is removed first.';
 if(/call stack/.test(t))return'The call stack keeps track of active function calls so Python knows where to return when each call finishes.';
 if(/queue|deque/.test(t))return'A queue processes items in FIFO order: the first item added is the first item removed.';
 if(/binary search/.test(t))return'Binary search finds a target in sorted data by repeatedly discarding half of the remaining search range.';
 if(/singly linked list/.test(t))return'A singly linked list stores each node with a value and one reference to the next node. Traversal moves in one direction, and inserting or removing a node requires updating the neighboring `next` reference without losing the rest of the chain.';
 if(/linked list/.test(t))return'A linked list stores values in nodes that connect to other nodes through references or pointers.';
 if(/hash table|hash map|dictionary/.test(t))return'A hash table stores key-value data so lookups, inserts, and deletes are usually fast on average.';
 if(/^set$|sets|set membership/.test(t))return'A set stores unique values and supports fast membership checks on average.';
 if(/^array$|arrays|dynamic array/.test(t))return'An array stores an ordered sequence of items and lets you access an item by its position or index.';
 if(/^index$|indexing/.test(t))return'An index is the position used to access an item in an ordered collection; Python sequence indexes start at 0.';
 if(/inorder traversal/.test(t))return'Inorder traversal visits a binary tree in left-node-right order. In a binary search tree, that visit order produces the stored keys in sorted order.';
 if(/traversal/.test(t))return'Traversal means visiting the items or nodes of a data structure one by one in a chosen order.';
 if(/contiguous memory/.test(t))return'Contiguous memory means storage locations are next to each other in memory, which can make indexed access efficient.';
 if(/recursion/.test(t))return'Recursion is when a function solves a problem by calling itself on a smaller version until a base case stops the calls.';
 if(/base case/.test(t))return'A base case is the condition that stops a recursive function from calling itself again.';
 if(/dynamic programming/.test(t))return'Dynamic programming avoids repeated work by saving and reusing answers to overlapping smaller problems.';
 if(/memoization/.test(t))return'Memoization saves previously computed results so the same work does not need to be repeated.';
 if(/bfs|breadth first/.test(t))return'Breadth-first search visits nearby graph or tree nodes level by level before moving farther away.';
 if(/dfs|depth first/.test(t))return'Depth-first search follows one path as far as possible before backtracking to try another path.';
 if(/^graph$|graphs/.test(t))return'A graph represents items as nodes and relationships between them as edges.';
 if(/binary tree/.test(t))return'A binary tree is a tree where each node has at most two children, usually called left and right. The structure supports recursive traversals and is the base shape used by structures such as binary search trees and heaps.';
 if(/^tree$|^trees$/.test(t))return'A tree is a hierarchical data structure made of nodes connected by parent-child relationships.';
 if(/binary search tree|(^| )bst( |$)/.test(t))return'A binary search tree keeps smaller keys on one side of a node and larger keys on the other, supporting ordered search.';
 if(/class/.test(t)&&/object/.test(t))return'Classes define reusable object structure and behavior; objects are individual instances created from a class.';
 if(/^class$|classes/.test(t))return'A class is a blueprint that defines the data and behavior its objects can have.';
 if(/^object$|objects/.test(t))return'An object is a concrete instance that stores data and can use behavior defined by its class.';
 if(/encapsulation/.test(t))return'Encapsulation groups related data and behavior together and controls how internal details are accessed.';
 if(/inheritance/.test(t))return'Inheritance lets one class reuse or extend behavior defined by another class.';
 if(/polymorphism/.test(t))return'Polymorphism lets different objects respond to the same operation in their own appropriate way.';

 if(/^abstraction$/.test(t))return'Abstraction exposes the operations a caller needs while hiding implementation details that the caller should not depend on. It lets you reason about what a component promises to do without knowing every step inside it.';
 if(/abstractmethod/.test(t))return'`@abstractmethod` marks a method that subclasses are expected to implement before the abstract base class can be used as a complete concrete type. It defines part of the contract shared by those subclasses.';
 if(/abstract class/.test(t))return'An abstract class defines a common interface or base behavior and is intended to be completed by subclasses.';

 if(/liskov substitution|substitutability/.test(t))return'The Liskov Substitution Principle says code that works with a base type should continue to behave correctly when given a valid subtype. A subtype must preserve the expectations and contract of the type it replaces rather than surprising its callers.';
 if(/^interface$|interfaces/.test(t))return'An interface describes the operations a component promises to provide without requiring callers to know its internal implementation.';

 if(/^installation$/.test(t))return'Python installation means placing a specific Python interpreter and its standard tools on the computer so `.py` programs can run. The important check is which interpreter/version your terminal or editor is actually using.';
 if(/^command line$/.test(t)&&cid==='python')return'The command line is a text interface where you run commands such as `python script.py`, inspect the current environment, and pass arguments to programs. It gives you a direct, repeatable way to see exactly how Python is being launched.';
 if(/idle.*editor|code editor/.test(t))return'An editor is where you write and save source code; IDLE is the simple editor and interactive shell bundled with many Python installations. The editor does not replace the Python interpreter—it sends or saves code that the interpreter executes.';
 if(/^help$/.test(t))return'`help(object)` displays Python documentation for a function, class, module, or other object. Use it when you need to discover supported arguments, methods, or behavior without guessing.';
 if(/^keywords?$/.test(t))return'Python keywords are reserved words such as `if`, `for`, `def`, and `return` that have special meaning in the language grammar. They cannot be used as ordinary variable or function names.';
 if(/^naming$|^identifiers?$/.test(t))return'An identifier is a valid name you create for a variable, function, class, or other program element. Good naming follows Python’s syntax rules and makes the purpose of the value or behavior clear to a reader.';
 if(/dynamic name binding/.test(t))return'Dynamic name binding means a Python name can be rebound to a different object while the program runs. The name itself does not permanently own one type; the object it currently references determines the available behavior.';
 if(/^f string$|^f-string$|^f"$/.test(t))return'An f-string is a Python string literal prefixed with `f` that evaluates expressions written inside `{}` and inserts their values into the resulting text. It is useful for building readable messages from variables without manual concatenation.';
 if(/string slicing/.test(t))return'String slicing selects a range of characters with `text[start:stop:step]`. The start index is included, the stop index is excluded, and omitted boundaries use the beginning or end of the string.';
 if(/^type conversion$|numeric conversion/.test(t))return'Type conversion creates a value of a different type from an existing value when that conversion is valid. For example, `int("42")` turns numeric text into an integer so arithmetic can be performed.';
 if(/^int$/.test(t))return'`int(value)` converts a compatible number or numeric string into an integer. Invalid text such as `"abc"` raises a `ValueError`, so user input may need validation before conversion.';
 if(/^str$/.test(t))return'`str(value)` produces a string representation of a value. It is commonly used when a number or other object must be combined with text or displayed in a textual format.';
 if(/^comments?$/.test(t))return'A Python comment starts with `#` and is ignored by the interpreter for the rest of that line. Comments should explain useful intent or reasoning rather than repeat code that is already obvious.';
 if(/^indentation$/.test(t))return'Python indentation defines which statements belong to blocks such as functions, loops, and conditions. Statements at the same indentation level belong to the same block, so incorrect indentation can change the program structure or cause an error.';
 if(/^input$/.test(t))return'`input(prompt)` displays an optional prompt and waits for the user to enter text. It always returns a string, so numeric input must be converted before arithmetic is performed.';
 if(/^print$/.test(t))return'`print(...)` sends the given values to standard output so you can see a result or message. Multiple values are separated by spaces by default, and options such as `sep` and `end` can change the formatting.';
 if(/^format$/.test(t))return'`format(value, spec)` converts a value to formatted text using a format specification such as decimal places, width, or alignment. The same formatting rules are also used inside f-strings after a colon.';
 if(/if elif else/.test(t))return'`if / elif / else` chooses one branch of code based on conditions. Python checks the conditions from top to bottom, runs the first matching branch, and uses `else` only when none of the earlier conditions are true.';
 if(/^comparisons?$|relational operators/.test(t))return'Comparison operators such as `==`, `!=`, `<`, `<=`, `>`, and `>=` compare values and produce `True` or `False`. Their boolean result is often used to control an `if` statement or loop.';
 if(/and or not|boolean logic/.test(t))return'Boolean logic combines or reverses conditions: `and` requires both sides to be truthy, `or` requires at least one side, and `not` reverses truthiness. Short-circuit evaluation can stop once the final boolean result is already known.';
 if(/bitwise operators/.test(t))return'Bitwise operators such as `&`, `|`, `^`, `~`, `<<`, and `>>` operate on the individual binary bits of integers. They are used for masks, flags, compact representations, and low-level numeric operations rather than normal boolean logic.';
 if(/^for loop$/.test(t))return'A `for` loop takes items from an iterable one at a time and runs its block once for each item. The loop variable is created or rebound on each iteration to the current item.';
 if(/^while loop$/.test(t))return'A `while` loop repeats its block while a condition remains true. The loop body must eventually change the relevant state or otherwise reach a stopping condition unless an intentional infinite loop is desired.';
 if(/^range$/.test(t))return'`range(start, stop, step)` represents a sequence of integers without first building a full list. `stop` is excluded, and the one-argument form `range(n)` produces `0` through `n - 1`.';
 if(/^break$/.test(t))return'`break` immediately exits the nearest active loop. Execution continues with the first statement after that loop, so it is useful when the needed result or stopping condition is reached early.';
 if(/^continue$/.test(t))return'`continue` skips the rest of the current loop iteration and starts the next iteration. It does not end the whole loop.';
 if(/^enumerate$/.test(t))return'`enumerate(iterable)` produces pairs containing an index and the corresponding item. It lets a loop use both position and value without manually updating a counter.';
 if(/^iteration$/.test(t))return'An iteration is one pass through a loop body. Repeated iterations let a program process each item or repeatedly update state until the loop stops.';
 if(/^membership$|membership test/.test(t))return'A membership test uses `in` or `not in` to ask whether a value appears in a collection. The cost depends on the collection type: membership is usually fast for sets and dictionaries but may require scanning a list.';
 if(/mutable vs immutable/.test(t))return'Mutable objects can be changed in place after creation, while immutable objects cannot be modified in place and instead require creating a new value. Lists and dictionaries are mutable; strings and tuples are common immutable examples.';
 if(/^==$/.test(raw)||t===''){} 
 if(raw==='==')return'`==` tests value equality: it asks whether two values should be considered equal based on their contents or equality rules. It is different from `is`, which asks whether two references point to the exact same object.';
 if(raw==='is')return'`is` tests object identity: it is true only when two names refer to the exact same object. Use `==` for normal value comparison and reserve `is` mainly for identity checks such as `value is None`.';
 if(/shallow copy|copy\.copy/.test(t))return'A shallow copy creates a new outer container but keeps references to the same nested objects inside it. Changing the outer container is independent, but mutating a shared nested object can still appear through both copies.';
 if(/deep copy|copy\.deepcopy/.test(t))return'A deep copy recursively creates independent copies of nested mutable objects so changes in the copied structure do not normally affect the original nested objects. It costs more time and memory than a shallow copy.';
 if(/^dict$/.test(t))return'A dictionary stores key-value pairs. Each key is unique and maps directly to its associated value, which makes dictionaries useful for lookups, counters, records, and grouping data by a meaningful identifier.';
 if(/key value/.test(t))return'A key-value pair connects a unique lookup key with the data stored for that key. In a dictionary, the key is how you find or update the corresponding value.';
 if(/^key in$/.test(t))return'`key in dictionary` checks whether the dictionary contains that key and returns `True` or `False`. It checks keys, not values, unless you explicitly search `dictionary.values()`.';
 if(/^get$/.test(t))return'`dictionary.get(key, default)` returns the value for `key` when it exists; otherwise it returns the supplied default instead of raising `KeyError`. It is useful for counters and optional data.';
 if(/lookup table/.test(t))return'A lookup table stores known mappings so a program can retrieve the result for a key directly instead of repeatedly searching or recomputing it. A Python dictionary is a common implementation.';
 if(/^def$/.test(t))return'`def` begins a Python function definition. It gives a reusable block of code a name and declares the parameters that receive data when the function is called.';
 if(/function contract/.test(t))return'A function contract describes what inputs a function accepts, what result or effect it promises, and what errors or conditions callers must expect. Clear contracts let code use the function without depending on its internal implementation.';
 if(/\*args/.test(raw))return'`*args` collects extra positional arguments into a tuple inside the function. It is useful when a function intentionally accepts a variable number of positional inputs.';
 if(/\*\*kwargs/.test(raw))return'`**kwargs` collects extra keyword arguments into a dictionary inside the function. It is useful when optional named inputs are intentionally open-ended.';
 if(/^docstring$/.test(t))return'A docstring is a string placed at the beginning of a module, class, or function to document its purpose and public behavior. Tools such as `help()` can display it.';
 if(/mutable default pitfall/.test(t))return'A mutable default argument is created once when the function is defined, not freshly on every call. Mutating that default can therefore leak state between calls; use `None` and create the mutable object inside the function when independent state is needed.';
 if(/local scope/.test(t))return'Local scope contains names created inside the current function call. Those names normally exist only for that call and are not directly visible from unrelated code outside the function.';
 if(/enclosing scope/.test(t))return'An enclosing scope belongs to an outer function around a nested function. A closure can read those outer-function names even after the outer call has finished when the values are captured.';
 if(/global scope/.test(t))return'Global scope contains module-level names. Functions can read them, but rebinding a global name inside a function requires `global`; excessive global mutable state can make behavior harder to reason about.';
 if(/^none$/.test(t))return'`None` is Python’s singleton value representing the absence of a normal value or result. Compare it with `is None`, not `== None`.';
 if(/^legb$/.test(t))return'LEGB is Python’s name-resolution order: Local, Enclosing, Global, then Built-in. When Python reads a name, it searches those scopes in that order until it finds a binding or raises `NameError`.';
 if(/first class function/.test(t))return'Functions are first-class objects in Python, so they can be stored in variables, placed in collections, passed as arguments, and returned from other functions just like other values.';
 if(/^lambda$/.test(t))return'A `lambda` creates a small anonymous function from one expression. It is useful for short behavior passed to another function, but a normal `def` is clearer when the logic needs multiple statements or a descriptive reusable name.';
 if(/^closure$/.test(t))return'A closure is a function that remembers values from an enclosing function scope even after the outer function has returned. It lets a function carry private configuration or state without using a class or global variable.';
 if(/higher order function/.test(t))return'A higher-order function receives another function as an argument, returns a function, or both. This lets behavior itself be passed around and composed.';
 if(/^callback$/.test(t))return'A callback is a function passed to other code so that code can call it later when an event, result, or condition occurs. The caller controls when the callback runs.';
 if(/^modules?$/.test(t))return'A Python module is a `.py` file or importable package unit that groups reusable names such as functions, classes, and constants. Importing a module lets other code use those names without copying their implementation.';
 if(/^import$/.test(t))return'`import` loads an importable module and binds a name that lets your code access its contents. Imports also make a file’s dependencies explicit.';
 if(/^dir$/.test(t))return'`dir(object)` returns the names of attributes and operations available on an object or module. It is useful for exploring unfamiliar Python objects interactively.';
 if(/virtual environments|venv/.test(t))return'A virtual environment creates an isolated Python environment with its own installed packages. It prevents one project’s dependency versions from silently changing another project.';
 if(/dependency isolation/.test(t))return'Dependency isolation keeps a project’s libraries and versions separate from unrelated projects. Virtual environments and lock/requirements files make the environment more reproducible.';
 if(/^try$/.test(t))return'A `try` block contains code that may raise an expected exception. Matching `except` blocks decide how the program should handle those failures.';
 if(/^except$/.test(t))return'`except` catches an exception raised by the matching `try` block when its type matches. Catch specific exceptions you can handle rather than hiding every possible programming error.';
 if(/^finally$/.test(t))return'A `finally` block runs after the `try` sequence whether an exception occurred or not. It is commonly used for cleanup that must happen in both success and failure cases.';
 if(/^raise$/.test(t))return'`raise` deliberately creates or re-raises an exception. Use it when a function detects invalid input or a state that should not be silently accepted.';
 if(/custom exception/.test(t))return'A custom exception is your own exception class, usually derived from `Exception`, used to represent a meaningful failure specific to your program or domain.';
 if(/zerodivisionerror/.test(t))return'`ZeroDivisionError` is raised when Python attempts division or modulo by zero. Prevent it by validating the divisor or handle it only when zero is an expected recoverable input.';
 if(/with open/.test(t))return'`with open(...) as file:` opens a file for a block and automatically closes it when the block ends, even if an exception occurs. The selected mode controls whether you read, write, append, or use binary data.';
 if(/read write modes/.test(t))return'File modes control how `open()` accesses a file: `r` reads, `w` replaces/creates, `a` appends, and adding `b` uses bytes instead of text. Choosing the wrong mode can overwrite data or return the wrong data type.';
 if(/^pathlib$/.test(t))return'`pathlib` represents filesystem paths as objects, providing readable operations for joining paths, checking existence, creating directories, and reading or writing files without manual separator handling.';
 if(/i o errors|io errors/.test(t))return'I/O errors occur when an external input/output operation cannot complete, for example because a file is missing, permissions deny access, or storage/network resources fail. Handle only the failures your program can meaningfully recover from.';
 if(/^pickle$/.test(t))return'`pickle` serializes Python objects into a Python-specific byte format and can reconstruct them later. Never unpickle untrusted data because loading a pickle can execute malicious code.';
 if(/trusted data/.test(t))return'Trusted data comes from a source whose integrity and permissions you are willing to rely on. Formats with code-execution risk, such as pickle, should only be loaded from trusted sources.';
 if(/^iter$/.test(t))return'`iter(iterable)` returns an iterator that keeps track of traversal state for an iterable. Calling `next()` on that iterator requests the next value.';
 if(/^next$/.test(t))return'`next(iterator)` asks an iterator for its next value. When no values remain, the iterator raises `StopIteration` unless a default is supplied to `next()`.';
 if(/^yield$/.test(t))return'`yield` produces one value from a generator function and pauses the function while preserving its local state. The next request resumes execution immediately after that `yield`.';
 if(/lazy evaluation/.test(t))return'Lazy evaluation delays producing a value until the program actually requests it. This can reduce memory use and avoid unnecessary work when only part of a sequence is consumed.';
 if(/^decorator$/.test(t))return'A decorator wraps or transforms a function or class so extra behavior can be added without editing every caller. In Python, `@decorator` applies that transformation at definition time.';
 if(/@ syntax/.test(t))return'The `@decorator` syntax applies a decorator to the function or class defined immediately below it. It is shorthand for passing that definition through the decorator and rebinding the name to the returned object.';
 if(/functools wraps/.test(t))return'`functools.wraps(original)` copies important metadata such as the original function’s name and docstring onto a wrapper. It makes decorated functions easier to inspect, document, and debug.';
 if(/^with$/.test(t))return'The `with` statement runs a block under a context manager and guarantees its exit/cleanup step runs when the block finishes. It is ideal for resources that must be released predictably.';
 if(/^__enter__$/.test(raw))return'`__enter__()` is the context-manager method called when a `with` block begins. Its return value becomes the object bound after `as` when one is used.';
 if(/^__exit__$/.test(raw))return'`__exit__()` is the context-manager method called when a `with` block ends, including when the block raises an exception. It performs cleanup and can optionally indicate that an exception was handled.';
 if(/^contextlib$/.test(t))return'`contextlib` provides helpers for building and using context managers without always writing a full class with `__enter__` and `__exit__`.';
 if(/resource cleanup/.test(t))return'Resource cleanup releases things such as files, locks, connections, or temporary state when they are no longer needed. Deterministic cleanup prevents leaks and leaves later operations in a predictable state.';
 if(/type hints/.test(t))return'Type hints annotate the kinds of values a function, variable, or class is expected to use. Python does not normally enforce them at runtime, but editors, type checkers, and readers can use them to catch mistakes and clarify contracts.';
 if(/^dataclass$/.test(t))return'`@dataclass` can generate common methods such as `__init__`, `__repr__`, and equality for classes mainly used to store structured data. You declare fields and let the decorator remove repetitive boilerplate.';
 if(/^optional$/.test(t))return'`Optional[T]` means a value is expected to be either type `T` or `None`. In modern syntax the same idea can be written as `T | None`.';
 if(/^protocol$/.test(t)&&cid==='python')return'A typing `Protocol` defines a structural interface: an object satisfies the protocol when it has the required methods or attributes, even without explicitly inheriting from that protocol.';
 if(/^threading$/.test(t))return'Python threading runs multiple threads within one process. Threads share memory, which is useful for many I/O-bound tasks but requires coordination when they modify shared state.';
 if(/^asyncio$/.test(t))return'`asyncio` provides cooperative asynchronous concurrency using an event loop, coroutines, `async`, and `await`. It is useful when many tasks spend time waiting for I/O rather than continuously using the CPU.';
 if(/^lock$/.test(t))return'A lock allows only one thread or task at a time to enter a protected critical section. It prevents unsafe interleaving when multiple workers modify the same shared state.';
 if(/^decimal$/.test(t))return'`Decimal` represents base-10 decimal numbers with controllable precision, avoiding many binary floating-point surprises for values such as money. Construct it carefully—often from strings—when exact decimal behavior matters.';
 if(/integer cents/.test(t))return'Storing money as integer cents represents the smallest currency unit with whole numbers, so additions and comparisons avoid floating-point rounding error. Display logic converts the integer back to dollars/dirhams and cents.';
 if(/^rounding$/.test(t))return'Rounding maps a more precise number to a chosen number of digits according to a specific rounding rule. Financial and scientific code should choose the rule intentionally rather than assume every environment rounds the same way.';
 if(/^precision$/.test(t))return'Precision describes how many meaningful digits a numeric representation or calculation keeps. More precision can reduce rounding error but may use more memory or computation, depending on the numeric system.';
 if(/^variable$|variables|assignment/.test(t))return'A variable is a name bound to a value or object so the program can use that value later.';
 if(/dynamic typing/.test(t))return'Dynamic typing means a Python variable can be rebound to objects of different types while the program runs.';
 if(/^string$|strings/.test(t))return'A string is an ordered sequence of text characters.';
 if(/^list$|lists/.test(t))return'A list is a mutable ordered collection that can hold multiple Python values.';
 if(/^tuple$|tuples/.test(t))return'A tuple is an ordered collection whose items cannot be replaced, added, or removed after the tuple is created.';
 if(/list comprehension/.test(t))return'A list comprehension is a compact way to build a new list by looping over values and optionally filtering them.';
 if(/^function$|functions/.test(t))return'A function is a reusable block of code that can receive inputs, perform work, and optionally return a result.';
 if(/^parameter$|parameters/.test(t))return'A parameter is a named input in a function definition that receives a value when the function is called.';

 if(/default arguments?/.test(t))return'A default argument gives a parameter a fallback value that is used when the caller omits that argument. It makes common calls shorter while still allowing the caller to override the default when needed.';
 if(/keyword arguments?/.test(t))return'A keyword argument supplies a function input by parameter name, such as `limit=10`. This can make calls clearer and allows optional arguments to be provided without relying only on position.';
 if(/^argument$|^arguments$/.test(t))return'An argument is the actual value supplied to a function when you call it.';
 if(/^return$|return value/.test(t))return'`return` ends a function call and sends a value back to the code that called the function.';
 if(/exception/.test(t))return'An exception is an error or unusual event that interrupts normal execution unless the program handles it.';
 if(/try.*except|error handling/.test(t))return'Error handling lets a program detect expected failures and respond to them instead of crashing unexpectedly.';
 if(/^primary key$/.test(t))return'A primary key uniquely identifies each row in a database table.';
 if(/^foreign key$/.test(t))return'A foreign key stores a reference to a key in another table so related rows can be connected.';
 if(/inner join/.test(t))return'An INNER JOIN returns rows whose join condition matches in both tables.';
 if(/left join/.test(t))return'A LEFT JOIN keeps every row from the left table and adds matching data from the right table when available.';
 if(/group by/.test(t))return'GROUP BY collects rows with the same grouping values so aggregate calculations can be performed per group.';
 if(/^where$|where clause/.test(t))return'WHERE filters rows before they are returned or modified by a SQL statement.';
 if(/order by/.test(t))return'ORDER BY sorts a SQL query result using the specified column or expression.';
 if(/^commit$|git commit/.test(t))return'A Git commit records a snapshot of staged project changes together with a message describing that change.';
 if(/^branch$|git branch/.test(t))return'A Git branch is a movable line of development that lets you work on changes separately from another branch.';
 if(/merge conflict/.test(t))return'A merge conflict occurs when Git cannot automatically combine competing changes and needs you to choose the correct result.';
 if(/environment variables?/.test(t))return'Environment variables are named values provided by the operating system or runtime so programs can read configuration without hard-coding it.';
 if(/http status|404/.test(t))return'An HTTP status code is a numeric result sent with a response to describe what happened to the request.';
 if(/(^| )rest( |$)|endpoint/.test(t))return'An API endpoint is a specific request location and operation that a client can use to interact with a service.';

 if(/tail latency regression/.test(t))return'A tail-latency regression means the slowest portion of requests became slower even if the average still looks acceptable. Compare high percentiles such as p95 or p99 before and after a change to catch that degradation.';
 if(/p50.*p95.*p99|p95|p99|tail latency/.test(t))return'Latency percentiles describe how response times are distributed instead of hiding slow requests inside one average. p50 is the median, while p95 or p99 show the slower tail that a smaller fraction of users experience.';
 if(/latency/.test(t))return'Latency is the time it takes for one operation or request to complete.';
 if(/throughput/.test(t))return'Throughput is how much work a system can complete during a period of time.';

 if(/leader based replication/.test(t))return'Leader-based replication sends writes through one leader replica, which then copies the changes to follower replicas. This simplifies write ordering but makes leader availability and failover important design concerns.';
 if(/leaderless replication/.test(t))return'Leaderless replication allows clients or coordinators to write to multiple replicas without one permanent leader. Reads and writes often use quorum rules to tolerate failures while deciding which version is sufficiently up to date.';
 if(/(^| )synchronous replication( |$)/.test(t))return'Synchronous replication waits for one or more replicas to confirm a write before reporting success. It reduces the chance of acknowledged data being lost, but increases write latency and can reduce availability when replicas are unreachable.';
 if(/asynchronous replication/.test(t))return'Asynchronous replication can acknowledge a write before follower replicas have copied it. This lowers write latency but creates a window where followers are stale and recent acknowledged data may be lost if the source fails before replication finishes.';
 if(/replication/.test(t))return'Replication keeps copies of data or services in multiple places to improve availability, scale, or recovery.';
 if(/load balancer/.test(t))return'A load balancer distributes incoming work across multiple servers or instances.';

 if(/cache invalidation/.test(t))return'Cache invalidation removes or refreshes cached data when the underlying source changes so readers do not keep using an outdated value. The hard part is deciding exactly when and how every relevant cached copy becomes stale.';
 if(/cache stampede/.test(t))return'A cache stampede happens when many requests miss or expire at nearly the same time and all try to recompute or fetch the same expensive value. Techniques such as request coalescing, locks, jittered expiration, or stale-while-revalidate can reduce the surge.';
 if(/cache hit/.test(t))return'A cache hit means the requested data was found in the cache, so the slower backing source does not need to be accessed for that request.';
 if(/cache miss/.test(t))return'A cache miss means the requested data was not available in the cache, so the system must obtain it from a slower backing source and may then store it for future requests.';
 if(/cache/.test(t))return'A cache keeps recently or frequently needed data closer to where it is used so repeated access can be faster.';
 if(/^tensor$|tensors/.test(t))return'A tensor is a multi-dimensional array used to represent numeric data in machine-learning and deep-learning computations.';
 if(/gradient descent/.test(t))return'Gradient descent updates model parameters in a direction that aims to reduce the chosen loss.';
 if(/^embedding$|embeddings/.test(t))return'An embedding represents an item such as text as a numeric vector whose values capture useful relationships.';

 if(/parameter efficient fine tuning|parameter-efficient fine-tuning|peft/.test(t))return'Parameter-efficient fine-tuning adapts a pretrained model by training only a small set of added or selected parameters instead of updating every model weight. Methods such as LoRA reduce memory and compute cost while preserving the original pretrained weights.';
 if(/fine tuning on very few examples|fine-tuning on very few examples/.test(t))return'Fine-tuning on very few examples can make a model memorize the small dataset or overfit its quirks instead of learning a robust task pattern. Use careful validation, conservative training, and comparison with simpler prompting or retrieval approaches before trusting the result.';
 if(/fine tuning|fine-tuning/.test(t))return'Fine-tuning continues training a pretrained model on task-specific data so its behavior better fits that task.';
 if(/tokenization/.test(t))return'Tokenization splits text into the smaller units a language model or text-processing system works with.';
 if(/rate limiting/.test(t))return'Rate limiting restricts how many requests or operations are allowed within a period of time.';
 if(/idempotency key/.test(t))return'An idempotency key is a client-supplied identifier for one logical operation. A server remembers the key so retries can return or reuse the original result instead of performing the side effect a second time.';
 if(/idempotency/.test(t))return'An idempotent operation can be repeated with the same intended effect as performing it once.';
 if(/least privilege/.test(t))return'Least privilege means giving a user or component only the permissions needed for its job and no more.';
 if(/race condition/.test(t))return'A race condition happens when a result depends on the timing or ordering of concurrent operations.';

 if(/structured logging/.test(t))return'Structured logging records events as named fields such as timestamp, request ID, user ID, status, and duration instead of only free-form text. Those fields make logs easier to search, aggregate, correlate, and analyze automatically.';
 if(/logging/.test(t))return'Logging records useful runtime events so you can understand what a program or system did.';

 if(/prediction distribution monitoring/.test(t))return'Prediction-distribution monitoring watches how a model’s output scores, labels, or generated outcomes change over time. A large shift can signal data drift, model degradation, or a product change that needs investigation.';
 if(/feature monitoring/.test(t))return'Feature monitoring watches the inputs a model receives for changes in distribution, missingness, ranges, categories, or data quality. It helps detect when production data no longer resembles the data the model was validated on.';
 if(/monitoring/.test(t))return'Monitoring collects and watches system signals so problems and important changes can be detected.';
 if(/rollback/.test(t))return'A rollback restores a previous known-good version or state after a change causes a problem.';

 /* If no curated definition matched, use the lesson's own explanation when it actually
    discusses the concept. The final fallback is contextual and never the old generic 'key idea' text. */
 return contextualConceptFallback(b,raw);
}
function scenarioText(b,i,total){var c=conceptAt(b,i),o=objectiveAt(b,i),cs=concepts(b);if(i===total-1){var p=pitfallText(b);return p?'Failure case: '+p+' Walk through what goes wrong, then state the guard or design change that prevents it.':'Boundary case: choose an empty, missing, invalid, maximum, or minimum input and explain the correct behavior.';}if(i===total-2)return'Integrated example: imagine a small feature that must '+o.toLowerCase()+'. Use '+c+(cs.length>1?' together with '+cs[(i+1)%cs.length]:'')+' and describe the input, the transformation or decision, and the result.';return'Worked example: apply '+c+' to a new situation where you need to '+o.toLowerCase()+'. State a concrete input, trace what happens, and predict the result before checking it.';}
function scenarioCard(b,i,total){var c=conceptAt(b,i),kind=kindFor(i,total),title=lessonTitle(b.closest('.lesson'))+' — Example '+(i+1)+': '+c;return '<article class="csai-study-example csai-example-card csai-study-scenario" data-language="text" data-reference-only="true" data-title="'+esc(title)+'"><div class="csai-study-example-head"><div><span class="csai-study-number">Example '+(i+1)+' of '+total+'</span><h4>'+esc(c)+'</h4></div><span class="csai-study-kind">'+esc(kind)+'</span></div><div class="csai-study-brief"><b>Definition</b><p>'+esc(conceptDefinition(b,c))+'</p></div></article>';}
function uniqueCodeFor(b,i,source,used){var title=lessonTitle(b.closest('.lesson')),c=conceptAt(b,i),o=objectiveAt(b,i),candidates=[];if(i===0&&source)candidates.push(source);candidates.push(program(c,i+1));candidates.push(program(c,i+5));candidates.push(program(title+' '+c+' '+o,i+9));for(var k=0;k<candidates.length;k++){var code=String(candidates[k]||'').trim();if(!code||/^concept\s*=/.test(code))continue;var sig=structureSignature(code);if(!sig||used[sig])continue;used[sig]=1;return code;}return'';}
function card(b,i,total,code){var c=conceptAt(b,i),kind=kindFor(i,total),title=lessonTitle(b.closest('.lesson'))+' — Example '+(i+1)+': '+c;return '<article class="csai-study-example csai-example-card" data-language="python" data-title="'+esc(title)+'"><div class="csai-study-example-head"><div><span class="csai-study-number">Example '+(i+1)+' of '+total+'</span><h4>'+esc(c)+'</h4></div><span class="csai-study-kind">'+esc(kind)+'</span></div><div class="csai-study-brief"><b>What the program does</b><p>'+esc(programBehavior(code,'python'))+'</p></div><textarea class="csai-study-code" data-editor data-language="python" spellcheck="false">'+esc(code)+'</textarea><div class="csai-example-actions csai-study-actions"><button type="button" class="csai-study-run" data-study-run>▶ Run / Check</button><button type="button" class="csai-study-reset" data-study-reset>Reset</button><button type="button" class="csai-clean-publish" data-final-publish data-final-kind="example">Publish to GitHub</button><button type="button" class="csai-clean-readme" data-final-readme data-final-kind="example">Add a README</button><span class="csai-final-publish-status" data-final-publish-status aria-live="polite"></span></div><div class="csai-study-output" data-study-output>Ready.</div></article>';}

function style(){if(document.getElementById('csai-study-examples-style'))return;var s=document.createElement('style');s.id='csai-study-examples-style';s.textContent='[data-adaptive-lab],[data-evergreen-lab]{display:none!important}.csai-study-scenario-body{padding:14px;border-top:1px solid var(--border);border-bottom:1px solid var(--border);background:var(--bg)}.csai-study-scenario-body p{margin:7px 0 0;line-height:1.65}.csai-study-brief{padding:12px 14px;background:color-mix(in srgb,var(--panel) 78%,#183c31 22%);border-bottom:1px solid var(--border);line-height:1.55}.csai-study-brief b{font-size:.78rem;letter-spacing:.025em}.csai-concept-use-label{display:block;margin-top:10px}.csai-study-brief p{margin:6px 0 0;color:var(--muted)}.csai-study-coverage{margin:-4px 0 12px;padding:8px 10px;border:1px solid var(--border);border-radius:10px;color:var(--muted);font-size:.78rem;font-weight:800}.csai-study-set{margin:18px 0 8px;padding-top:4px}.csai-study-set-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin:0 0 12px}.csai-study-set-head h3{margin:0!important}.csai-study-set-head p{margin:4px 0 0;color:var(--muted);font-size:.88rem}.csai-study-count{padding:5px 9px;border-radius:999px;background:var(--pill);color:var(--pilltext);font-size:.72rem;font-weight:900}.csai-study-list{display:grid;gap:14px}.csai-study-example{overflow:hidden;border:1px solid var(--border);border-radius:14px;background:var(--panel);box-shadow:0 8px 24px rgba(0,0,0,.06);content-visibility:auto;contain-intrinsic-size:620px}.csai-study-example-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:13px 14px;border-bottom:1px solid var(--border)}.csai-study-example-head h4{margin:4px 0 0;font-size:1rem}.csai-study-number{font-size:.72rem;font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}.csai-study-kind{padding:5px 8px;border-radius:999px;background:var(--pill);color:var(--pilltext);font-size:.7rem;font-weight:900}.csai-study-task{margin:0;padding:11px 14px;color:var(--muted);line-height:1.55}.csai-study-code{display:block;width:100%;min-height:155px;resize:vertical;border:0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);outline:0;padding:14px;background:#0b111b;color:#f4f7fb;font:500 13px/1.58 ui-monospace,SFMono-Regular,Consolas,monospace;tab-size:4}.csai-study-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:10px 12px}.csai-study-run,.csai-study-reset{min-height:38px;border-radius:10px;padding:.62rem .9rem;font:850 12px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer}.csai-study-run{border:1px solid #17649a;background:#17649a;color:#fff}.csai-study-reset{border:1px solid var(--border);background:var(--panel);color:var(--text)}.csai-study-run:disabled{opacity:.58;cursor:wait}.csai-study-output{min-height:56px;padding:11px 14px;border-top:1px solid var(--border);background:var(--bg);white-space:pre-wrap;font:500 12.5px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace}.csai-study-explain{padding:11px 14px;border-top:1px solid var(--border);color:var(--muted);font-size:.82rem;line-height:1.55}@media(max-width:640px){.csai-study-set-head,.csai-study-example-head{align-items:flex-start;flex-direction:column}.csai-study-actions>button{flex:1 1 145px}}';document.head.appendChild(s);}
function buildLesson(lesson){var b=body(lesson);if(!b||b.querySelector('[data-study-example-set]'))return;var total=countFor(b),source=sourceExample(b),anchor=hideOriginalExample(b);var set=document.createElement('section');set.className='csai-study-set';set.setAttribute('data-study-example-set','');set.setAttribute('data-study-count',String(total));var cards=[],used={};for(var i=0;i<total;i++){var code=uniqueCodeFor(b,i,source,used);cards.push(code?card(b,i,total,code):scenarioCard(b,i,total));}set.innerHTML='<div class="csai-study-set-head"><div><h3>Study examples</h3><p>Each example must add a new concept, operation, use case, integration, or edge case — changing only a literal value does not count.</p></div><span class="csai-study-count">'+total+' examples</span></div><div class="csai-study-list">'+cards.join('')+'</div>';if(anchor)anchor.insertAdjacentElement('beforebegin',set);else{var mistake=Array.from(b.children).find(function(n){return /common mistake/i.test(n.textContent||'');});if(mistake)b.insertBefore(set,mistake);else b.appendChild(set);}set.querySelectorAll('.csai-study-code').forEach(function(area){area.defaultValue=area.value;});}
/* Course-native example quality layer: keep the lesson's real source example and only generate
   runnable Python where Python is genuinely the teaching language. Other tracks use native
   SQL/web/shell examples or concrete applied scenarios instead of fake Python substitutions. */
function studyCourseId(){
 var n=document.getElementById('course-page-meta');
 try{if(n){var d=JSON.parse(n.textContent||'{}');if(d&&d.id)return String(d.id).toLowerCase();}}catch(e){}
 return String(location.pathname.split('/').pop()||'').replace(/\.html$/,'').toLowerCase();
}
var PYTHON_STUDY_COURSES={
 python:1,dsa:1,oop:1,backend:1,'ai-ml':1,testing:1,apis:1,debugging:1,'problem-solving':1,
 'deep-learning':1,llms:1,rag:1,'ai-agents':1,'data-science':1,'computer-vision':1,nlp:1,
 transformers:1,'generative-ai':1,pytorch:1,tensorflow:1,huggingface:1,mlops:1,'data-engineering':1,
 'ai-system-design':1,'secure-ai-applications':1,'llm-evaluation-testing':1,gans:1,vaes:1,diffusion:1,
 'software-engineering-practice':1,'classical-ai':1,'reinforcement-learning-post-training':1,'large-scale-ai':1,
 'prompt-engineering':1
};
function courseAllowsGeneratedPython(id){return !!PYTHON_STUDY_COURSES[String(id||'').toLowerCase()];}
function inferStudyLanguage(code,pre){
 var c=String(code||'').trim();if(!c)return'text';
 if(pre&&pre.getAttribute&&pre.getAttribute('data-reference-only')==='true')return'text';
 if(/(^|\n)\s*[.#][A-Za-z_-][\w-]*\s*\{|@media\s*\(/.test(c))return'css';
 if(/<\/?[a-z][^>]*>/i.test(c))return'html';
 if(/\b(SELECT\s+|INSERT\s+INTO\s+|UPDATE\s+[A-Za-z_]|DELETE\s+FROM\s+|CREATE\s+TABLE\s+|ALTER\s+TABLE\s+|WITH\s+[A-Za-z_])/i.test(c))return'sql';
 if(/(^|\n)\s*(git\s+|ls\b|cd\s+|pwd\b|mkdir\b|chmod\b|grep\b|find\b|docker\s+|kubectl\s+|npm\s+|pip\s+|curl\s+|ssh\s+)/m.test(c))return'shell';
 if(/#include\s*[<"]|\bstd::|\bcout\s*<<|\bcin\s*>>|\bvector\s*</.test(c))return'cpp';
 if(/\b(console\.log|const\s+|let\s+|function\s+|=>)/.test(c))return'javascript';
 if(pythonLike(c))return'python';
 return'text';
}
function conciseWords(v,max){var ws=String(v||'').replace(/\s+/g,' ').trim().split(' ').filter(Boolean);if(ws.length<=max)return ws.join(' ');return ws.slice(0,max).join(' ').replace(/[,:;\-]+$/,'')+'…';}
function programBehavior(code,lang){
 var c=String(code||'').trim();if(!c)return'This example contains no executable program.';
 lang=lang||inferStudyLanguage(c,null);var compact=c.replace(/\s+/g,' '),m;
 if(lang==='python'){
  if(/address\s*\/\/\s*line_size/.test(c)&&/%\s*sets/.test(c))return'The program maps each address to a set. `// line_size` finds the line number for that address, and `% sets` converts that line number into a set index from `0` to `sets - 1`.';
  if(/print\(\s*[^\n]+\s*==\s*[^\n]+\)/.test(c)&&/print\(\s*[^\n]+\s+is\s+[^\n]+\)/.test(c))return'The program compares value equality with `==` and object identity with `is`, showing that two objects can contain equal values without being the same object.';
  if(/\bb\s*=\s*a\b/.test(c)&&/\bb\.append\s*\(/.test(c)&&/print\(\s*a\s*\)/.test(c))return'The program makes `b` refer to the same list as `a`, changes that shared list through `b`, and then prints `a` to show that both names refer to the same object.';
  if(/alias\s*=\s*original/.test(c)&&/alias\[[^\]]+\]\s*=/.test(c))return'The program makes `alias` refer to the same dictionary as `original`, changes the shared dictionary through `alias`, and prints `original` to show the change.';
  if(/items\s*=\s*\[[^\]]*\]/.test(c)&&/items\.append\s*\(/.test(c))return'The program changes the existing `items` list with `.append()` and prints the mutated list.';
  if(/sys\.getrefcount\s*\(/.test(c))return'The program creates two references to the same object, checks that the object has multiple references, deletes one reference with `del`, and checks again.';
  if(/\.strip\s*\(\)/.test(c)&&/\.lower\s*\(\)/.test(c)&&/\.endswith\s*\(/.test(c))return'The program removes whitespace from both ends of the text with `.strip()`, converts the letters to lowercase with `.lower()`, and checks the ending with `.endswith()`.';
  if(/\.strip\s*\(\)/.test(c)&&/\.lower\s*\(\)/.test(c))return'The program removes whitespace from both ends of the text with `.strip()` and converts the letters to lowercase with `.lower()`.';
  if((m=c.match(/(["'][^"']*["'])\.join\s*\(([^\n)]+)\)/)))return'The program combines the strings in '+m[2].trim()+' into one string, placing '+m[1]+' between them with `.join()`.';
  if(/\.join\s*\(/.test(c))return'The program combines multiple strings into one string with the separator written before `.join()`.';
  if(/\.split\s*\(/.test(c)&&/for\s+.+\s+in\s+/.test(c))return'The program splits the text with `.split()` and loops through the pieces produced by that split.';
  var fors=Array.from(c.matchAll(/^(\s*)for\s+.+$/gm));if(fors.length>=2&&fors.some(function(x,i){return i>0&&x[1].length>fors[0][1].length;})){
   if(/pairs\s*\+=\s*1/.test(c))return'The program first loops through the values once, then uses nested loops and increases `pairs` by 1 for every pair of values.';
   return'The program uses a loop inside another loop to repeat the statements written inside the nested loop for each combination reached by the code.';
  }
  if(/sorted\s*\(\s*set\s*\(/.test(c))return'The program removes duplicate values with `set()` and sorts the remaining values with `sorted()`.';
  if(/\.get\s*\([^\n]*\)\s*\+\s*1/.test(c))return'The program reads the current dictionary count with `.get()`, adds 1, and stores the updated count for each item.';
  if(/\.append\s*\(/.test(c)&&/for\s+/.test(c))return'The program loops through the shown values and adds items to a list with `.append()` where the code tells it to.';
  if((m=c.match(/^def\s+([A-Za-z_]\w*)\s*\(/m))){return'The program defines a function named `'+m[1]+'()` and executes the statements written in that function when the code calls it.';}
  if(/while\s+.+:/.test(c)&&/\/\/=\s*2|\/\s*2/.test(c))return'The program repeatedly reduces the value by half inside a `while` loop and counts how many repetitions occur.';
  if(/for\s+.+\s+in\s+/.test(c)&&/\+=/.test(c))return'The program loops through the shown values and updates the running value with `+=` during each iteration.';
  if(/\[[^\]]+\s+for\s+.+\s+in\s+.+\]/.test(c))return'The program builds a new list with the list comprehension written in the code.';
 }
 if(lang==='sql'){
  var ops=[];if(/\bSELECT\b/i.test(c))ops.push('selects the requested columns');if(/\bJOIN\b/i.test(c))ops.push('joins related rows');if(/\bWHERE\b/i.test(c))ops.push('filters rows');if(/\bGROUP\s+BY\b/i.test(c))ops.push('groups rows');if(/\bORDER\s+BY\b/i.test(c))ops.push('sorts the result');if(/\bROW_NUMBER\s*\(/i.test(c))ops.push('numbers rows inside each window');if(ops.length)return'The query '+ops.slice(0,4).join(', ').replace(/, ([^,]*)$/,', and $1')+'.';
 }
 if(lang==='javascript'||lang==='typescript'){
  if(/\.filter\s*\(/.test(c))return'The program filters the array with `.filter()` and keeps only the items that satisfy the condition written inside it.';
  if(/\.reduce\s*\(/.test(c))return'The program combines the array values with `.reduce()` using the callback written inside it.';
  if(/addEventListener\s*\(/.test(c))return'The program registers the shown event with `addEventListener()` and runs its handler when that event occurs.';
 }
 if(lang==='cpp'){
  if(/std::sort\s*\(/.test(c))return'The program sorts the range passed to `std::sort()`.';
  if(/std::queue|std::deque|std::stack/.test(c))return'The program creates the C++ container shown in the code and performs the container operations written on it.';
 }
 if(lang==='shell'){
  var cmds=c.split(/\r?\n/).map(function(x){return x.trim().split(/\s+/)[0];}).filter(Boolean);var uniq=[];cmds.forEach(function(x){if(uniq.indexOf(x)<0)uniq.push(x);});return'The example runs the shown '+uniq.slice(0,3).map(function(x){return'`'+x+'`';}).join(', ')+' command'+(uniq.length>1?'s':'')+' in order.';
 }
 if(lang==='html')return'The example creates the HTML elements written below and uses their attributes and text to build the shown page structure.';
 if(lang==='css')return'The example applies the CSS properties written below to the matching elements, changing only the layout or styling specified by those rules.';
 if(/^(FROM|WORKDIR|COPY|RUN|CMD|ENTRYPOINT|EXPOSE|ENV|ARG)\b/m.test(c))return'The example builds or configures a container using only the Dockerfile instructions written below.';
 if(lang==='yaml'||/^\s*[\w.-]+:\s*/m.test(c))return'The example defines the configuration fields and values written below; indentation shows which settings belong together.';
 try{
  if(window.CSAILineExplainer&&typeof window.CSAILineExplainer.explain==='function'){
   var rows=window.CSAILineExplainer.explain(c,lang).filter(function(r){var q=String(r.code||'').trim();return q&&!/^(#|\/\/)/.test(q)&&!/blank line/i.test(r.purpose||'');});
   var scored=rows.map(function(r,i){var q=String(r.code||''),p=String(r.purpose||''),score=0;if(/\.strip\(|\.join\(|\.split\(|\.append\(|\.get\(|\.filter\(|\.reduce\(/.test(q))score+=8;if(/^\s*(for|while|if|SELECT|UPDATE|INSERT|DELETE)\b/i.test(q))score+=6;if(/print\(|console\.log|cout|return\b|ORDER BY|GROUP BY|JOIN\b/i.test(q))score+=4;if(/import|include/i.test(p))score-=5;return{r:r,i:i,score:score};}).sort(function(a,b){return b.score-a.score||a.i-b.i;}).slice(0,2).sort(function(a,b){return a.i-b.i;});
   var summary=scored.map(function(x){return x.r.purpose;}).join(' ');if(summary)return conciseWords(summary,44);
  }
 }catch(e){}
 return'The example follows only the statements written in the code block above.';
}
function sourceRecord(b){
 var h=Array.from(b.querySelectorAll('h3')).find(function(x){return /^examples?$/i.test(String(x.textContent||'').trim());});
 if(!h)return null;
 var host=h.nextElementSibling;if(!host)return null;
 var pre=host.matches&&host.matches('pre,code,textarea')?host:(host.querySelector&&host.querySelector('textarea,pre code,pre'));
 var code=String(pre&&(pre.value||pre.textContent)||'').trim();
 return{heading:h,host:host,pre:pre,code:code,language:inferStudyLanguage(code,pre)};
}
function sourceStudyCard(b,total,src){
 if(!src||!src.host)return null;
 src.heading.hidden=true;src.heading.setAttribute('data-study-source-heading','1');
 src.host.hidden=false;src.host.removeAttribute('hidden');src.host.removeAttribute('data-study-source-hidden');
 var c=conceptAt(b,0),article=document.createElement('article');
 article.className='csai-study-example csai-example-card csai-study-source';
 article.setAttribute('data-language',src.language||'text');
 article.setAttribute('data-title',lessonTitle(b.closest('.lesson'))+' — Example 1: '+c);
 article.innerHTML='<div class="csai-study-example-head"><div><span class="csai-study-number">Example 1 of '+total+'</span><h4>'+esc(c)+'</h4></div><span class="csai-study-kind">Course-native example</span></div><div class="csai-study-brief"><b>What the program does</b><p>'+esc(programBehavior(src.code,src.language||'text'))+'</p></div>';
 article.appendChild(src.host);
 return article;
}
function cppNativeProgram(topic,seed){
 var t=norm(topic),m=seed%4;
 function wrap(body,incs){return (incs||'#include <iostream>')+'\nusing namespace std;\n\n'+body;}
 if(/binary search|lower bound|upper bound/.test(t)){var a=['1, 3, 5, 7, 9','2, 4, 6, 8, 10','1, 2, 2, 2, 4','5, 10, 15, 20, 25'][m];return{language:'cpp',code:wrap('int main() {\n    vector<int> values{'+a+'};\n    auto it = lower_bound(values.begin(), values.end(), '+[6,7,2,16][m]+');\n    cout << (it - values.begin()) << "\\n";\n    return 0;\n}','#include <iostream>\n#include <algorithm>\n#include <vector>')};}
 if(/hash|unordered/.test(t)){return{language:'cpp',code:wrap('int main() {\n    unordered_map<string, int> counts;\n\n    for (string item : {"a", "b", "a", "c"}) {\n        ++counts[item];\n    }\n\n    cout << counts["a"] << "\\n";\n    return 0;\n}','#include <iostream>\n#include <string>\n#include <unordered_map>')};}
 if(/linked/.test(t)){return{language:'cpp',code:wrap('struct Node {\n    int value;\n    unique_ptr<Node> next;\n\n    explicit Node(int value) : value(value) {}\n};\n\nint main() {\n    auto head = make_unique<Node>('+[1,10,4,7][m]+');\n    head->next = make_unique<Node>('+[2,20,8,9][m]+');\n\n    for (Node* current = head.get(); current; current = current->next.get()) {\n        cout << current->value << " ";\n    }\n\n    return 0;\n}','#include <iostream>\n#include <memory>')};}
 if(/stack|queue|deque/.test(t)){return{language:'cpp',code:wrap('int main() {\n    deque<int> values{1, 2, 3};\n    values.push_front('+[0,5,8,9][m]+');\n    values.push_back(4);\n\n    cout << values.front() << " " << values.back() << "\\n";\n    return 0;\n}','#include <iostream>\n#include <deque>')};}
 if(/tree|bst|travers/.test(t)){return{language:'cpp',code:wrap('struct Node {\n    int value;\n    Node* left = nullptr;\n    Node* right = nullptr;\n};\n\nvoid preorder(Node* node) {\n    if (!node) {\n        return;\n    }\n\n    cout << node->value << " ";\n    preorder(node->left);\n    preorder(node->right);\n}\n\nint main() {\n    Node root{2};\n    Node left{1};\n    Node right{3};\n    root.left = &left;\n    root.right = &right;\n\n    preorder(&root);\n    return 0;\n}')};}
 if(/heap|priority/.test(t)){return{language:'cpp',code:wrap('int main() {\n    priority_queue<int> values;\n\n    for (int value : {'+['3, 1, 7','9, 2, 4','5, 8, 1','6, 0, 2'][m]+'}) {\n        values.push(value);\n    }\n\n    while (!values.empty()) {\n        cout << values.top() << " ";\n        values.pop();\n    }\n\n    return 0;\n}','#include <iostream>\n#include <queue>\n#include <vector>')};}
 if(/graph|bfs|dfs|topological|shortest|dijkstra|disjoint|mst/.test(t)){return{language:'cpp',code:wrap('int main() {\n    vector<vector<int>> graph{{1, 2}, {3}, {3}, {}};\n    queue<int> pending;\n    vector<int> seen(4);\n\n    pending.push(0);\n    seen[0] = 1;\n\n    while (!pending.empty()) {\n        int node = pending.front();\n        pending.pop();\n        cout << node << " ";\n\n        for (int next : graph[node]) {\n            if (!seen[next]) {\n                seen[next] = 1;\n                pending.push(next);\n            }\n        }\n    }\n\n    return 0;\n}','#include <iostream>\n#include <queue>\n#include <vector>')};}
 if(/sort|partition/.test(t)){return{language:'cpp',code:wrap('int main() {\n    vector<int> values{'+['4, 1, 3, 2','8, 5, 2, 9','7, 7, 1, 0','6, 3, 9, 2'][m]+'};\n    sort(values.begin(), values.end());\n\n    for (int value : values) {\n        cout << value << " ";\n    }\n\n    return 0;\n}','#include <iostream>\n#include <algorithm>\n#include <vector>')};}
 if(/two pointers|sliding|prefix/.test(t)){return{language:'cpp',code:wrap('int main() {\n    vector<int> values{1, 2, 3, 4, 5};\n    int sum = 0;\n\n    for (int i = '+m+'; i < static_cast<int>(values.size()); ++i) {\n        sum += values[i];\n    }\n\n    cout << sum << "\\n";\n    return 0;\n}','#include <iostream>\n#include <vector>')};}
 if(/backtrack|recurs|dynamic programming|greedy|interval/.test(t)){return{language:'cpp',code:wrap('int main() {\n    vector<int> dp('+(5+m)+', 1);\n\n    for (int i = 1; i < static_cast<int>(dp.size()); ++i) {\n        dp[i] = dp[i - 1] + i;\n    }\n\n    cout << dp.back() << "\\n";\n    return 0;\n}','#include <iostream>\n#include <vector>')};}
 if(/class|inherit|polymorph|constructor|destructor|operator overload|const method|static member/.test(t)){return{language:'cpp',code:wrap('class Box {\nprivate:\n    int value_;\n\npublic:\n    explicit Box(int value) : value_(value) {}\n\n    int value() const {\n        return value_;\n    }\n\n    void add(int amount) {\n        value_ += amount;\n    }\n};\n\nint main() {\n    Box box('+(2+m)+');\n    box.add('+(3+m)+');\n    cout << box.value() << "\\n";\n    return 0;\n}','#include <iostream>')};}
 if(/pointer|memory|raii|smart pointer|move|copy/.test(t)){return{language:'cpp',code:wrap('int main() {\n    auto first = make_unique<int>('+(40+m)+');\n    auto second = move(first);\n\n    cout << *second << "\\n";\n    return 0;\n}','#include <iostream>\n#include <memory>\n#include <utility>')};}
 if(/vector|array|string|container|iterator|algorithm|lambda|template/.test(t)){return{language:'cpp',code:wrap('int main() {\n    vector<int> values{1, 2, 3, '+(4+m)+'};\n\n    for_each(values.begin(), values.end(), [](int value) {\n        cout << value * value << " ";\n    });\n\n    return 0;\n}','#include <iostream>\n#include <algorithm>\n#include <vector>')};}
 if(/file|exception/.test(t)){return{language:'cpp',code:wrap('int safeSquare(int value) {\n    if (value < 0) {\n        throw invalid_argument("negative");\n    }\n\n    return value * value;\n}\n\nint main() {\n    try {\n        cout << safeSquare('+(m-1)+') << "\\n";\n    } catch (const exception& error) {\n        cout << error.what() << "\\n";\n    }\n\n    return 0;\n}','#include <iostream>\n#include <stdexcept>')};}
 return{language:'cpp',code:wrap('int main() {\n    int value = '+(5+m)+';\n\n    if (value % 2 == 0) {\n        cout << "even\\n";\n    } else {\n        cout << "odd\\n";\n    }\n\n    return 0;\n}')};
}

function legacyNativeExampleFor(course,topic,seed){
 var t=norm(topic),mode=seed%4;
 if(course==='cpp-dsa')return cppNativeProgram(topic,seed);
 if(course==='sql'||course==='databases'){
  if(mode===0)return{language:'sql',code:'SELECT name, age\nFROM students\nWHERE age >= 18\nORDER BY age DESC;'};
  if(mode===1)return{language:'sql',code:'SELECT country, COUNT(*) AS customer_count\nFROM customers\nGROUP BY country\nORDER BY customer_count DESC;'};
  if(mode===2)return{language:'sql',code:'SELECT c.name, o.item, o.total\nFROM customers AS c\nJOIN orders AS o ON o.customer_id = c.id\nORDER BY o.total DESC;'};
  return{language:'sql',code:'WITH ranked AS (\n  SELECT category, price,\n         ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rn\n  FROM products\n)\nSELECT category, price\nFROM ranked\nWHERE rn = 1;'};
 }
 if(course==='web-dev'||course==='frontend-dev'){
  if(/css|style|layout|flex|grid|responsive/.test(t)){
   if(mode%2===0)return{language:'css',code:'.card {\n  display: grid;\n  gap: 1rem;\n  padding: 1rem;\n}\n@media (max-width: 640px) {\n  .card { grid-template-columns: 1fr; }\n}'};
   return{language:'css',code:'.button {\n  padding: .75rem 1rem;\n  border-radius: .5rem;\n}\n.button:focus-visible {\n  outline: 3px solid currentColor;\n  outline-offset: 2px;\n}'};
  }
  if(/javascript|event|dom|async|fetch|promise/.test(t)){
   if(mode%2===0)return{language:'javascript',code:'const tasks = ["learn", "practice", "build"];\nconst completed = tasks.filter(task => task !== "practice");\nconsole.log(completed);'};
   return{language:'html',code:'<button id="save">Save</button>\n<p id="status">Not saved</p>\n<script>\n  document.querySelector("#save").addEventListener("click", () => {\n    document.querySelector("#status").textContent = "Saved";\n  });\n<\/script>'};
  }
  if(mode===0)return{language:'html',code:'<main>\n  <h1>Course dashboard</h1>\n  <section aria-labelledby="progress-title">\n    <h2 id="progress-title">Progress</h2>\n    <p>3 of 5 lessons complete</p>\n  </section>\n</main>'};
  if(mode===1)return{language:'html',code:'<form>\n  <label for="email">Email</label>\n  <input id="email" name="email" type="email" required>\n  <button type="submit">Join</button>\n</form>'};
  if(mode===2)return{language:'javascript',code:'const scores = [72, 88, 91];\nconst average = scores.reduce((sum, score) => sum + score, 0) / scores.length;\nconsole.log(`Average: ${average}`);'};
  return{language:'html',code:'<nav aria-label="Main navigation">\n  <a href="#learn">Learn</a>\n  <a href="#practice">Practice</a>\n  <a href="#build">Build</a>\n</nav>'};
 }
 if(course==='git'){
  if(mode===0)return{language:'shell',code:'git status\ngit add src/app.py\ngit commit -m "Add input validation"'};
  if(mode===1)return{language:'shell',code:'git switch -c feature/readme\ngit log --oneline --decorate -5\ngit switch main\ngit merge feature/readme'};
  if(mode===2)return{language:'shell',code:'git diff\ngit diff --staged\ngit show HEAD'};
  return{language:'shell',code:'git log --oneline --graph --all\ngit revert <commit-sha>\ngit status'};
 }
 if(course==='linux'){
  if(mode===0)return{language:'shell',code:'pwd\nls -lah\ncd projects'};
  if(mode===1)return{language:'shell',code:'grep -i "error" app.log | sort | uniq -c'};
  if(mode===2)return{language:'shell',code:'find . -type f -name "*.py"\nchmod u+x script.sh'};
  return{language:'shell',code:'ps aux | grep python\nkill <pid>\ntail -f app.log'};
 }
 if(course==='docker'){
  if(mode===0)return{language:'shell',code:'docker build -t csai-app .\ndocker run --rm -p 8080:8080 csai-app'};
  if(mode===1)return{language:'text',code:'FROM python:3.12-slim\nWORKDIR /app\nCOPY . .\nCMD ["python", "app.py"]'};
  if(mode===2)return{language:'shell',code:'docker ps\ndocker logs <container>\ndocker exec -it <container> sh'};
  return{language:'text',code:'services:\n  web:\n    build: .\n    ports:\n      - "8080:8080"'};
 }
 if(course==='kubernetes'){
  if(mode===0)return{language:'shell',code:'kubectl get pods\nkubectl describe pod <pod-name>\nkubectl logs <pod-name>'};
  if(mode===1)return{language:'shell',code:'kubectl apply -f deployment.yaml\nkubectl rollout status deployment/app'};
  if(mode===2)return{language:'shell',code:'kubectl get services\nkubectl get endpoints\nkubectl port-forward service/app 8080:80'};
  return{language:'text',code:'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: app-config\ndata:\n  LOG_LEVEL: "info"'};
 }
 if(course==='cicd'){
  if(mode===0)return{language:'text',code:'name: test\non: [push]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm test'};
  if(mode===1)return{language:'shell',code:'npm ci\nnpm test\nnpm run build'};
  return null;
 }
 if(course==='cloud-computing'||course==='deployment'||course==='observability'){
  if(mode===0)return{language:'shell',code:'curl -fsS http://localhost:8080/health'};
  if(mode===1)return{language:'shell',code:'tail -n 100 app.log | grep -i error'};
  return null;
 }
 if(course==='networking'){
  if(mode===0)return{language:'shell',code:'ping -n 4 example.com'};
  if(mode===1)return{language:'shell',code:'curl -I https://example.com'};
  return null;
 }
 return null;
}
function nativeCodeCard(b,i,total,entry){
 var c=conceptAt(b,i),kind=kindFor(i,total),title=lessonTitle(b.closest('.lesson'))+' — Example '+(i+1)+': '+c,lang=entry.language||'text';
 if(lang==='cpp')return '<article class="csai-study-example csai-example-card csai-study-native" data-language="cpp" data-title="'+esc(title)+'"><div class="csai-study-example-head"><div><span class="csai-study-number">Example '+(i+1)+' of '+total+'</span><h4>'+esc(c)+'</h4></div><span class="csai-study-kind">'+esc(kind)+'</span></div><p class="description csai-study-task">'+esc(taskFor(b,i,total))+'</p><textarea class="csai-study-code" data-editor data-language="cpp" spellcheck="false">'+esc(entry.code||'')+'</textarea><div class="csai-example-actions csai-study-actions"><button type="button" class="csai-study-run" data-study-run>▶ Run / Check</button><button type="button" class="csai-study-reset" data-study-reset>Reset</button><button type="button" class="csai-clean-publish" data-final-publish data-final-kind="example">Publish to GitHub</button><button type="button" class="csai-clean-readme" data-final-readme data-final-kind="example">Add a README</button><span class="csai-final-publish-status" data-final-publish-status aria-live="polite"></span></div><div class="csai-study-output" data-study-output>Ready.</div></article>';
 return '<article class="csai-study-example csai-example-card csai-study-native" data-language="'+esc(lang)+'" data-title="'+esc(title)+'"><div class="csai-study-example-head"><div><span class="csai-study-number">Example '+(i+1)+' of '+total+'</span><h4>'+esc(c)+'</h4></div><span class="csai-study-kind">'+esc(kind)+'</span></div><p class="description csai-study-task">'+esc(taskFor(b,i,total))+'</p><pre class="code" data-example-audit="candidate">'+esc(entry.code||'')+'</pre></article>';
}
function explanationFact(b){
 var box=b.querySelector('.lesson-main-explanation');if(!box)return'';
 var ps=Array.from(box.querySelectorAll('p')).map(function(p){return String(p.textContent||'').replace(/\s+/g,' ').trim();}).filter(function(x){return x.length>45;});
 return ps[0]||'';
}
function appliedScenarioText(b,i,total){
 var c=conceptAt(b,i),o=objectiveAt(b,i),fact=explanationFact(b),title=lessonTitle(b.closest('.lesson'));
 if(i===total-1){var p=pitfallText(b);return'Edge case for '+title+': '+(p||'Use an empty, missing, invalid, maximum, or minimum input.')+' State what fails, what evidence reveals the failure, and the specific guard or design change that fixes it.';}
 if(i===total-2)return'Integration case for '+title+': the task is to '+o.toLowerCase()+'. Combine '+c+' with '+(concepts(b)[1]||'the lesson\'s second key idea')+'. Trace the starting state, the action taken, and the expected result so the connection between the two ideas is explicit.';
 if(i===1)return'Applied use case for '+title+': '+(fact||('the goal is to '+o.toLowerCase()+'.'))+' Use '+c+' in a different situation from the course-native example, and identify the concrete result that would prove it worked.';
 if(i===2)return'Different operation for '+title+': start from the same lesson goal, but use '+c+' to make a different decision or transformation. Explain the input/state before the operation, the operation itself, and the output/state afterward.';
 return'Concept-transfer case for '+title+': a small project needs to '+o.toLowerCase()+'. Apply '+c+', predict the outcome before checking it, and name one observation that would show the approach is wrong.';
}
function appliedScenarioCard(b,i,total){
 var c=conceptAt(b,i),kind=kindFor(i,total),title=lessonTitle(b.closest('.lesson'))+' — Example '+(i+1)+': '+c;
 return '<article class="csai-study-example csai-example-card csai-study-scenario" data-language="text" data-reference-only="true" data-title="'+esc(title)+'"><div class="csai-study-example-head"><div><span class="csai-study-number">Example '+(i+1)+' of '+total+'</span><h4>'+esc(c)+'</h4></div><span class="csai-study-kind">'+esc(kind)+'</span></div><div class="csai-study-brief"><b>Definition</b><p>'+esc(conceptDefinition(b,c))+'</p></div></article>';
}
/* Override the earlier builder with a course-native version. The old functions remain above only so
   older verification hooks and migrations can still recognize the asset safely. */
/* v5.44 comprehensive concept-example coverage.
   Every key concept receives its own distinct example card. Course-native examples are preserved
   when they add a genuinely different structure. Big-O has a curated ladder for every major growth
   rate plus space complexity and case analysis. */
function isCodeHost(n){
 if(!n||!n.matches)return false;
 return n.matches('pre.code,pre,textarea,.lesson-run-card,.csai-example,.csai-example-card') || !!(n.querySelector&&n.querySelector('textarea,pre code,pre'));
}
function codeFromHost(host){
 if(!host)return{pre:null,code:'',language:'text'};
 var pre=host.matches&&host.matches('pre,code,textarea')?host:(host.querySelector&&host.querySelector('textarea,pre code,pre'));
 var code=String(pre&&(pre.value||pre.textContent)||'').trim();
 return{pre:pre,code:code,language:inferStudyLanguage(code,pre)};
}
function sourceRecords(b){
 var h=Array.from(b.querySelectorAll('h3')).find(function(x){return /^examples?$/i.test(String(x.textContent||'').trim());});
 if(!h)return{heading:null,records:[]};
 var records=[],n=h.nextElementSibling;
 while(n&&isCodeHost(n)){
  var info=codeFromHost(n);records.push({heading:h,host:n,pre:info.pre,code:info.code,language:info.language});n=n.nextElementSibling;
 }
 if(!records.length){
  var first=h.nextElementSibling;if(first){var info2=codeFromHost(first);if(info2.code)records.push({heading:h,host:first,pre:info2.pre,code:info2.code,language:info2.language});}
 }
 return{heading:h,records:records};
}
function hideSourceRecords(group){
 if(group.heading){group.heading.hidden=true;group.heading.setAttribute('data-study-source-heading','1');}
 group.records.forEach(function(r){if(r.host){r.host.hidden=true;r.host.setAttribute('data-study-source-hidden','1');}});
}
function nativeSourceCard(b,index,total,src,label){
 if(!src||!src.host)return null;
 src.host.hidden=false;src.host.removeAttribute('hidden');src.host.removeAttribute('data-study-source-hidden');
 var article=document.createElement('article');
 article.className='csai-study-example csai-example-card csai-study-source';
 article.setAttribute('data-language',src.language||'text');
 article.setAttribute('data-title',lessonTitle(b.closest('.lesson'))+' — Course-native example '+(index+1));
 article.innerHTML='<div class="csai-study-example-head"><div><span class="csai-study-number">Example '+(index+1)+' of '+total+'</span><h4>'+esc(label||'Course-native example')+'</h4></div><span class="csai-study-kind">Course-native example</span></div>'+
  '<div class="csai-study-brief"><b>What the program does</b><p>'+esc(programBehavior(src.code,src.language||'text'))+'</p></div>';
 article.appendChild(src.host);
 return article;
}
function conceptBehavior(c){
 var t=norm(c);
 if(/time complexity/.test(t))return'Compare how the amount of work changes when the input becomes larger.';
 if(/space complexity/.test(t))return'Compare how much extra memory the approach needs as the input becomes larger.';
 if(/growth rate|big o/.test(t))return'Focus on the shape of growth rather than exact milliseconds or machine speed.';
 if(/best.*average.*worst|worst.*case|best.*case|average.*case/.test(t))return'Use inputs that make the same algorithm finish early, do typical work, or do the maximum work.';
 if(/array|list|vector/.test(t))return'Use a sequence of values and focus on the cost or behavior of accessing, scanning, inserting, or removing items.';
 if(/linked/.test(t))return'Follow links between nodes and observe which operations require traversal and which only change nearby links.';
 if((cid==='dsa'||cid==='cpp-dsa')&&/(^| )stack( |$)/.test(t))return'Add and remove items from the same end so the most recently added item is handled first.';
 if(/queue|deque/.test(t))return'Add items at one end and process the oldest waiting item first.';
 if(/binary search/.test(t))return'Repeatedly discard half of a sorted search range until the target is found or the range is empty.';
 if(/hash|set|dictionary|map/.test(t))return'Remember previously seen keys so membership or lookup does not require scanning the whole collection each time.';
 if(/sort/.test(t))return'Rearrange items into order and observe how the chosen method changes the amount of work.';
 if(/graph|bfs|dfs/.test(t))return'Represent connections and visit reachable items while preventing unnecessary repeated visits.';
 if(/tree|bst/.test(t))return'Follow parent/child relationships and trace how the chosen traversal or ordering rule changes the visit sequence.';
 if(/recurs/.test(t))return'Reduce the problem to a smaller version until a stopping case is reached, then combine the returned results.';
 if((cid==='dsa'||cid==='cpp-dsa'||cid==='classical-ai')&&/dynamic programming|memo|tabulation/.test(t))return'Reuse answers to overlapping smaller problems instead of recalculating the same work.';
 if((cid==='dsa'||cid==='cpp-dsa'||cid==='classical-ai')&&/greedy/.test(t))return'Make the best local choice allowed by the rule and check whether that rule leads to a valid overall result.';
 if(/sql|join|group by|window|query/.test(t))return'Use a small table-shaped example and focus on what rows are selected, combined, grouped, or ranked.';
 if(/class|object|inherit|encaps|polymorph/.test(t))return'Use a small object example and focus on which data and behavior belong together and how responsibilities are separated.';
 if(/model|regression|classification|gradient|neural|embedding|transformer|llm|rag|agent/.test(t))return'Use a small realistic AI example and identify the input, transformation or decision, and measurable output.';
 return'Use this idea in a small new situation, predict the result first, and explain what changed from the starting state to the ending state.';
}
function studyBrief(extra){return '<div class="csai-study-brief"><b>What the program does</b><p>'+esc(extra)+'</p></div>';}
function conceptCodeBrief(b,label,extra){return '<div class="csai-study-brief csai-concept-brief"><b>Definition</b><p>'+esc(conceptDefinition(b,label))+'</p><b class="csai-concept-use-label">Practical example</b><p>'+esc(extra)+'</p></div>';}
function pythonConceptCard(b,index,total,label,code,kind){
 var title=lessonTitle(b.closest('.lesson'))+' — '+label;
 return '<article class="csai-study-example csai-example-card" data-language="python" data-title="'+esc(title)+'"><div class="csai-study-example-head"><div><span class="csai-study-number">Example '+(index+1)+' of '+total+'</span><h4>'+esc(label)+'</h4></div><span class="csai-study-kind">'+esc(kind||'Concept example')+'</span></div>'+studyBrief(programBehavior(code,'python'))+'<textarea class="csai-study-code" data-editor data-language="python" spellcheck="false">'+esc(code)+'</textarea><div class="csai-example-actions csai-study-actions"><button type="button" class="csai-study-run" data-study-run>▶ Run / Check</button><button type="button" class="csai-study-reset" data-study-reset>Reset</button><button type="button" class="csai-clean-publish" data-final-publish data-final-kind="example">Publish to GitHub</button><button type="button" class="csai-clean-readme" data-final-readme data-final-kind="example">Add a README</button><span class="csai-final-publish-status" data-final-publish-status aria-live="polite"></span></div><div class="csai-study-output" data-study-output>Ready.</div></article>';
}
function nativeConceptCard(b,index,total,label,entry,kind){
 var title=lessonTitle(b.closest('.lesson'))+' — '+label,lang=entry.language||'text';
 var brief=studyBrief(programBehavior(code,'python'));
 if(lang==='cpp')return '<article class="csai-study-example csai-example-card csai-study-native" data-language="cpp" data-title="'+esc(title)+'"><div class="csai-study-example-head"><div><span class="csai-study-number">Example '+(index+1)+' of '+total+'</span><h4>'+esc(label)+'</h4></div><span class="csai-study-kind">'+esc(kind||'Concept example')+'</span></div>'+brief+'<textarea class="csai-study-code" data-editor data-language="cpp" spellcheck="false">'+esc(entry.code||'')+'</textarea><div class="csai-example-actions csai-study-actions"><button type="button" class="csai-study-run" data-study-run>▶ Run / Check</button><button type="button" class="csai-study-reset" data-study-reset>Reset</button><button type="button" class="csai-clean-publish" data-final-publish data-final-kind="example">Publish to GitHub</button><button type="button" class="csai-clean-readme" data-final-readme data-final-kind="example">Add a README</button><span class="csai-final-publish-status" data-final-publish-status aria-live="polite"></span></div><div class="csai-study-output" data-study-output>Ready.</div></article>';
 return '<article class="csai-study-example csai-example-card csai-study-native" data-language="'+esc(lang)+'" data-title="'+esc(title)+'"><div class="csai-study-example-head"><div><span class="csai-study-number">Example '+(index+1)+' of '+total+'</span><h4>'+esc(label)+'</h4></div><span class="csai-study-kind">'+esc(kind||'Concept example')+'</span></div>'+brief+'<pre class="code" data-example-audit="candidate">'+esc(entry.code||'')+'</pre></article>';
}
function conceptScenarioCard(b,index,total,label,kind){
 var title=lessonTitle(b.closest('.lesson'))+' — '+label;
 return '<article class="csai-study-example csai-example-card csai-study-scenario" data-language="text" data-reference-only="true" data-concept-example="true" data-concept-name="'+esc(label)+'" data-title="'+esc(title)+'"><div class="csai-study-example-head"><div><span class="csai-study-number">Example '+(index+1)+' of '+total+'</span><h4>'+esc(label)+'</h4></div><span class="csai-study-kind">'+esc(kind||'Concept')+'</span></div><div class="csai-study-brief"><b>Definition</b><p>'+esc(conceptDefinition(b,label))+'</p></div></article>';
}
function bigOPlan(){return[
 {label:'time complexity',kind:'Key-idea example',code:`def scan_steps(values):
    steps = 0
    for _ in values:
        steps += 1
    return steps

small = list(range(5))
large = list(range(10))
print("5 items ->", scan_steps(small), "steps")
print("10 items ->", scan_steps(large), "steps")`},
 {label:'space complexity',kind:'Key-idea example',code:`scores = [72, 81, 90, 66, 88]
copied_scores = []

for score in scores:
    copied_scores.append(score)

print("input items:", len(scores))
print("extra stored items:", len(copied_scores))`},
 {label:'growth rate',kind:'Key-idea example',code:`sizes = [2, 4, 8, 16]

for n in sizes:
    linear = n
    quadratic = n * n
    print(n, "-> linear:", linear, "quadratic:", quadratic)`},
 {label:'Big-O',kind:'Key-idea example',code:`def measured_work(n):
    return 3 * n + 2

for n in [10, 100, 1000]:
    exact = measured_work(n)
    dominant = n
    print("n:", n, "exact:", exact, "dominant-growth model:", dominant)`},
 {label:'best / average / worst case',kind:'Key-idea example',code:`def find_with_steps(values, target):
    steps = 0
    for value in values:
        steps += 1
        if value == target:
            return steps
    return steps

values = [10, 20, 30, 40, 50]
print("best:", find_with_steps(values, 10))
print("middle-like:", find_with_steps(values, 30))
print("worst:", find_with_steps(values, 99))`},
 {label:'O(1) — constant time',kind:'Growth-rate example',code:`profile = {"name": "Maya", "level": 4, "active": True}

value = profile["level"]
print("level:", value)
print("stored fields:", len(profile))`},
 {label:'O(log n) — logarithmic time',kind:'Growth-rate example',code:`remaining = 128
steps = 0

while remaining > 1:
    remaining //= 2
    steps += 1

print("halving steps:", steps)`},
 {label:'O(n) — linear time',kind:'Growth-rate example',code:`temperatures = [31, 34, 29, 36, 33, 35]
hottest = temperatures[0]
checks = 0

for value in temperatures[1:]:
    checks += 1
    if value > hottest:
        hottest = value

print("hottest:", hottest)
print("checks:", checks)`},
 {label:'O(n log n) — linearithmic time',kind:'Growth-rate example',code:`values = [8, 3, 6, 1, 7, 2, 5, 4]
steps = 0

for _ in values:
    remaining = len(values)
    while remaining > 1:
        remaining //= 2
        steps += 1

print("n:", len(values))
print("n log n style steps:", steps)`},
 {label:'O(n²) — quadratic time',kind:'Growth-rate example',code:`users = ["Ali", "Maya", "Omar", "Sara"]
comparisons = 0

for first in users:
    for second in users:
        comparisons += 1

print("users:", len(users))
print("pair checks:", comparisons)`},
 {label:'Time–space trade-off',kind:'Job-style example',code:`users = ["Ali", "Maya", "Ali", "Omar"]
seen = set()
duplicate = None

for user in users:
    if user in seen:
        duplicate = user
        break
    seen.add(user)

print("duplicate:", duplicate)
print("extra remembered users:", len(seen))`}
];}
function generalPlan(b){
 var cs=concepts(b),plan=cs.map(function(c){return{label:c,kind:'Concept example'};});
 plan.push({label:'Integrated application',kind:'Integration example',integration:true});
 plan.push({label:'Edge case / debug',kind:'Edge-case example',edge:true});
 while(plan.length<5)plan.splice(plan.length-2,0,{label:'Concept transfer '+(plan.length-1),kind:'Transfer example',transfer:true});
 return plan;
}
function generatedForPlan(b,course,p,index,used){
 var label=p.label,title=lessonTitle(b.closest('.lesson')),entry,code,sig;
 if(course==='dsa'&&norm(title)==='big o notation'&&p.code){
  sig=structureSignature(p.code);if(claimGeneratedSignature(course,sig,used))return{type:'python',code:p.code};
  return{type:'scenario'};
 }
 if(p.integration){
  var cs=concepts(b),joined=(cs[0]||title)+' '+(cs[1]||'integration');
  if(courseAllowsGeneratedPython(course)){code=uniqueCodeFor(b,index+17,'',used);sig=structureSignature(code);if(code&&claimGeneratedSignature(course,sig,null))return{type:'python',code:code};}
  entry=nativeExampleFor(course,title+' '+joined,index+17);if(entry&&entry.code){sig=structureSignature(entry.code);if(claimGeneratedSignature(course,sig,used))return{type:'native',entry:entry};}
  return{type:'scenario'};
 }
 if(p.edge){return{type:'scenario'};}
 if(courseAllowsGeneratedPython(course)){
  var candidates=[program(label,index+1,course),program(label,index+7,course),program(label,index+13,course),program(title+' '+label,index+19,course)];
  for(var i=0;i<candidates.length;i++){code=String(candidates[i]||'').trim();if(!code||/^concept\s*=/.test(code))continue;sig=structureSignature(code);if(claimGeneratedSignature(course,sig,used))return{type:'python',code:code};}
 }else{
  for(var j=0;j<4;j++){entry=nativeExampleFor(course,label,index+1+j*5)||nativeExampleFor(course,title+' '+label,index+1+j*5);if(entry&&entry.code){sig=structureSignature(entry.code);if(claimGeneratedSignature(course,sig,used))return{type:'native',entry:entry};}}
 }
 return{type:'scenario'};
}

/* v5.47 KHDA-benchmarked company-use professional-readiness override.
   Coverage alone is not enough: every key idea must have a concrete, course-appropriate example.
   Runnable code is used only when the generator can represent the idea faithfully; otherwise the
   learner gets a realistic professional scenario with an observable success check. */
function professionalBehavior(course,title,c){
 var cid=String(course||'').toLowerCase(), raw=String(c||'').trim(), t=norm((title||'')+' '+(c||'')), x=norm(c);
 if(raw==='~'&&cid==='linux')return'Expand the home-directory shortcut to the current user’s home path and compare it with an absolute and a relative path before choosing a file location.';
 if(raw==='>>'&&cid==='linux')return'Append command output to an existing file without replacing its current contents, then verify the old content is still present before the new output.';
 if(raw==='=='&&cid==='python')return'Compare whether two values are equal while keeping equality separate from object identity, then predict the boolean result for equal-but-distinct objects.';
 if(cid==='software-engineering-practice'&&/uml|class diagram|sequence diagram|component diagram|activity diagram|state diagram/.test(x)){
  if(/class diagram/.test(x))return'Identify the stable domain types or classes, their responsibilities, and the relationships another engineer must understand before implementation.';
  if(/sequence diagram/.test(x))return'Trace one real request or scenario over time, showing which actor or service sends each message and where an alternate or failure path changes the interaction.';
  if(/component diagram/.test(x))return'Map the major deployable or logical components, what each owns, and the dependency direction between them without dropping into class-level detail.';
  if(/activity diagram/.test(x))return'Trace a workflow from start to finish, including important decisions, parallel/alternate paths, and the business condition that selects each branch.';
  if(/state diagram/.test(x))return'List the valid states of one entity, the events that allow transitions, and at least one transition that must be rejected.';
  return'Choose the lightest diagram that answers the team’s actual design question, include only decision-relevant detail, and explain why another diagram type would be less suitable.';
 }
 if(/constant time|o 1/.test(t))return'Notice work that stays roughly the same even when the input grows.';
 if(/logarithmic|o log|binary search/.test(t))return'Notice a process that removes a large part of the remaining search space after each decision.';
 if(/linearithmic|n log n/.test(t))return'Notice work that combines touching many items with repeated divide, merge, or logarithmic search steps.';
 if(/quadratic|n 2|pairwise|nested loop/.test(t))return'Notice when each item must be compared or combined with many other items, so the work grows much faster.';
 if(/time complexity|growth rate|big o/.test(t))return'Compare how the amount of work grows when the input becomes much larger, not just how fast one tiny run feels.';
 if(/space complexity|memory complexity/.test(t))return'Compare how much additional memory an approach needs as the input grows.';
 if(/best.*case|average.*case|worst.*case/.test(t))return'Compare inputs that let the same approach finish early, do typical work, or do its maximum work.';
 if(/variable|assignment|name binding|dynamic typing/.test(x))return'Trace how a value is stored, rebound, and later read, including what type/value exists at each point.';
 if(/string|f string|slicing|join|format|type conversion|int\(\)|str\(\)/.test(x))return'Trace a small text or value-conversion task and predict the exact transformed result before running it.';
 if(/condition|if elif else|boolean|comparison|and or not|relational/.test(x))return'Use concrete inputs that take different decision paths and explain why exactly one path or boolean result is produced.';
 if(/for loop|while loop|iteration|enumerate|break|continue|range/.test(x))return'Trace how many repetitions occur, what changes on each pass, and where repetition skips or stops.';
 if(/function|argument|parameter|return|args|kwargs|scope/.test(x))return'Trace data entering a reusable operation, the local work it performs, and the value or effect returned to the caller.';
 if(/list|tuple|collection|indexing|slicing/.test(x))return'Trace a small ordered collection through access or transformation and state what changes and what stays unchanged.';
 if(/exception|try except|error handling|raise/.test(x))return'Compare a valid input with one expected failure and trace how the program recovers or reports the problem without hiding unrelated bugs.';
 if(/file|pathlib|json|csv|serialization|context manager|with/.test(x))return'Trace data from memory to a file or external representation and back, including safe resource handling and one missing/invalid-data case.';
 if(/generator|yield|iterator|lazy/.test(x))return'Trace when values are produced one at a time instead of all at once, and identify what state is preserved between requests for the next value.';
 if(/decorator/.test(x))return'Trace a function call before and after extra behavior is wrapped around it, separating the original responsibility from the added responsibility.';
 if(/lambda|map\(\)|filter\(\)|comprehension/.test(x))return'Trace a small collection through a transformation or selection rule and predict the resulting collection.';
 if(/async|await|coroutine/.test(x))return'Trace two operations that spend time waiting and identify where execution can make progress without blocking the whole workflow.';
 if(/array|contiguous memory|index access|o 1 access/.test(x))return'Trace direct access, traversal, insertion, or removal in a compact sequence and relate the operation to how elements are laid out.';
 if(/linked list|next reference|singly|doubly|fast slow pointers/.test(x))return'Trace node links before and after traversal, insertion, removal, reversal, or pointer movement, checking that no link is lost.';
 if(/two pointers/.test(x))return'Trace two positions moving through a sequence and explain what condition allows one or both positions to move.';
 if(/sliding window/.test(x))return'Trace a moving contiguous range, showing what enters, what leaves, and how the maintained state avoids recomputing the whole range.';
 if(/prefix sum/.test(x))return'Precompute cumulative information once, then use differences between stored prefixes to answer range questions quickly.';
 if(/union find|disjoint set/.test(x))return'Trace which items belong to the same connected group and how group representatives change after unions and finds.';
 if(/hashing|password hash|purpose built hashing/.test(x)&&cid==='cybersecurity')return'Compare a stored one-way password verifier with the original password and explain why verification does not require recovering the original secret.';
 if(/encryption|symmetric|asymmetric|public key|private key/.test(x)&&cid==='cybersecurity')return'Trace plaintext becoming protected ciphertext and back only for an authorized party with the required key material.';
 if(/sql injection|xss|cross site scripting|csrf|ssrf|injection/.test(x))return'Trace untrusted input crossing a trust boundary and show where validation, parameterization, escaping, or request controls prevent it from becoming executable or unauthorized behavior.';
 if(/authentication|authorization|access control|permission/.test(x)&&cid==='cybersecurity')return'Separate proving who a user is from deciding what that user is allowed to do on one concrete protected request.';
 if(/b tree|lsm tree|database index|indexes/.test(x)&&(cid==='databases'||cid==='sql'))return'Compare scanning all records with following an index structure to locate a small subset, including the write/storage trade-off of maintaining the index.';
 if(/join|inner join|left join/.test(x))return'Use two tiny related tables and predict exactly which row combinations appear, including a key with no matching row.';
 if(/transaction|acid|isolation|commit|rollback/.test(x))return'Trace two related database changes as one unit and show what must happen if a failure or concurrent operation occurs in the middle.';
 if(/replication|replica|leaderless|leader based/.test(x))return'Trace one write and later reads across multiple copies of data, including what happens if one replica is delayed or unavailable.';
 if(/sharding|partitioning|consistent hashing|hash ring/.test(x))return'Trace how several keys are assigned across multiple machines and what moves when capacity or membership changes.';
 if(/cache|cache invalidation|staleness/.test(x))return'Compare a fast cached read with the source of truth, then trace what happens after the underlying value changes.';
 if(/load balanc|horizontal scaling/.test(x))return'Trace incoming requests across several healthy service instances and show what happens when one instance becomes unavailable.';
 if(/cap theorem|consistency|availability|network partition/.test(x)&&cid==='distributed-systems')return'Trace a request during a network partition and state which guarantee the design preserves and which behavior it must sacrifice or delay.';
 if(/feature vector|weighted sum|dot product|matrix multiplication|tensor shape|matrix shape/.test(x))return'Trace the dimensions and weighted combination of a small feature or tensor example, then explain what each dimension represents in the real model pipeline.';
 if(/standard deviation|variance|sampling variability|sampling intuition|distribution shape|mean and rates|probability intuition/.test(x))return'Use a small realistic dataset or evaluation slice to compare averages, variability, proportions, or sample size, then explain what decision the statistic supports.';
 if(/gradient intuition|partial derivative intuition|chain rule intuition/.test(x))return'Trace how changing one earlier parameter would change a later loss, then follow that sensitivity backward through the computation without doing unnecessary symbolic-calculus drills.';
 if(/regression/.test(x))return'Use numeric examples to predict a continuous value and evaluate how far predictions are from the true values.';
 if(/classification|class label/.test(x))return'Use labeled examples to predict one of several categories and inspect which predictions are correct or confused.';
 if(/train.*test|validation|data leakage/.test(x))return'Separate data used to fit choices from data used to estimate generalization, and identify a leakage path that would make evaluation falsely optimistic.';
 if(/precision|recall|f1|confusion matrix|accuracy|metric/.test(x))return'Use a small set of predictions and true labels to calculate or interpret the evaluation signal that matters for the business error being measured.';
 if(/overfit|underfit|cross validation/.test(x))return'Compare training performance with unseen-data performance and identify whether the model is too simple, memorizing, or appropriately generalizing.';
 if(/feature engineering|feature scaling|normalization/.test(x))return'Trace raw input fields into model-ready features and explain how the transformation affects what the model can learn or compare.';
 if(/clustering|k means/.test(x))return'Group unlabeled examples by similarity and inspect whether the resulting groups are stable and meaningful rather than treating them as known classes.';
 if(/activation|relu|sigmoid|non linear/.test(x))return'Trace a few neuron inputs through the activation rule and show how the output changes the network’s ability to represent non-linear behavior.';
 if(/loss|mse|cross entropy/.test(x))return'Compare model outputs with targets using the lesson’s error signal and explain what a larger or smaller value means for training.';
 if(/gradient|backprop|chain rule|autograd/.test(x))return'Trace how a change in the final loss sends credit or blame backward to earlier parameters so an optimizer knows which direction to update.';
 if(/optimizer|sgd|adam|learning rate/.test(x))return'Trace one parameter update from a gradient and compare what happens when the update size is too small or too large.';
 if(/regularization|dropout|batch norm/.test(x))return'Compare training behavior with and without the lesson’s stabilization or regularization technique and identify the generalization or optimization effect.';
 if(/token|context window|context budget/.test(x))return'Trace a short piece of text into model tokens and account for how those tokens consume the finite context available for instructions, retrieved evidence, and output.';
 if(/temperature|greedy decoding|sampling|top k|top p/.test(x))return'Compare next-token choices under a deterministic setting and a more exploratory setting, then relate the difference to repeatability and diversity.';
 if(/embedding|semantic similarity/.test(x))return'Represent a few short items as points in a learned space and compare which items should be considered semantically closer for retrieval or matching.';
 if(/chunk|chunk size/.test(x)&&cid==='rag')return'Split a small document in two different ways and compare whether the retrieved unit preserves enough context without adding too much irrelevant text.';
 if(/retrieval|vector database|metadata filter|query transformation|grounding/.test(x)&&cid==='rag')return'Trace a question through search/filtering into selected evidence and verify that the final answer is supported by that evidence rather than model memory alone.';
 if(/function calling|tool use|tool definition|model decides code executes/.test(x)&&cid==='ai-agents')return'Trace a user goal into a structured tool request, an external result, and a final response, keeping the model’s decision separate from the code that actually performs the action.';
 if(/memory/.test(x)&&cid==='ai-agents')return'Decide which information belongs in short-lived working state versus durable external storage, then trace what should be available on the next turn or session.';
 if(/planning|reflection|verification|stop|stopping/.test(x)&&cid==='ai-agents')return'Trace an agent through a plan, one action, verification of the result, and a clear decision to continue, recover, or stop.';
 if(/model registry|model version|artifact/.test(x)&&cid==='mlops')return'Trace a trained model from experiment output into a versioned registry entry with enough metadata to reproduce, compare, deploy, and roll back it.';
 if(/drift|monitoring|evaluation gate|baseline|rollback/.test(x)&&(cid==='mlops'||cid==='llm-evaluation-testing'))return'Compare a candidate or live model against a defined baseline and threshold, then state the evidence that should block, allow, or roll back deployment.';
 if(/mdp|markov|state|action/.test(x)&&cid==='reinforcement-learning-post-training')return'Trace one environment state, the available action choice, and the next state while separating what the agent observes from the rule that governs transitions.';
 if(/reward|return|discount|reward shaping/.test(x)&&cid==='reinforcement-learning-post-training')return'Trace rewards across a short trajectory and explain how later rewards contribute to the learning signal assigned to earlier decisions.';
 if(/state value|action value|q\(|v\(|policy/.test(x)&&cid==='reinforcement-learning-post-training')return'Compare the expected long-term outcome of a state or state-action choice and show how that estimate guides future action selection.';
 if((cid==='dsa'||cid==='cpp-dsa'||cid==='python'||cid==='problem-solving'||cid==='oop')&&/hash table|hash map|(^| )set( |$)|dictionary|dict|key value lookup/.test(t))return'Remember keys or previously seen values so repeated membership checks do not require rescanning everything.';
 if((cid==='dsa'||cid==='cpp-dsa')&&/(^| )stack( |$)/.test(t))return'Process the most recently added item first and trace what is pushed, waiting, and removed.';
 if(/queue|deque/.test(t))return'Process waiting items in the required arrival order and trace what enters and leaves the structure.';
 if(/linked list|node|fast slow|pointer/.test(t)&&cid==='dsa')return'Follow references between nodes and trace which links change during traversal, insertion, deletion, or reversal.';
 if((cid==='dsa'||cid==='cpp-dsa'||cid==='classical-ai')&&/tree|bst|heap|trie/.test(t))return'Follow the structure from parent to child and trace the path, ordering rule, or priority that controls the result.';
 if((cid==='dsa'||cid==='cpp-dsa'||cid==='classical-ai')&&/graph|bfs|dfs|shortest path|dijkstra|topological/.test(t))return'Model connected items and trace which nodes are discovered, visited, queued, or chosen next.';
 if((cid==='dsa'||cid==='cpp-dsa'||cid==='python'||cid==='problem-solving')&&/sort|merge sort|quick sort|bubble sort|insertion sort/.test(t))return'Rearrange a small collection into order while tracing the comparisons and movements that create the final order.';
 if((cid==='dsa'||cid==='cpp-dsa'||cid==='python'||cid==='problem-solving'||cid==='classical-ai')&&/recurs|backtrack/.test(t))return'Reduce the task to smaller choices until a stopping condition is reached, then trace how results return or choices are undone.';
 if((cid==='dsa'||cid==='cpp-dsa'||cid==='classical-ai')&&/dynamic programming|memo|tabulation/.test(t))return'Reuse answers to repeated smaller subproblems instead of calculating the same work again.';
 if((cid==='dsa'||cid==='cpp-dsa'||cid==='classical-ai')&&/greedy/.test(t))return'Make the best allowed local choice at each step and verify whether those choices satisfy the final goal.';
 if(cid==='python'||cid==='problem-solving'||cid==='oop')return'Use a small program state, trace what changes after each operation, and explain the result without memorizing variable names.';
 if(cid==='sql'||cid==='databases'||/sql|join|group by|window|query|transaction|index/.test(t))return'Use a small set of records and predict which rows are selected, joined, grouped, ordered, updated, or protected by the database rule.';
 if(cid==='apis'||cid==='backend'||cid==='web-dev'||cid==='frontend-dev')return'Trace one realistic user request from input through validation and processing to the response or visible interface state.';
 if(cid==='git')return'Trace a small repository change through the relevant history, branch, review, merge, or recovery operation.';
 if(cid==='linux'||cid==='systems-programming'||cid==='comparch-os')return'Trace what the operating system, process, memory, file, or command state should look like before and after the operation.';
 if(cid==='testing'||cid==='debugging')return'Start with a specific expected behavior and a failing or risky case, then identify the evidence that proves the code is correct or reveals the defect.';
 if(cid==='software-engineering-practice'||cid==='software-architecture'||cid==='system-design'||cid==='distributed-systems')return'Use a realistic service requirement and reason about responsibilities, failure modes, scale, data flow, and the trade-off created by the design choice.';
 if(cid==='cloud-computing'||cid==='docker'||cid==='kubernetes'||cid==='cicd'||cid==='deployment'||cid==='observability')return'Use a small production deployment and trace how configuration, rollout, health, metrics, logs, scaling, or recovery changes the running system.';
 if(cid==='networking'||cid==='cybersecurity'||cid==='secure-ai-applications')return'Use one concrete request or connection and trace trust boundaries, data movement, checks, failure conditions, and the expected secure behavior.';
 if(cid==='data-engineering')return'Use a small batch or stream of records and trace ingestion, validation, transformation, storage, and recovery from one bad or late record.';
 if(cid==='data-science')return'Use a small dataset and trace how cleaning, transformation, analysis, or evaluation changes the evidence available for a decision.';
 if(cid==='ai-ml')return'Use a small labeled or unlabeled dataset and identify what is learned from training data, what is predicted, and how the result should be evaluated.';
 if(cid==='deep-learning'||cid==='pytorch'||cid==='tensorflow')return'Use a tiny tensor or neural-network example and trace shapes, forward computation, loss, gradients, parameter updates, or evaluation behavior.';
 if(cid==='computer-vision'||cid==='nlp')return'Use a small image or text example and trace the representation, model decision, output, and one case that could make the result fail.';
 if(cid==='transformers'||cid==='llms'||cid==='prompt-engineering'||cid==='huggingface')return'Use a short prompt or token sequence and trace context, representation, generation, decoding, evaluation, or model-loading behavior.';
 if(cid==='rag')return'Use a tiny document collection and trace ingestion, chunking, retrieval, filtering, context construction, and the grounded answer.';
 if(cid==='ai-agents')return'Use a small agent task and trace the goal, state, tool decision, tool result, verification, and stopping condition.';
 if(cid==='mlops'||cid==='ai-system-design'||cid==='large-scale-ai'||cid==='llm-evaluation-testing')return'Use a production AI change and trace versioning, evaluation gates, latency/cost, monitoring, rollback, or scaling evidence before release.';
 if(cid==='reinforcement-learning-post-training')return'Use a short interaction trajectory and trace state, action, reward or preference signal, update target, and the behavior being optimized.';
 if(cid==='classical-ai')return'Use a small search, planning, or reasoning problem and trace the state representation, available choices, evaluation rule, and selected path.';
 if(cid==='generative-ai'||cid==='gans'||cid==='vaes'||cid==='diffusion')return'Use a small generative-model example and trace the representation, training objective or noise/latent process, generated output, and evaluation risk.';
 if(cid==='digital-hardware'||cid==='advanced-computer-organization'||cid==='embedded-systems')return'Use a small hardware or embedded-system state and trace signals, timing, memory, device input/output, or the instruction/data path to the observable result.';
 if(cid==='interview-prep'||cid==='company-prep'||cid==='resume-prep'||cid==='influencing-without-authority')return'Use a realistic engineering-career situation and identify the evidence, decision, communication, or trade-off that would make the response strong and credible.';
 return'Apply this lesson idea to a concrete engineering case and trace the starting state, the important decision or transformation, and an observable result.';
}
function professionalScenario(course,title,c,index){
 var behavior=professionalBehavior(course,title,c);
 return{example:String(c||title||'Concept')+': '+behavior,check:''};
}
function shouldGenerateConceptCode(course,title,label){
 var cid=String(course||'').toLowerCase();
 if(!courseAllowsGeneratedPython(cid))return false;
 var direct=String(program(label,3,cid)||'').trim();
 return !!direct&&!/^concept\s*=/.test(direct);
}
function conceptScenarioCard(b,index,total,label,kind){
 var title=lessonTitle(b.closest('.lesson'))+' — '+label;
 return '<article class="csai-study-example csai-example-card csai-study-scenario" data-language="text" data-reference-only="true" data-concept-example="true" data-concept-name="'+esc(label)+'" data-title="'+esc(title)+'"><div class="csai-study-example-head"><div><span class="csai-study-number">Example '+(index+1)+' of '+total+'</span><h4>'+esc(label)+'</h4></div><span class="csai-study-kind">'+esc(kind||'Concept')+'</span></div><div class="csai-study-brief"><b>Definition</b><p>'+esc(conceptDefinition(b,label))+'</p></div></article>';
}
function pythonConceptCard(b,index,total,label,code,kind){
 var course=studyCourseId(),titleText=lessonTitle(b.closest('.lesson')),title=titleText+' — '+label;
 return '<article class="csai-study-example csai-example-card" data-language="python" data-concept-example="true" data-concept-name="'+esc(label)+'" data-title="'+esc(title)+'"><div class="csai-study-example-head"><div><span class="csai-study-number">Example '+(index+1)+' of '+total+'</span><h4>'+esc(label)+'</h4></div><span class="csai-study-kind">'+esc(kind||'Concept example')+'</span></div>'+conceptCodeBrief(b,label,programBehavior(code,'python'))+'<textarea class="csai-study-code" data-editor data-language="python" spellcheck="false">'+esc(code)+'</textarea><div class="csai-example-actions csai-study-actions"><button type="button" class="csai-study-run" data-study-run>▶ Run / Check</button><button type="button" class="csai-study-reset" data-study-reset>Reset</button><button type="button" class="csai-clean-publish" data-final-publish data-final-kind="example">Publish to GitHub</button><button type="button" class="csai-clean-readme" data-final-readme data-final-kind="example">Add a README</button><span class="csai-final-publish-status" data-final-publish-status aria-live="polite"></span></div><div class="csai-study-output" data-study-output>Ready.</div></article>';
}
function nativeConceptCard(b,index,total,label,entry,kind){
 var course=studyCourseId(),titleText=lessonTitle(b.closest('.lesson')),title=titleText+' — '+label,lang=entry.language||'text';
 var brief=conceptCodeBrief(b,label,programBehavior(entry.code||'',lang));
 if(lang==='cpp')return '<article class="csai-study-example csai-example-card csai-study-native" data-language="cpp" data-concept-example="true" data-concept-name="'+esc(label)+'" data-title="'+esc(title)+'"><div class="csai-study-example-head"><div><span class="csai-study-number">Example '+(index+1)+' of '+total+'</span><h4>'+esc(label)+'</h4></div><span class="csai-study-kind">'+esc(kind||'Concept example')+'</span></div>'+brief+'<textarea class="csai-study-code" data-editor data-language="cpp" spellcheck="false">'+esc(entry.code||'')+'</textarea><div class="csai-example-actions csai-study-actions"><button type="button" class="csai-study-run" data-study-run>▶ Run / Check</button><button type="button" class="csai-study-reset" data-study-reset>Reset</button><button type="button" class="csai-clean-publish" data-final-publish data-final-kind="example">Publish to GitHub</button><button type="button" class="csai-clean-readme" data-final-readme data-final-kind="example">Add a README</button><span class="csai-final-publish-status" data-final-publish-status aria-live="polite"></span></div><div class="csai-study-output" data-study-output>Ready.</div></article>';
 return '<article class="csai-study-example csai-example-card csai-study-native" data-language="'+esc(lang)+'" data-concept-example="true" data-concept-name="'+esc(label)+'" data-title="'+esc(title)+'"><div class="csai-study-example-head"><div><span class="csai-study-number">Example '+(index+1)+' of '+total+'</span><h4>'+esc(label)+'</h4></div><span class="csai-study-kind">'+esc(kind||'Concept example')+'</span></div>'+brief+'<pre class="code" data-example-audit="candidate">'+esc(entry.code||'')+'</pre></article>';
}
function generatedForPlan(b,course,p,index,used){
 var label=p.label,title=lessonTitle(b.closest('.lesson')),entry,code,sig;
 if(course==='dsa'&&norm(title)==='big o notation'&&p.code){sig=structureSignature(p.code);if(claimGeneratedSignature(course,sig,used))return{type:'python',code:p.code};return{type:'scenario'};}
 if(p.integration){
  var cs=concepts(b),joined=(cs[0]||title)+' '+(cs[1]||'integration');
  if(shouldGenerateConceptCode(course,title,joined)){code=uniqueCodeFor(b,index+17,'',used);sig=structureSignature(code);if(code&&claimGeneratedSignature(course,sig,null))return{type:'python',code:code};}
  entry=nativeExampleFor(course,title+' '+joined,index+17);if(entry&&entry.code){sig=structureSignature(entry.code);if(claimGeneratedSignature(course,sig,used))return{type:'native',entry:entry};
  }return{type:'scenario'};
 }
 if(p.edge)return{type:'scenario'};
 if(shouldGenerateConceptCode(course,title,label)){
  var candidates=[program(label,index+1,course),program(label,index+7,course),program(label,index+13,course),program(title+' '+label,index+19,course)];
  for(var i=0;i<candidates.length;i++){code=String(candidates[i]||'').trim();if(!code||/^concept\s*=/.test(code))continue;sig=structureSignature(code);if(claimGeneratedSignature(course,sig,used))return{type:'python',code:code};}
 }
 if(!courseAllowsGeneratedPython(course)||['cpp-dsa','sql','databases','web-dev','frontend-dev','git','linux','docker','kubernetes','cicd','cloud-computing','deployment','observability','networking'].includes(course)){
  for(var j=0;j<4;j++){entry=nativeExampleFor(course,label,index+1+j*5)||nativeExampleFor(course,title+' '+label,index+1+j*5);if(entry&&entry.code){sig=structureSignature(entry.code);if(claimGeneratedSignature(course,sig,used))return{type:'native',entry:entry};}}
 }
 return{type:'scenario'};
}


/* v5.71 — global example-diversity layer.
   Different literal values do not count as a different example. Each generated card rotates
   through a different practical operation or situation while staying faithful to its concept. */
var EXAMPLE_DIVERSITY_VERSION='5.72';
function diversityMode(seed){seed=Number(seed)||0;return ((seed%8)+8)%8;}
function practicalUseFor(course,title,label,index){
 var cid=String(course||studyCourseId()||'').toLowerCase(),t=norm(label),m=diversityMode(index+1),uses;
 if(/integrated application/.test(t))return'Use this when one task requires several ideas from '+title+' together, so you can see how the operations interact instead of practicing them in isolation.';
 if(/edge case.*debug|debug.*edge case/.test(t))return'Use this when checking '+title+' with boundary, unusual, invalid, empty, missing, repeated, or failure input so you can verify behavior where normal assumptions often break.';
 if(/concept transfer/.test(t))return'Use this when a new problem looks different on the surface but relies on the same '+title+' principle, so you practice recognizing the idea instead of memorizing one example.';
 if(/tuple|unpack|multiple return/.test(t))uses=[
  'Store a fixed `(x, y)` coordinate that belongs together.',
  'Unpack a fixed record into separate variables.',
  'Return two related results from one function.',
  'Use an immutable pair as a dictionary key.',
  'Represent a fixed record such as a date or RGB color.',
  'Swap values with tuple unpacking.',
  'Keep a fixed configuration pair that should not grow or shrink.',
  'Iterate through fixed records while preserving field order.'
 ];
 else if(/(^| )set( |$)|sets|membership|unique|union|intersection|difference|subset/.test(t))uses=[
  'Remove duplicate IDs from repeated input.',
  'Check quickly whether a value has already been seen.',
  'Find values shared by two groups.',
  'Find required values that are missing.',
  'Track visited items during a traversal.',
  'Check whether all required values are present.',
  'Combine unique values from two groups.',
  'Detect duplicates while processing values.'
 ];
 else if(/dictionary|dict|hash map|key value|mapping/.test(t))uses=[
  'Look up a value directly by a meaningful key.',
  'Count how many times each item appears.',
  'Update inventory or state for one named item.',
  'Store configuration values under descriptive names.',
  'Group several records under the same key.',
  'Read optional data safely with a default.',
  'Store nested records such as users and settings.',
  'Build a reverse lookup from values back to keys.'
 ];
 else if(/(^| )list( |$)|lists|array|collection|slice|indexing/.test(t))uses=[
  'Keep an ordered collection that can change.',
  'Filter a collection to values matching a rule.',
  'Take a slice of recent history.',
  'Transform every item into a new result list.',
  'Collect results gradually with `.append()`.',
  'Flatten nested rows into one ordered list.',
  'Update an item at a known position.',
  'Sort or reorganize an ordered collection.'
 ];
 else if(/condition|if|elif|else|branch|boolean|comparison|and or not/.test(t))uses=[
  'Choose whether a user may continue.',
  'Select a rule from several numeric ranges.',
  'Classify a score into a result category.',
  'Guard against missing or invalid input.',
  'Combine several permission checks.',
  'Choose between two values.',
  'Choose one message from a true/false condition.',
  'Handle several mutually exclusive cases.'
 ];
 else if(/loop|iteration|range|enumerate|break|continue|while|for loop/.test(t))uses=[
  'Process every reading in a collection.',
  'Number items while iterating.',
  'Stop early when a target is found.',
  'Skip invalid items and keep looping.',
  'Repeat until a changing condition becomes false.',
  'Visit row/column combinations with nested loops.',
  'Process two related sequences together.',
  'Iterate through keys and values in a mapping.'
 ];
 else if(/function|parameter|argument|return|lambda|args|kwargs/.test(t))uses=[
  'Reuse one calculation without repeating its code.',
  'Provide a default for an optional argument.',
  'Return more than one related result.',
  'Exit early when input is invalid.',
  'Use named arguments to make a call clearer.',
  'Pass reusable behavior into a transformation.',
  'Separate calculation from input/output code.',
  'Package a decision into independently testable code.'
 ];
 else if(/generator|yield|iterator|lazy/.test(t))uses=[
  'Produce a long sequence one value at a time.',
  'Stream only matching values as requested.',
  'Generate batches lazily for data processing.',
  'Transform records without building a full intermediate list.',
  'Create a sequence whose state continues between requests.',
  'Chain values through a low-memory pipeline.',
  'Preserve state between successive `next()` calls.',
  'Avoid computing values the program may never consume.'
 ];
 else if(/comprehension/.test(t))uses=[
  'Build transformed values in one compact expression.',
  'Filter while building a new collection.',
  'Create key-value pairs from another collection.',
  'Build unique transformed values.',
  'Flatten nested values into one list.',
  'Convert records into a lookup table.',
  'Normalize values while constructing the result.',
  'Combine a transformation and a condition.'
 ];
 else if(/stack trace/.test(t))uses=[
  'Read the call chain after a test or program fails so you can locate the failing line and trace how execution reached it.',
  'Compare a reproducible failure with its traceback so you can separate the visible error from the earlier call that caused it.',
  'Use file names and line numbers in a traceback to decide which function to inspect first.',
  'Follow nested calls backward from the exception when the line that crashes is not where the bad value was created.',
  'Use a traceback as reproducible evidence when explaining a bug to another developer.',
  'Compare two failing runs to see whether they break at the same call path.',
  'Identify the exception type at the bottom of a Python traceback before inspecting the callers above it.',
  'Trace a production error from the reported exception back through the functions that led to it.'
 ];
 else if(/call stack/.test(t))uses=[
  'Trace nested function calls so you can see which function is currently active and where execution will return next.',
  'Understand why recursive calls return in reverse order after reaching the base case.',
  'Track which local function context belongs to each active call.',
  'Diagnose excessive recursion by seeing how repeated calls accumulate before returning.',
  'Explain how one function called another before an error occurred.',
  'Trace the return path through several nested helper functions.',
  'Understand why local variables from separate calls do not overwrite one another.',
  'Follow active calls when debugging a deeply nested execution path.'
 ];
 else if(/(^| )stack( |$)|lifo/.test(t)&&cid!=='linux')uses=[
  'Undo the most recent action first.',
  'Match nested brackets.',
  'Process pending work in reverse order.',
  'Traverse depth-first without recursion.',
  'Keep back-navigation history.',
  'Reverse a sequence.',
  'Track nested parsing state.',
  'Process last-in, first-out tasks.'
 ];
 else if(/queue|deque/.test(t))uses=[
  'Process requests in arrival order.',
  'Run breadth-first traversal.',
  'Model a waiting line.',
  'Buffer incoming events for a worker.',
  'Keep a fixed-size recent-history window.',
  'Schedule tasks fairly in FIFO order.',
  'Add or remove efficiently from both ends.',
  'Separate producers from consumers.'
 ];
 else if(/sql|join|group by|where|window|query|database/.test(t))uses=[
  'Filter records using a business rule.',
  'Combine related rows from two tables.',
  'Summarize rows by category.',
  'Rank rows inside each group.',
  'Find the top record per group.',
  'Find rows with missing related data.',
  'Build a reusable intermediate result.',
  'Sort results by importance or recency.'
 ];
 else if(/model|regression|classification|gradient|neural|embedding|transformer|llm|rag|agent/.test(t))uses=[
  'Turn input features into a measurable prediction.',
  'Evaluate predictions against known answers.',
  'Retrieve evidence for a query.',
  'Compare representations for similarity.',
  'Trace one model-parameter update.',
  'Prepare a small batch of model input.',
  'Choose and verify one AI tool/action.',
  'Measure output with a concrete evaluation signal.'
 ];
 else if(/git|commit|branch|merge|version control/.test(t))uses=[
  'Save one meaningful checkpoint.',
  'Isolate a change on a separate branch.',
  'Inspect changes before committing.',
  'Combine finished work into the main branch.',
  'Undo a bad change without erasing history.',
  'Inspect recent project history.',
  'Stage only selected files.',
  'Resolve competing changes before merging.'
 ];
 else if(/html|css|dom|javascript|web|frontend/.test(t))uses=[
  'Build a semantic page section.',
  'Create an accessible validated form.',
  'Respond to a user event.',
  'Transform data before rendering it.',
  'Lay out content responsively.',
  'Add keyboard-visible focus styling.',
  'Build meaningful navigation.',
  'Calculate and display a value in the interface.'
 ];
 else{
  var behavior=professionalBehavior(cid,title,label);
  if(behavior&&behavior!=='Apply this lesson idea to a concrete engineering case and trace the starting state, the important decision or transformation, and an observable result.')return behavior;
  uses=[
   'Use '+label+' in a concrete '+title+' task where its effect can be observed and checked.',
   'Use '+label+' when a '+title+' decision depends on the rule or behavior this concept represents.',
   'Use '+label+' to trace how a '+title+' input, state, or operation changes into a result.',
   'Use '+label+' when verifying whether a '+title+' implementation behaves correctly under a different input.'
  ];
 }
 return uses[m%uses.length];
}
function diverseProgram(topic,seed,cid){
 cid=String(cid||studyCourseId()||'').toLowerCase();var t=norm(topic),m=diversityMode(seed);
 var banks={};
 banks.tuple=[
  'point = (4, 7)\nx, y = point\nprint(x, y)',
  'rgb = (255, 120, 40)\nred, green, blue = rgb\nprint(red, green, blue)',
  'def min_max(values):\n    return min(values), max(values)\n\nlow, high = min_max([8, 2, 11, 4])\nprint(low, high)',
  'locations = {(25, 40): "lab", (10, 5): "office"}\nprint(locations[(25, 40)])',
  'record = ("Ahmed", "Computer Engineering", 2028)\nfor field in record:\n    print(field)',
  'left, right = "A", "B"\nleft, right = right, left\nprint(left, right)',
  'dimensions = (1920, 1080)\nwidth, height = dimensions\nprint(width * height)',
  'schedule = (("Math", 9), ("Python", 11), ("DSA", 14))\nfor course, hour in schedule:\n    print(course, hour)'
 ];
 banks.set=[
  'ids = [101, 102, 101, 103, 102]\nprint(set(ids))',
  'allowed = {"python", "sql", "git"}\nprint("sql" in allowed)\nprint("java" in allowed)',
  'team_a = {"python", "sql", "git"}\nteam_b = {"python", "linux", "git"}\nprint(team_a & team_b)',
  'required = {"python", "sql", "git"}\ncompleted = {"python", "git"}\nprint(required - completed)',
  'visited = set()\nfor page in ["home", "courses", "home", "dsa"]:\n    if page not in visited:\n        visited.add(page)\nprint(visited)',
  'required = {"id", "email"}\nreceived = {"id", "email", "name"}\nprint(required <= received)',
  'backend = {"python", "sql"}\nfrontend = {"html", "css", "javascript"}\nprint(backend | frontend)',
  'seen = set()\nfor value in [4, 2, 4, 7, 2]:\n    if value in seen:\n        print("duplicate:", value)\n    else:\n        seen.add(value)'
 ];
 banks.dict=[
  'scores = {"Ali": 90, "Maya": 84}\nprint(scores["Ali"])',
  'words = ["ai", "data", "ai", "python", "ai"]\ncounts = {}\nfor word in words:\n    counts[word] = counts.get(word, 0) + 1\nprint(counts)',
  'inventory = {"cpu": 4, "ram": 12}\ninventory["ram"] -= 1\ninventory["ssd"] = 5\nprint(inventory)',
  'config = {"theme": "dark", "language": "en"}\nprint(config.get("font_size", 14))',
  'orders = [{"user":"A","total":20},{"user":"B","total":35},{"user":"A","total":15}]\ntotals = {}\nfor order in orders:\n    totals[order["user"]] = totals.get(order["user"], 0) + order["total"]\nprint(totals)',
  'users = {"u1":{"name":"Ali","active":True},"u2":{"name":"Maya","active":False}}\nprint(users["u1"]["name"])',
  'codes = {"AE": "UAE", "PS": "Palestine"}\nreverse = {name: code for code, name in codes.items()}\nprint(reverse)',
  'profile = {"name":"Ahmed","skills":["python","sql"]}\nprofile["skills"].append("git")\nprint(profile)'
 ];
 banks.cond=[
  'age = 19\nif age >= 18:\n    print("adult")\nelse:\n    print("minor")',
  'total = 140\nif total >= 200:\n    shipping = 0\nelif total >= 100:\n    shipping = 10\nelse:\n    shipping = 20\nprint(shipping)',
  'score = 87\nif score >= 90:\n    grade = "A"\nelif score >= 80:\n    grade = "B"\nelse:\n    grade = "C or below"\nprint(grade)',
  'name = ""\nif not name:\n    print("name is required")\nelse:\n    print("welcome", name)',
  'active = True\nrole = "learner"\nif active and role in {"learner", "admin"}:\n    print("access granted")\nelse:\n    print("access denied")',
  'a, b = 12, 8\nif a > b:\n    print(a)\nelse:\n    print(b)',
  'temperature = 38\nprint("hot" if temperature >= 35 else "comfortable")',
  'value = -3\nif value > 0:\n    print("positive")\nelif value < 0:\n    print("negative")\nelse:\n    print("zero")'
 ];
 banks.loop=[
  'readings = [3, 5, 7, 4]\ntotal = 0\nfor value in readings:\n    total += value\nprint(total)',
  'tasks = ["learn", "practice", "build"]\nfor number, task in enumerate(tasks, start=1):\n    print(number, task)',
  'values = [4, 8, 15, 16]\nfor value in values:\n    if value == 15:\n        print("found", value)\n        break',
  'values = [5, -1, 7, -3, 9]\nfor value in values:\n    if value < 0:\n        continue\n    print(value)',
  'attempts = 3\nwhile attempts > 0:\n    print(attempts)\n    attempts -= 1',
  'for row in range(2):\n    for col in range(3):\n        print(row, col)',
  'names = ["Ali", "Maya", "Omar"]\nscores = [82, 91, 76]\nfor name, score in zip(names, scores):\n    print(name, score)',
  'profile = {"name":"Ahmed","level":3}\nfor key, value in profile.items():\n    print(key, value)'
 ];
 banks.function=[
  'def area(width, height):\n    return width * height\nprint(area(4, 6))',
  'def greet(name, greeting="Hello"):\n    return f"{greeting}, {name}"\nprint(greet("Ahmed"))',
  'def min_max(values):\n    return min(values), max(values)\nlow, high = min_max([8, 2, 11])\nprint(low, high)',
  'def safe_average(values):\n    if not values:\n        return 0\n    return sum(values) / len(values)\nprint(safe_average([]))',
  'def profile(name, *, active=True):\n    return {"name": name, "active": active}\nprint(profile("Ahmed", active=False))',
  'square = lambda value: value * value\nprint([square(v) for v in [1, 2, 3]])',
  'def discount(price, rate):\n    return price * (1 - rate)\nprint([discount(p, .1) for p in [100, 80]])',
  'def is_even(value):\n    return value % 2 == 0\nprint([v for v in [1,2,3,4] if is_even(v)])'
 ];
 banks.generator=[
  'def even_numbers(limit):\n    for value in range(limit + 1):\n        if value % 2 == 0:\n            yield value\nprint(list(even_numbers(8)))',
  'squares = (value * value for value in range(1, 6))\nprint(next(squares))\nprint(list(squares))',
  'def batches(items, size):\n    for start in range(0, len(items), size):\n        yield items[start:start + size]\nprint(list(batches([1,2,3,4,5], 2)))',
  'def countdown(start):\n    while start > 0:\n        yield start\n        start -= 1\nprint(list(countdown(5)))',
  'names = ["  Ali ", " Maya  ", " Omar "]\nclean_names = (name.strip() for name in names)\nprint(list(clean_names))',
  'def matching(values, minimum):\n    for value in values:\n        if value >= minimum:\n            yield value\nprint(list(matching([4,9,2,11], 7)))',
  'def running_totals(values):\n    total = 0\n    for value in values:\n        total += value\n        yield total\nprint(list(running_totals([3,5,2])))',
  'lines = ["error: disk", "ok", "error: network"]\nerrors = (line for line in lines if line.startswith("error:"))\nprint(list(errors))'
 ];
 banks.stack=[
  'history = []\nfor page in ["home", "courses", "dsa"]:\n    history.append(page)\nprint("back to:", history[-2])',
  'text = "([]{})"\nstack = []\npairs = {")": "(", "]": "[", "}": "{"}\nvalid = True\nfor char in text:\n    if char in "([{": stack.append(char)\n    elif not stack or stack.pop() != pairs[char]: valid = False; break\nprint(valid and not stack)',
  'actions = ["type A", "type B", "delete B"]\nundo = []\nfor action in actions: undo.append(action)\nprint("undo:", undo.pop())',
  'values = [1, 2, 3, 4]\nstack = []\nfor value in values: stack.append(value)\nreversed_values = []\nwhile stack: reversed_values.append(stack.pop())\nprint(reversed_values)',
  'stack = [(0, "start")]\nwhile stack:\n    depth, label = stack.pop()\n    print(depth, label)\n    if depth < 2: stack.append((depth + 1, label + ".child"))',
  'tokens = ["3", "4", "+"]\nstack = []\nfor token in tokens:\n    if token.isdigit(): stack.append(int(token))\n    else: stack.append(stack.pop() + stack.pop())\nprint(stack[-1])',
  'path = ["root", "settings", "privacy"]\nprint("current:", path[-1])\npath.pop()\nprint("parent:", path[-1])',
  'work = ["compile", "test", "package"]\nstack = list(work)\nwhile stack: print("doing:", stack.pop())'
 ];
 banks.queue=[
  'from collections import deque\nrequests = deque(["A", "B", "C"])\nwhile requests: print("serve:", requests.popleft())',
  'from collections import deque\nqueue = deque([(0, 0)])\nseen = {(0, 0)}\nwhile queue:\n    cell = queue.popleft()\n    print(cell)\n    if cell == (1, 0): break\n    nxt = (cell[0] + 1, cell[1])\n    if nxt not in seen: seen.add(nxt); queue.append(nxt)',
  'from collections import deque\nprinter = deque()\nfor job in ["report.pdf", "cv.pdf", "notes.pdf"]: printer.append(job)\nprint("next:", printer.popleft())',
  'from collections import deque\nevents = deque(maxlen=3)\nfor event in [1, 2, 3, 4, 5]: events.append(event)\nprint(list(events))',
  'from collections import deque\nline = deque(["Ali", "Maya"])\nline.append("Omar")\nprint(line.popleft(), list(line))',
  'from collections import deque\nready = deque(["task-1", "task-2", "task-3"])\nready.rotate(-1)\nprint(list(ready))',
  'from collections import deque\nd = deque([2, 3])\nd.appendleft(1)\nd.append(4)\nprint(d.popleft(), d.pop())',
  'from collections import deque\ninbox = deque()\nfor message in ["m1", "m2", "m3"]: inbox.append(message)\nwhile inbox: print("process", inbox.popleft())'
 ];
 banks.linked=[
  'class Node:\n    def __init__(self, value, next_node=None): self.value, self.next = value, next_node\nhead = Node(1, Node(2, Node(3)))\nprint(head.next.next.value)',
  'class Node:\n    def __init__(self, value, next_node=None): self.value, self.next = value, next_node\nhead = Node("A", Node("B"))\nnew_head = Node("START", head)\nprint(new_head.value, new_head.next.value)',
  'class Node:\n    def __init__(self, value, next_node=None): self.value, self.next = value, next_node\nhead = Node(10, Node(20))\nhead.next.next = Node(30)\ncur = head\nwhile cur: print(cur.value); cur = cur.next',
  'class Node:\n    def __init__(self, value, next_node=None): self.value, self.next = value, next_node\nhead = Node(5, Node(8, Node(13)))\ncur = head\nwhile cur and cur.value != 8: cur = cur.next\nprint(cur.value if cur else None)',
  'class Node:\n    def __init__(self, value, next_node=None): self.value, self.next = value, next_node\nhead = Node(1, Node(2, Node(3)))\nhead.next = head.next.next\ncur = head\nwhile cur: print(cur.value); cur = cur.next',
  'class Node:\n    def __init__(self, value, next_node=None): self.value, self.next = value, next_node\nhead = Node(2, Node(4, Node(6)))\ncount = 0\ncur = head\nwhile cur: count += 1; cur = cur.next\nprint(count)',
  'class Node:\n    def __init__(self, value, next_node=None): self.value, self.next = value, next_node\nhead = Node(1, Node(2, Node(3)))\nvalues = []\ncur = head\nwhile cur: values.append(cur.value); cur = cur.next\nprint(values)',
  'class Node:\n    def __init__(self, value, next_node=None): self.value, self.next = value, next_node\nhead = Node(1, Node(2, Node(3)))\nprev = None\ncur = head\nwhile cur:\n    nxt = cur.next; cur.next = prev; prev = cur; cur = nxt\nprint(prev.value, prev.next.value)'
 ];
 banks.binary=[
  'nums = [2, 4, 7, 9, 13]\ntarget = 9\nleft, right = 0, len(nums)-1\nwhile left <= right:\n    mid = (left + right)//2\n    if nums[mid] == target: print(mid); break\n    if nums[mid] < target: left = mid + 1\n    else: right = mid - 1',
  'nums = [10, 20, 30, 40, 50]\ntarget = 25\nleft, right = 0, len(nums)\nwhile left < right:\n    mid = (left + right)//2\n    if nums[mid] < target: left = mid + 1\n    else: right = mid\nprint("insert at", left)',
  'nums = [1, 2, 2, 2, 4]\ntarget = 2\nleft, right = 0, len(nums)-1\nanswer = -1\nwhile left <= right:\n    mid=(left+right)//2\n    if nums[mid] >= target: answer=mid; right=mid-1\n    else: left=mid+1\nprint(answer)',
  'pages = [5, 9, 12, 20, 28]\nlimit = 15\nleft, right = 0, len(pages)\nwhile left < right:\n    mid=(left+right)//2\n    if pages[mid] <= limit: left=mid+1\n    else: right=mid\nprint(pages[left] if left < len(pages) else None)',
  'def can_finish(speed): return speed * 4 >= 37\nlo, hi = 1, 20\nwhile lo < hi:\n    mid=(lo+hi)//2\n    if can_finish(mid): hi=mid\n    else: lo=mid+1\nprint(lo)',
  'nums=[3,6,9,12,15]\ntarget=8\nleft,right=0,len(nums)-1\nwhile left<=right:\n    mid=(left+right)//2\n    if nums[mid] < target: left=mid+1\n    else: right=mid-1\nprint("closest insertion index", left)',
  'matrix_rows=[1,4,7,10,13]\ntarget=10\nlo,hi=0,len(matrix_rows)-1\nwhile lo<=hi:\n    mid=(lo+hi)//2\n    if matrix_rows[mid]==target: print("found row",mid); break\n    if matrix_rows[mid]<target: lo=mid+1\n    else: hi=mid-1',
  'times=[8,12,16,20,24]\ncutoff=18\nlo,hi=0,len(times)\nwhile lo<hi:\n    mid=(lo+hi)//2\n    if times[mid] < cutoff: lo=mid+1\n    else: hi=mid\nprint(times[lo])'
 ];
 banks.recursion=[
  'def factorial(n):\n    if n <= 1: return 1\n    return n * factorial(n-1)\nprint(factorial(5))',
  'def countdown(n):\n    if n == 0: return\n    print(n)\n    countdown(n-1)\ncountdown(4)',
  'def total(values):\n    if not values: return 0\n    return values[0] + total(values[1:])\nprint(total([2,4,6]))',
  'def reverse(text):\n    if len(text) <= 1: return text\n    return reverse(text[1:]) + text[0]\nprint(reverse("dsa"))',
  'def contains(values, target):\n    if not values: return False\n    return values[0] == target or contains(values[1:], target)\nprint(contains([3,7,9], 7))',
  'def power(base, exp):\n    if exp == 0: return 1\n    return base * power(base, exp-1)\nprint(power(2, 5))',
  'tree={"v":1,"left":{"v":2},"right":{"v":3}}\ndef visit(node):\n    if not node: return\n    print(node["v"])\n    visit(node.get("left")); visit(node.get("right"))\nvisit(tree)',
  'def gcd(a,b):\n    if b == 0: return a\n    return gcd(b, a % b)\nprint(gcd(48,18))'
 ];
 banks.comprehension=[
  'nums = [1,2,3,4]\nprint([n*n for n in nums])',
  'temps = [31,36,29,40]\nprint([t for t in temps if t >= 35])',
  'names = [" ali ", "MAYA ", " omar"]\nprint([name.strip().title() for name in names])',
  'matrix = [[1,2],[3,4],[5,6]]\nprint([value for row in matrix for value in row])',
  'words = ["AI","python","SQL"]\nprint([len(word) for word in words])',
  'prices = [10,25,8]\nprint([round(price*1.05,2) for price in prices])',
  'values = [-3,4,-1,7]\nprint([value if value >= 0 else -value for value in values])',
  'records=[{"name":"A","active":True},{"name":"B","active":False}]\nprint([r["name"] for r in records if r["active"]])'
 ];
 if(/generator|yield|iterator|lazy/.test(t))return banks.generator[m];
 if(/list comprehension|comprehension/.test(t))return banks.comprehension[m];
 if(/tuple|unpack|multiple return/.test(t))return banks.tuple[m];
 if(/(^| )set( |$)|sets|set membership|uniqueness|union|intersection|difference|subset/.test(t))return banks.set[m];
 if(/dictionary|dict|hash map|key value|mapping/.test(t))return banks.dict[m];
 if(/condition|if elif else|(^| )if( |$)|(^| )else( |$)|branch|comparison|boolean logic|and or not/.test(t))return banks.cond[m];
 if(/loop|iteration|enumerate|travers|range|break|continue|while/.test(t))return banks.loop[m];
 if(/function|parameter|argument|return|lambda|args|kwargs/.test(t))return banks.function[m];
 if((cid==='dsa'||cid==='cpp-dsa')&&/(^| )stack( |$)/.test(t))return banks.stack[m];
 if((cid==='dsa'||cid==='cpp-dsa')&&/queue|deque/.test(t))return banks.queue[m];
 if((cid==='dsa'||cid==='cpp-dsa')&&/linked/.test(t))return banks.linked[m];
 if((cid==='dsa'||cid==='cpp-dsa')&&/binary search/.test(t))return banks.binary[m];
 if((cid==='dsa'||cid==='cpp-dsa')&&/recurs/.test(t))return banks.recursion[m];
 return legacyProgram(topic,seed,cid);
}
function program(topic,seed,cid){return diverseProgram(topic,seed,cid);}
function diverseNativeExampleFor(course,topic,seed){
 course=String(course||'').toLowerCase();var m=diversityMode(seed);
 if(course==='sql'||course==='databases'){
  var q=[
   'SELECT name, age\nFROM students\nWHERE age >= 18\nORDER BY age DESC;',
   'SELECT country, COUNT(*) AS customer_count\nFROM customers\nGROUP BY country\nORDER BY customer_count DESC;',
   'SELECT c.name, o.item, o.total\nFROM customers AS c\nJOIN orders AS o ON o.customer_id = c.id;',
   'WITH ranked AS (\n  SELECT category, price,\n         ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rn\n  FROM products\n)\nSELECT category, price FROM ranked WHERE rn = 1;',
   'SELECT p.name\nFROM products AS p\nLEFT JOIN order_items AS oi ON oi.product_id = p.id\nWHERE oi.product_id IS NULL;',
   'WITH totals AS (\n  SELECT customer_id, SUM(total) AS spent\n  FROM orders GROUP BY customer_id\n)\nSELECT * FROM totals WHERE spent >= 500;',
   'SELECT department, salary,\n       AVG(salary) OVER (PARTITION BY department) AS department_avg\nFROM employees;',
   'SELECT name, created_at\nFROM users\nORDER BY created_at DESC;'
  ]; return{language:'sql',code:q[m]};
 }
 if(course==='web-dev'||course==='frontend-dev'){
  var w=[
   {language:'html',code:'<main>\\n  <h1>Course dashboard</h1>\\n  <p>3 of 5 lessons complete</p>\\n</main>'},
   {language:'html',code:'<form>\\n  <label for="email">Email</label>\\n  <input id="email" type="email" required>\\n  <button>Join</button>\\n</form>'},
   {language:'javascript',code:'const scores = [72, 88, 91];\\nconsole.log(scores.filter(score => score >= 80));'},
   {language:'javascript',code:'document.querySelector("#save").addEventListener("click", () => console.log("saved"));'},
   {language:'css',code:'.cards {\\n  display: grid;\\n  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));\\n  gap: 1rem;\\n}'},
   {language:'css',code:'.button:focus-visible {\\n  outline: 3px solid currentColor;\\n  outline-offset: 2px;\\n}'},
   {language:'html',code:'<nav aria-label="Main navigation">\\n  <a href="#learn">Learn</a>\\n  <a href="#practice">Practice</a>\\n</nav>'},
   {language:'javascript',code:'const prices = [10, 20, 30];\\nconsole.log(prices.reduce((sum, price) => sum + price, 0));'}
  ]; return w[m];
 }
 var banks={
  git:[
   'git status\\ngit add src/app.py\\ngit commit -m "Add input validation"',
   'git switch -c feature/readme\\ngit switch main\\ngit merge feature/readme',
   'git diff\\ngit diff --staged\\ngit show HEAD',
   'git log --oneline --graph --all\\ngit revert <commit-sha>\\ngit status',
   'git restore --staged config.json\\ngit status',
   'git branch -vv\\ngit remote -v',
   'git stash push -m "wip"\\ngit stash list\\ngit stash pop',
   'git fetch origin\\ngit log HEAD..origin/main --oneline'
  ],
  linux:[
   'pwd\\nls -lah\\ncd projects',
   'grep -i "error" app.log | sort | uniq -c',
   'find . -type f -name "*.py"\\nchmod u+x script.sh',
   'ps aux | grep python\\ntail -f app.log',
   'mkdir -p backups\\ncp config.json backups/config.json',
   'head -n 5 data.csv\\ntail -n 5 data.csv',
   'du -sh .\\ndf -h',
   'printf "python\\\\nsql\\\\npython\\\\n" | sort | uniq'
  ],
  networking:[
   'ping -n 4 example.com','curl -I https://example.com','nslookup example.com','tracert example.com',
   'netstat -ano','ipconfig /all','curl -v https://example.com','ping 127.0.0.1'
  ]
 };
 if(banks[course])return{language:'shell',code:banks[course][m]};
 return legacyNativeExampleFor(course,topic,seed);
}
function nativeExampleFor(course,topic,seed){return diverseNativeExampleFor(course,topic,seed);}
function diverseBrief(b,label,programText,index){
 var course=studyCourseId(),title=lessonTitle(b.closest('.lesson')),meta=/integrated application|edge case.*debug|debug.*edge case|concept transfer/.test(norm(label)),heading=meta?'What you are learning':'Definition';
 return '<div class="csai-study-brief csai-concept-brief"><b>'+heading+'</b><p>'+esc(conceptDefinition(b,label))+'</p><b class="csai-concept-use-label">What this example shows</b><p>'+esc(programText)+'</p><b class="csai-concept-use-label">Why use it here</b><p>'+esc(practicalUseFor(course,title,label,index))+'</p></div>';
}
function conceptScenarioCard(b,index,total,label,kind){
 var title=lessonTitle(b.closest('.lesson'))+' — '+label,course=studyCourseId(),meta=/integrated application|edge case.*debug|debug.*edge case|concept transfer/.test(norm(label)),heading=meta?'What you are learning':'Definition';
 return '<article class="csai-study-example csai-example-card csai-study-scenario" data-language="text" data-reference-only="true" data-concept-example="true" data-concept-name="'+esc(label)+'" data-diverse-use="true" data-title="'+esc(title)+'"><div class="csai-study-example-head"><div><span class="csai-study-number">Example '+(index+1)+' of '+total+'</span><h4>'+esc(label)+'</h4></div><span class="csai-study-kind">'+esc(kind||'Concept')+'</span></div><div class="csai-study-brief"><b>'+heading+'</b><p>'+esc(conceptDefinition(b,label))+'</p><b class="csai-concept-use-label">Where you would use it</b><p>'+esc(practicalUseFor(course,lessonTitle(b.closest('.lesson')),label,index))+'</p></div></article>';
}
function pythonConceptCard(b,index,total,label,code,kind){
 var titleText=lessonTitle(b.closest('.lesson')),title=titleText+' — '+label;
 return '<article class="csai-study-example csai-example-card" data-language="python" data-concept-example="true" data-concept-name="'+esc(label)+'" data-diverse-use="true" data-title="'+esc(title)+'"><div class="csai-study-example-head"><div><span class="csai-study-number">Example '+(index+1)+' of '+total+'</span><h4>'+esc(label)+'</h4></div><span class="csai-study-kind">'+esc(kind||'Concept example')+'</span></div>'+diverseBrief(b,label,programBehavior(code,'python'),index)+'<textarea class="csai-study-code" data-editor data-language="python" spellcheck="false">'+esc(code)+'</textarea><div class="csai-example-actions csai-study-actions"><button type="button" class="csai-study-run" data-study-run>▶ Run / Check</button><button type="button" class="csai-study-reset" data-study-reset>Reset</button><button type="button" class="csai-clean-publish" data-final-publish data-final-kind="example">Publish to GitHub</button><button type="button" class="csai-clean-readme" data-final-readme data-final-kind="example">Add a README</button><span class="csai-final-publish-status" data-final-publish-status aria-live="polite"></span></div><div class="csai-study-output" data-study-output>Ready.</div></article>';
}
function nativeConceptCard(b,index,total,label,entry,kind){
 var titleText=lessonTitle(b.closest('.lesson')),title=titleText+' — '+label,lang=entry.language||'text';
 var brief=diverseBrief(b,label,programBehavior(entry.code||'',lang),index);
 if(lang==='cpp')return '<article class="csai-study-example csai-example-card csai-study-native" data-language="cpp" data-concept-example="true" data-concept-name="'+esc(label)+'" data-diverse-use="true" data-title="'+esc(title)+'"><div class="csai-study-example-head"><div><span class="csai-study-number">Example '+(index+1)+' of '+total+'</span><h4>'+esc(label)+'</h4></div><span class="csai-study-kind">'+esc(kind||'Concept example')+'</span></div>'+brief+'<textarea class="csai-study-code" data-editor data-language="cpp" spellcheck="false">'+esc(entry.code||'')+'</textarea><div class="csai-example-actions csai-study-actions"><button type="button" class="csai-study-run" data-study-run>▶ Run / Check</button><button type="button" class="csai-study-reset" data-study-reset>Reset</button><button type="button" class="csai-clean-publish" data-final-publish data-final-kind="example">Publish to GitHub</button><button type="button" class="csai-clean-readme" data-final-readme data-final-kind="example">Add a README</button><span class="csai-final-publish-status" data-final-publish-status aria-live="polite"></span></div><div class="csai-study-output" data-study-output>Ready.</div></article>';
 return '<article class="csai-study-example csai-example-card csai-study-native" data-language="'+esc(lang)+'" data-concept-example="true" data-concept-name="'+esc(label)+'" data-diverse-use="true" data-title="'+esc(title)+'"><div class="csai-study-example-head"><div><span class="csai-study-number">Example '+(index+1)+' of '+total+'</span><h4>'+esc(label)+'</h4></div><span class="csai-study-kind">'+esc(kind||'Concept example')+'</span></div>'+brief+'<pre class="code" data-example-audit="candidate">'+esc(entry.code||'')+'</pre></article>';
}


function nativeSourceCard(b,index,total,src,label){
 if(!src||!src.host)return null;
 src.host.hidden=false;src.host.removeAttribute('hidden');src.host.removeAttribute('data-study-source-hidden');
 var course=studyCourseId(),lesson=lessonTitle(b.closest('.lesson')),article=document.createElement('article');
 article.className='csai-study-example csai-example-card csai-study-source';
 article.setAttribute('data-language',src.language||'text');
 article.setAttribute('data-diverse-use','true');
 article.setAttribute('data-title',lesson+' — Course-native example '+(index+1));
 article.innerHTML='<div class="csai-study-example-head"><div><span class="csai-study-number">Example '+(index+1)+' of '+total+'</span><h4>'+esc(label||'Course-native example')+'</h4></div><span class="csai-study-kind">Course-native example</span></div>'+
  '<div class="csai-study-brief"><b>What the program does</b><p>'+esc(programBehavior(src.code,src.language||'text'))+'</p><b class="csai-concept-use-label">Why this example is useful</b><p>'+esc(practicalUseFor(course,lesson,lesson+' course-native example',index))+'</p></div>';
 article.appendChild(src.host);
 return article;
}


/* v5.72 — every study example has one concise, always-present learning question.
   The question is based on the actual code/concept so it teaches when the idea is useful
   without adding a second workflow, a Required badge, or solution steps. */
function studyQuestionStyle(){
 if(document.getElementById('csai-study-question-style'))return;
 var s=document.createElement('style');s.id='csai-study-question-style';s.textContent=`
 .csai-learning-question{margin:0;padding:12px 14px;border-bottom:1px solid var(--border);background:color-mix(in srgb,var(--panel) 92%,#2f7fb9 8%);line-height:1.58}
 .csai-learning-question b{display:block;margin:0 0 5px;font-size:.8rem;letter-spacing:.02em;color:var(--text)}
 .csai-learning-question p{margin:0;color:var(--text)}
 html[data-theme="dark"] .csai-learning-question{background:color-mix(in srgb,#17212c 90%,#2f7fb9 10%)}
 `;document.head.appendChild(s);
}
function langNameForQuestion(lang){
 lang=String(lang||'').toLowerCase();
 if(lang==='cpp'||lang==='c++')return'C++';if(lang==='javascript'||lang==='js')return'JavaScript';if(lang==='sql')return'SQL';if(lang==='html')return'HTML';if(lang==='css')return'CSS';if(lang==='shell'||lang==='bash')return'command-line';return'Python';
}
function sentenceUse(use){
 use=String(use||'').replace(/`([^`]+)`/g,'$1').replace(/\s+/g,' ').trim().replace(/[.]+$/,'');
 if(!use)return'';
 if(/^use this when\s+/i.test(use))return use.replace(/^use this when\s+/i,'work in a situation where ');
 if(/^use\s+[^ ]+\s+when\s+/i.test(use))return use.replace(/^use\s+[^ ]+\s+when\s+/i,'work in a situation where ');
 return use.charAt(0).toLowerCase()+use.slice(1);
}
function studyQuestionFor(card,index){
 var labelNode=card.querySelector('.csai-study-example-head h4'),label=String((labelNode&&labelNode.textContent)||card.getAttribute('data-concept-name')||'this idea').trim();
 var lesson=lessonTitle(card.closest('.lesson')),lang=String(card.getAttribute('data-language')||'python').toLowerCase();
 var codeNode=card.querySelector('.csai-study-code,pre.code,[data-example-audit]'),code=String(codeNode?('value' in codeNode?codeNode.value:codeNode.textContent):'');
 var useLabel=Array.from(card.querySelectorAll('.csai-concept-use-label,b')).find(function(n){return /why use it here|where you would use it|why this example is useful/i.test(String(n.textContent||''));});
 var use=useLabel&&useLabel.nextElementSibling?String(useLabel.nextElementSibling.textContent||'').trim():'';
 var c=code.replace(/\r/g,''),t=norm(label+' '+lesson),language=langNameForQuestion(lang);

 /* Common examples the learner repeatedly asks about: make these exam-style and specific. */
 if(/prefix\s*=\s*\[\s*0\s*\]/.test(c)&&/prefix\s*\.append\s*\(\s*prefix\s*\[\s*-1\s*\]/.test(c))return'Given a list of numbers, build a prefix-sum list that starts at 0 and stores the running total after each number. What list should the shown input produce?';
 if(/\.get\s*\([^,]+,\s*0\s*\)\s*\+\s*1/.test(c)&&/\{\s*\}/.test(c))return'Given a sequence that may contain repeated values, count how many times each value appears and store the counts by value. What final mapping should the shown input produce?';
 if(/left\s*,\s*right\s*=\s*0\s*,\s*len\s*\([^)]*\)\s*-\s*1/.test(c)&&/while\s+left\s*<\s*right/.test(c)&&/\[left\].*\[right\]/s.test(c))return'Given an ordered list, reverse the list in place by working from both ends toward the middle. What should the list contain when the shown input is finished?';
 if(/sorted\s*\(\s*set\s*\(/.test(c))return'Given values that may contain duplicates, produce the unique values in sorted order. What list should the shown input produce?';
 if(/\bset\s*\(/.test(c)&&!/sorted\s*\(/.test(c)&&/print/.test(c))return'Given repeated values, keep each distinct value only once. What unique values should remain for the shown input?';
 if(/\[[^\]]+\s+for\s+\w+\s+in\s+\w+\s+for\s+\w+\s+in\s+\w+\]/s.test(c))return'Given a nested collection of rows, create one flat list containing every inner value in order. What flat list should the shown data produce?';
 if(/\[[^\]]+\s+for\s+\w+\s+in\s+[^\]]+\]/s.test(c))return'Given the shown collection, build a new list by applying the transformation or condition in this list comprehension to each relevant item. What should the new list contain?';
 if(/\([^\n()]+\s+for\s+\w+\s+in\s+[^\n()]+\)/.test(c)||/\byield\b/.test(c))return'You need to produce values one at a time instead of building every result immediately. What values should this generator produce for the shown input, and when would that lazy behavior be useful?';
 if(/sys\.getrefcount/.test(c))return'Create more than one reference to the same Python object, then remove one reference and observe that the object can still remain reachable. What should the checks in the shown program report?';
 if(/\bis\b/.test(c)&&/==/.test(c))return'Given two Python variables, determine whether they merely contain equal values or actually refer to the same object. What should each comparison in the shown program report?';
 if(/class\s+Node\b/.test(c)&&/\.next\b/.test(c))return'Build the linked nodes shown below and follow their next references to reach the requested node or value. What value should the program produce?';
 if(/while\s+\w+\s*>\s*1/.test(c)&&/\/\/=\s*2/.test(c))return'Given a starting number, repeatedly halve it with integer division until it reaches 1 or below. How many loop iterations should the shown starting value require?';
 if(/while\s+\w+\s*<=\s*\w+/.test(c)&&/mid\s*=/.test(c)&&/target/.test(c))return'Given sorted data and a target value, repeatedly narrow the search range until the target is found or the range is empty. What index or result should the shown input produce?';
 if(/deque\s*\(/.test(c)&&/popleft\s*\(/.test(c))return'You need to process items in the same order they arrive. For the queue shown below, what item should be removed first and what should remain afterward?';
 if(/\.append\s*\(/.test(c)&&/\.pop\s*\(/.test(c)&&!/popleft/.test(c)&&/stack/i.test(c+' '+t))return'You need last-in, first-out behavior. After the shown values are pushed and popped, what value should come out first and what should remain on the stack?';
 if(/def\s+\w+\([^)]*\):[\s\S]*\b\w+\([^)]*-[ ]*1\)/.test(c)||/recurs/.test(t))return'Use the recursive rule shown below to solve the problem by reducing it to a smaller version until the base case is reached. What result should the shown input return?';
 if(lang==='sql'){
  if(/\bJOIN\b/i.test(c))return'You have related data stored in more than one table. Write a query that combines the matching rows shown by this example. Which columns or rows should appear in the result?';
  if(/\bGROUP\s+BY\b/i.test(c))return'You need one summary result per group of related rows. What grouped values should this query calculate and return?';
  if(/\bWHERE\b/i.test(c))return'You need only the rows that satisfy the condition in this example. Which records should the query return?';
  return'Write a SQL query that produces the result demonstrated by this example. What rows or values should appear when the query is correct?';
 }
 if(lang==='html')return'Build the page behavior or structure demonstrated below. What should the user be able to see or do when the HTML is correct?';
 if(lang==='css')return'Apply the styling behavior demonstrated below. What visible layout or appearance should result when the CSS is correct?';
 if(lang==='javascript')return'Given the shown data or page state, write JavaScript that produces the demonstrated behavior. What result should be logged or shown to the user?';
 if(lang==='shell'||lang==='bash')return'You need to perform the command-line task demonstrated below. What should these commands inspect, change, or produce when they run successfully?';

 var useSentence=sentenceUse(use);
 if(code.trim()&&useSentence)return'You need to '+useSentence+'. Using the lesson idea, write a '+language+' solution for the shown data. What output, return value, or state change should prove it worked?';
 if(code.trim())return'Write a '+language+' example that demonstrates '+label+' with the shown data. What output, return value, or state change should the program produce?';
 if(useSentence)return'You need to '+useSentence+'. In what situation would '+label+' be the right idea to use, and what result or behavior would show it worked?';
 return'When would you use '+label+' in '+lesson+', and what result or behavior should you expect when it is applied correctly?';
}
function ensureStudyQuestion(card,index){
 if(!card||card.querySelector(':scope > .csai-learning-question'))return;
 studyQuestionStyle();
 var q=studyQuestionFor(card,index),node=document.createElement('div');node.className='csai-learning-question';node.setAttribute('data-csai-learning-question','example');node.innerHTML='<b>Question</b><p>'+esc(q)+'</p>';
 var brief=card.querySelector(':scope > .csai-study-brief');
 if(brief)brief.insertAdjacentElement('afterend',node);else{var head=card.querySelector(':scope > .csai-study-example-head');if(head)head.insertAdjacentElement('afterend',node);else card.insertBefore(node,card.firstChild);}
}

function hydrateStudyExample(details){
 if(!details||details.dataset.csaiStudyHydrated==='1')return;
 var t=details.querySelector(':scope > template[data-csai-study-template]'),body=details.querySelector(':scope > .csai-study-example-lazy-body');if(!t||!body)return;
 body.appendChild(t.content);t.remove();details.dataset.csaiStudyHydrated='1';
 body.querySelectorAll('.csai-study-code').forEach(function(area){area.defaultValue=area.value;});
}
function prepareLazyStudyExamples(set){
 var cards=Array.from(set.querySelectorAll('.csai-study-list > .csai-study-example'));
 cards.forEach(function(card,i){
  ensureStudyQuestion(card,i);
  var d=document.createElement('details');Array.from(card.attributes).forEach(function(a){d.setAttribute(a.name,a.value)});d.className=card.className+' csai-study-example-lazy';d.setAttribute('data-csai-study-lazy','1');
  var head=card.querySelector(':scope > .csai-study-example-head'),summary=document.createElement('summary');summary.className='csai-study-example-summary';if(head){head.remove();summary.appendChild(head)}else summary.textContent=card.getAttribute('data-title')||('Example '+(i+1));d.appendChild(summary);
  var t=document.createElement('template');t.setAttribute('data-csai-study-template','');while(card.firstChild)t.content.appendChild(card.firstChild);d.appendChild(t);
  var body=document.createElement('div');body.className='csai-study-example-lazy-body';d.appendChild(body);card.replaceWith(d);
  if(i===0){d.open=true;hydrateStudyExample(d)}
 });
}
function buildLesson(lesson){
 var b=body(lesson);if(!b||b.querySelector('[data-study-example-set]'))return;
 var course=studyCourseId(),title=lessonTitle(lesson),sources=sourceRecords(b),used={},uniqueSources=[];
 sources.records.forEach(function(src){var sig=structureSignature(src.code);if(src.code&&sig&&!used[sig]){used[sig]=1;uniqueSources.push(src);}});
 hideSourceRecords(sources);
 var plan=(course==='dsa'&&norm(title)==='big o notation')?bigOPlan():generalPlan(b);
 /* Big-O uses the curated comprehensive ladder instead of the old mixed native snippets. */
 var includeNative=!(course==='dsa'&&norm(title)==='big o notation');
 var total=(includeNative?uniqueSources.length:0)+plan.length,index=0,set=document.createElement('section');
 set.className='csai-study-set';set.setAttribute('data-study-example-set','');set.setAttribute('data-study-count',String(total));set.setAttribute('data-concept-coverage','complete');
 set.innerHTML='<div class="csai-study-set-head"><div><h3>Examples for every key idea</h3><p>Each example shows a different practical use of the lesson ideas.</p></div><span class="csai-study-count">'+total+' examples</span></div><div class="csai-study-coverage">Key ideas covered: '+concepts(b).length+' / '+concepts(b).length+'</div><div class="csai-study-list"></div>';
 var list=set.querySelector('.csai-study-list');
 /* Key-idea examples come first so the visible lesson follows the concept list one-for-one. */
 plan.forEach(function(p,pi){
  var made=generatedForPlan(b,course,p,pi,used),html;
  if(made.type==='python')html=pythonConceptCard(b,index,total,p.label,made.code,p.kind);
  else if(made.type==='native')html=nativeConceptCard(b,index,total,p.label,made.entry,p.kind);
  else html=conceptScenarioCard(b,index,total,p.label,p.kind);
  list.insertAdjacentHTML('beforeend',html);index++;
 });
 if(includeNative){
  uniqueSources.forEach(function(src){var c=nativeSourceCard(b,index,total,src,'Additional course-native example');if(c){list.appendChild(c);index++;}});
 }
 prepareLazyStudyExamples(set);
 var anchor=sources.heading;
 if(anchor)anchor.insertAdjacentElement('beforebegin',set);else{var mistake=Array.from(b.children).find(function(n){return /common mistake/i.test(n.textContent||'');});if(mistake)b.insertBefore(set,mistake);else b.appendChild(set);}
 set.querySelectorAll('.csai-study-code').forEach(function(area){area.defaultValue=area.value;});
}

function fixHomeStat(){document.querySelectorAll('.av4-stat strong').forEach(function(n){if(/^4\s*[–-]\s*8$|^5\s*[–-]\s*8$/.test(String(n.textContent||'').trim()))n.textContent='Every idea';});document.querySelectorAll('.av4-stat span').forEach(function(n){if(/Examples per lesson/i.test(n.textContent||''))n.textContent='A distinct example for every key concept';});}
async function runExample(button){var root=button.closest('.csai-study-example'),area=root&&root.querySelector('.csai-study-code'),out=root&&root.querySelector('[data-study-output]');if(!root||!area||!out)return;var lang=String(root.getAttribute('data-language')||area.dataset.language||'python').toLowerCase();button.disabled=true;out.textContent=lang==='cpp'?'Running C++…':(window.CSAIPythonRunner&&window.CSAIPythonRunner.isReady&&window.CSAIPythonRunner.isReady()?'Running Python…':'Preparing Python…');try{var start=performance.now(),result;if(lang==='cpp'){if(!window.CSAICppRunner||typeof window.CSAICppRunner.runSource!=='function')throw new Error('C++ runner is still loading. Try again in a moment.');result=await window.CSAICppRunner.runSource(area.value);}else{if(!window.CSAIPythonRunner||typeof window.CSAIPythonRunner.runSource!=='function')throw new Error('Python runner is still loading. Try again in a moment.');result=await window.CSAIPythonRunner.runSource(area.value);}var ms=result.milliseconds!=null?result.milliseconds:Math.round(performance.now()-start);out.textContent=(result.error?'Run error':'Run complete ✓')+'\n'+(result.text||'(no output)')+'\n\n'+(lang==='cpp'?'C++':'Python')+' run: '+ms+' ms';}catch(error){out.textContent='Runner error\n'+(error.message||String(error));}finally{button.disabled=false;}}
function bind(){document.addEventListener('click',function(e){var run=e.target.closest&&e.target.closest('[data-study-run]');if(run){e.preventDefault();runExample(run);return;}var reset=e.target.closest&&e.target.closest('[data-study-reset]');if(reset){e.preventDefault();var root=reset.closest('.csai-study-example'),area=root&&root.querySelector('.csai-study-code'),out=root&&root.querySelector('[data-study-output]');if(area)area.value=area.defaultValue;if(out)out.textContent='Reset.';}},true);document.addEventListener('pointerover',function(e){if(e.target.closest&&e.target.closest('.csai-study-example')&&window.CSAIPythonRunner&&typeof window.CSAIPythonRunner.prewarm==='function')window.CSAIPythonRunner.prewarm();},true);document.addEventListener('focusin',function(e){if(e.target.matches&&e.target.matches('.csai-study-code')&&window.CSAIPythonRunner&&typeof window.CSAIPythonRunner.prewarm==='function')window.CSAIPythonRunner.prewarm();},true);}
function lessons(){return Array.from(document.querySelectorAll('.lesson'));}
function currentLesson(){return document.querySelector('.lesson[open]')||lessons()[0]||null;}
function buildCurrent(){style();fixHomeStat();var current=currentLesson();if(current)buildLesson(current);}
function queue(){clearTimeout(applyTimer);applyTimer=setTimeout(buildCurrent,35);}
function boot(){buildCurrent();bind();document.addEventListener('toggle',function(e){if(e.target&&e.target.matches&&e.target.matches('.csai-study-example-lazy')&&e.target.open){hydrateStudyExample(e.target);var list=e.target.parentElement;if(list)Array.from(list.children).forEach(function(x){if(x!==e.target&&x.matches&&x.matches('.csai-study-example-lazy')&&x.open)x.open=false;});}if(e.target&&e.target.classList&&e.target.classList.contains('lesson')&&e.target.open)buildLesson(e.target);},true);setTimeout(buildCurrent,220);setTimeout(fixHomeStat,900);new MutationObserver(function(records){var relevant=false;records.forEach(function(r){Array.from(r.addedNodes||[]).forEach(function(n){if(relevant||!n||n.nodeType!==1)return;if((n.matches&&n.matches('.lesson'))||(n.querySelector&&n.querySelector('.lesson')))relevant=true;});});if(relevant)queue();}).observe(document.documentElement,{childList:true,subtree:true});}
window.CSAIStudyExampleContent={
 version:'5.74',
 practicalUseFor:function(course,title,label,index){return practicalUseFor(course,title,label,index);},
 conceptDefinition:function(bodyNode,label){return conceptDefinition(bodyNode,label);},
 studyQuestionFor:function(card,index){return studyQuestionFor(card,index);}
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
