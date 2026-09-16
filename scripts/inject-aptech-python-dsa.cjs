const fs = require('fs');
const path = require('path');
const root = process.cwd();
const courseDir = path.join(root, 'courses');

function esc(v){return String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function lesson(id,num,title,learn,explain,concepts,examples,pitfall,checklist=[]){return {id,num,title,learn,explain,concepts,examples,pitfall,checklist};}
function card(l){
  const checklist = l.checklist.length ? `<h3>Syllabus checklist</h3><ul>${l.checklist.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>` : '';
  return `<details class="lesson aptech-aligned" data-lesson="${esc(l.id)}">
<summary><span class="num">${String(l.num).padStart(2,'0')}</span><span class="title">${esc(l.title)}</span><label class="check"><input type="checkbox" data-complete> Complete</label></summary>
<div class="body">
<div class="note"><b>Aptech-aligned module:</b> This is original study material covering the same curriculum topic, adapted to this platform. DSA implementations use Python rather than C/C++.</div>
<h3>What you will learn</h3><ul>${l.learn.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
<h3>Explanation</h3><p>${esc(l.explain)}</p>
<h3>Key concepts</h3><div class="meta">${l.concepts.map(x=>`<span class="pill">${esc(x)}</span>`).join('')}</div>
${checklist}
<h3>Runnable Python examples</h3>
${l.examples.map(([label,code])=>`<h4>${esc(label)}</h4><pre class="code" data-example-audit="candidate">${esc(code)}</pre>`).join('\n')}
<div class="note"><b>Common mistake:</b> ${esc(l.pitfall)}</div>
</div></details>`;
}

const py = [
lesson('aptech-py-intro',13,'Aptech Beginner 1 — Python environment & foundations',
 ['Understand how Python is installed, launched, edited, and inspected','Recognize dynamic typing, reserved words, and naming conventions'],
 'Python is an interpreted language with a strong focus on readability. A beginner should know how a Python file is executed, how an IDE or command line fits into the workflow, and how Python names are bound to objects at runtime. Help and inspection tools make unfamiliar code easier to explore.',
 ['Python versions','installation','environment variables','command line','IDLE / editor','help()','dynamic typing','keywords','naming'],
 [
  ['Inspect runtime values',`import sys, keyword\nname = "Ahmed"\nprint(sys.version_info.major)\nprint(type(name))\nprint(keyword.iskeyword("class"))`],
  ['Valid naming style',`student_name = "Ahmed"\nMAX_RETRIES = 3\nprint(student_name, MAX_RETRIES)`],
  ['Explore an object',`text = "python"\nprint([name for name in dir(text) if name.startswith("is")][:6])`],
  ['Read an environment variable safely',`import os\nmode = os.environ.get("APP_MODE", "development")\nprint(mode)`],
  ['Use built-in help metadata',`print(str.upper.__doc__.splitlines()[0])`]
 ],
 'Treating variable names as fixed-type boxes. In Python, names can be rebound to objects of different types.',
 ['Intro remarks, strengths/weaknesses, brief history, versions','Installing Python and environment variables','Command-line execution, IDLE/editor workflow, getting help','Dynamic types, reserved words, naming conventions']
),
lesson('aptech-py-syntax',14,'Aptech Beginner 2 — Basic Python syntax & strings',
 ['Write valid Python statements and comments','Manipulate, slice, format, and compare strings','Use numeric values, conversions, input/output, and print clearly'],
 'Python uses indentation and readable statements instead of braces. Strings are immutable sequences, so operations create new strings. Formatting, slicing, conversions, and clean input/output are core skills for nearly every Python program.',
 ['comments','strings','format()','slicing','operators','numbers','conversion','input / output','print'],
 [
  ['Comments and basic syntax',`# A comment explains intent\ncourse = "Python"\nhours = 20\nprint(course, hours)`],
  ['String operations and slices',`text = "Python Programming"\nprint(text.upper())\nprint(text[:6])\nprint(text[-11:])`],
  ['The format method',`name = "Ahmed"\nscore = 92\nprint("{} scored {}".format(name, score))`],
  ['Numeric conversion',`raw = "21"\nage = int(raw)\nprint(age + 1)\nprint(float(age))`],
  ['Simple input/output model',`name = "Ahmed"  # imagine this came from input()\nprint("Welcome,", name)`]
 ],
 'Forgetting that input() returns text; convert to int or float when arithmetic is required.',
 ['Basic syntax and comments','String values, operations, format, slices, operators','Numeric data types and conversions','Simple input/output and print']
),
lesson('aptech-py-language',15,'Aptech Beginner 3 — Control flow, operators & loops',
 ['Use indentation and branches correctly','Apply relational, logical, boolean, and bitwise operators','Control while/for loops with break and continue'],
 'Control flow decides which statements run and how often. Conditions combine comparisons and boolean logic. Loops repeat work, while break exits early and continue skips to the next iteration. Bitwise operators work directly on integer bits and appear in flags and some interview problems.',
 ['indentation','if / elif / else','relational','logical','boolean','bitwise','while','break','continue','for'],
 [
  ['Branching',`score = 84\nif score >= 90:\n    grade = "A"\nelif score >= 80:\n    grade = "B"\nelse:\n    grade = "C"\nprint(grade)`],
  ['Relational and logical operators',`age = 20\nstudent = True\nprint(age >= 18 and student)\nprint(age < 18 or not student)`],
  ['Bitwise basics',`a, b = 6, 3\nprint(a & b)\nprint(a | b)\nprint(a ^ b)\nprint(a << 1)`],
  ['while, break, continue',`n = 0\nwhile n < 6:\n    n += 1\n    if n == 2:\n        continue\n    if n == 5:\n        break\n    print(n)`],
  ['for loop',`total = 0\nfor value in [2, 4, 6]:\n    total += value\nprint(total)`]
 ],
 'Writing a while loop whose condition never changes, creating an infinite loop.',
 ['Control-flow syntax and indentation','if statement; relational/logical operators; True/False','Bitwise operators','while; break/continue; for']
),
lesson('aptech-py-collections',16,'Aptech Beginner 4 — Collections, sorting & copying',
 ['Choose between list, tuple, set, and dictionary','Sort dictionary data by key or value','Understand assignment, shallow copies, and deep copies'],
 'Python collections represent different data needs: lists are ordered and mutable, tuples are ordered and immutable, sets store unique values, and dictionaries map keys to values. Copying matters because nested mutable objects can still be shared after a shallow copy.',
 ['list','tuple','set','dict','sorting','shallow copy','deep copy'],
 [
  ['Lists and tuples',`items = ["A", "B"]\nitems.append("C")\npoint = (3, 4)\nprint(items, point)`],
  ['Sets',`values = [1, 1, 2, 3, 3]\nunique = set(values)\nprint(unique)\nprint(2 in unique)`],
  ['Dictionaries',`student = {"name":"Ahmed", "score":92}\nstudent["passed"] = True\nprint(student)`],
  ['Sort dictionary items',`scores = {"B":88, "A":95, "C":88}\nprint(sorted(scores.items()))\nprint(sorted(scores.items(), key=lambda item: (-item[1], item[0])))`],
  ['Shallow vs deep copy',`import copy\noriginal = [[1], [2]]\nshallow = original.copy()\ndeep = copy.deepcopy(original)\nshallow[0].append(9)\ndeep[1].append(8)\nprint(original)\nprint(deep)`]
 ],
 'Assuming b = a makes a copy. It only makes another reference to the same mutable object.',
 ['Lists, tuples, sets, dictionaries','Sorting dictionaries','Copying collections and the difference between aliasing, shallow copy, and deep copy']
),
lesson('aptech-py-functions',17,'Aptech Beginner 5 — Functions from basics to closures',
 ['Define and document reusable functions','Use positional, keyword, optional, collection, *args and **kwargs parameters','Understand scope, first-class functions, lambda, dispatch dictionaries, and closures'],
 'Functions package behavior behind a name. Python functions are first-class objects, so they can be passed around like data. Parameters define an API; scope controls name visibility; closures remember values from an enclosing function after that function returns.',
 ['def','parameters','docstrings','keyword arguments','*args / **kwargs','scope','first-class functions','lambda','closures'],
 [
  ['Define and document',`def area(width, height):\n    """Return rectangle area."""\n    return width * height\n\nprint(area(4, 3))\nprint(area.__doc__)`],
  ['Keyword and optional parameters',`def greet(name, greeting="Hello"):\n    return f"{greeting}, {name}"\n\nprint(greet("Ahmed"))\nprint(greet(name="Ahmed", greeting="Welcome"))`],
  ['Collections and variable arguments',`def report(scores, *tags, **meta):\n    print(sum(scores) / len(scores))\n    print(tags)\n    print(meta)\n\nreport([80,90,100], "DSA", level="beginner")`],
  ['First-class functions and dispatch',`def add(a,b): return a+b\ndef multiply(a,b): return a*b\nops = {"+": add, "*": multiply}\nprint(ops["*"](6, 7))`],
  ['Lambda and closure',`square = lambda n: n*n\ndef multiplier(factor):\n    return lambda value: value * factor\n\ndouble = multiplier(2)\nprint(square(5), double(7))`]
 ],
 'Using *args/**kwargs everywhere instead of giving a function a clear, understandable parameter list.',
 ['Defining functions and parameters','Function documentation','Keyword/optional parameters; collections; variable arguments','Scope','Functions as first-class citizens; passing functions; mapping functions in a dictionary','Lambda and closures']
)
];

const dsa = [
lesson('aptech-dsa-analysis',11,'Aptech DSA 1 — Algorithm analysis & Big-O',
 ['Estimate time and space growth','Compare linear, logarithmic, quadratic, and n log n behavior'],
 'Algorithm analysis asks how running time and extra memory grow as input size grows. For internships, you should state the complexity and justify it from the code structure rather than memorizing labels.',
 ['Big-O','time complexity','space complexity','best / average / worst case'],
 [
  ['O(1)',`nums = [10,20,30]\nprint(nums[0])`],
  ['O(n)',`nums = [3,1,9,2]\nbest = nums[0]\nfor x in nums[1:]:\n    if x > best: best = x\nprint(best)`],
  ['O(n²)',`nums = [1,2,3]\npairs = 0\nfor a in nums:\n    for b in nums:\n        pairs += 1\nprint(pairs)`],
  ['O(log n) trace',`n = 64\nsteps = 0\nwhile n > 1:\n    n //= 2\n    steps += 1\nprint(steps)`],
  ['Space trade-off',`nums = [1,2,1,3,2]\nseen = set(nums)\nprint(len(seen))`]
 ],
 'Calling something O(n) only because it contains one loop; nested loops and repeated work change the growth rate.'
),
lesson('aptech-dsa-memory',12,'Aptech DSA 2 — From C pointers to Python references',
 ['Translate pointer/referencing ideas into Python','Understand aliasing, identity, mutation, and automatic memory management'],
 'A traditional C DSA course discusses pointers, malloc/free, and dynamic allocation. In Python, variables hold references to objects and Python manages object lifetime automatically. The algorithmic idea of linking nodes remains the same, but you do not manually allocate or free memory.',
 ['references','identity','aliasing','mutation','automatic memory management'],
 [
  ['Aliasing',`a = [1,2]\nb = a\nb.append(3)\nprint(a)\nprint(a is b)`],
  ['Identity vs equality',`a = [1,2]\nb = [1,2]\nprint(a == b)\nprint(a is b)`],
  ['Rebinding',`a = [1,2]\nb = a\na = [9,9]\nprint(a)\nprint(b)`],
  ['Node references',`class Node:\n    def __init__(self, value, next_node=None):\n        self.value = value\n        self.next = next_node\nhead = Node(1, Node(2, Node(3)))\nprint(head.next.next.value)`],
  ['Reference count concept',`import sys\nobj = []\nalias = obj\nprint(sys.getrefcount(obj) >= 2)\ndel alias\nprint(sys.getrefcount(obj) >= 1)`]
 ],
 'Trying to imitate malloc/free in Python. Focus on references and link updates; Python handles normal object memory management.'
),
lesson('aptech-dsa-arrays',13,'Aptech DSA 3 — Arrays / Python lists',
 ['Understand index access and insertion/deletion costs','Use traversal, slicing, and in-place patterns'],
 'Python lists fill the dynamic-array role for most interview problems. Index access is constant time, while inserting or deleting in the middle can shift later elements.',
 ['arrays','lists','indexing','traversal','insert/delete costs'],
 [
  ['Traverse',`nums = [4,8,15]\nfor i, value in enumerate(nums):\n    print(i, value)`],
  ['Insert/delete',`nums = [1,3,4]\nnums.insert(1,2)\nnums.pop()\nprint(nums)`],
  ['Reverse in place',`nums = [1,2,3,4]\nleft, right = 0, len(nums)-1\nwhile left < right:\n    nums[left], nums[right] = nums[right], nums[left]\n    left += 1; right -= 1\nprint(nums)`],
  ['Frequency scan',`counts = {}\nfor x in [1,2,1,3,1]: counts[x] = counts.get(x,0)+1\nprint(counts)`],
  ['Prefix sum',`nums=[2,4,6,8]\nprefix=[0]\nfor x in nums: prefix.append(prefix[-1]+x)\nprint(prefix)`]
 ],
 'Assuming every list operation is O(1). Middle insertion/deletion usually requires shifting items.'
),
lesson('aptech-dsa-linked',14,'Aptech DSA 4 — Linked lists in Python',
 ['Build and traverse node chains','Insert, delete, reverse, and use fast/slow pointers'],
 'Linked lists store values inside nodes connected by references. Python replaces C pointer syntax with normal object references, but link-rewiring logic is the same.',
 ['Node','next reference','singly linked list','reverse','fast/slow pointers'],
 [
  ['Build a list',`class Node:\n    def __init__(self,value,next_node=None): self.value,self.next=value,next_node\nhead=Node(1,Node(2,Node(3)))\nprint(head.next.value)`],
  ['Traverse',`class Node:\n    def __init__(self,value,next_node=None): self.value,self.next=value,next_node\nhead=Node(1,Node(2,Node(3)))\ncur=head\nwhile cur:\n    print(cur.value)\n    cur=cur.next`],
  ['Prepend',`class Node:\n    def __init__(self,value,next_node=None): self.value,self.next=value,next_node\nhead=Node(2,Node(3))\nhead=Node(1,head)\nprint(head.value, head.next.value)`],
  ['Reverse',`class Node:\n    def __init__(self,value,next_node=None): self.value,self.next=value,next_node\nhead=Node(1,Node(2,Node(3)))\nprev=None\nwhile head:\n    nxt=head.next; head.next=prev; prev=head; head=nxt\nprint(prev.value, prev.next.value, prev.next.next.value)`],
  ['Find middle',`class Node:\n    def __init__(self,value,next_node=None): self.value,self.next=value,next_node\nhead=Node(1,Node(2,Node(3,Node(4,Node(5)))))\nslow=fast=head\nwhile fast and fast.next:\n    slow=slow.next; fast=fast.next.next\nprint(slow.value)`]
 ],
 'Changing current.next before saving the original next reference when reversing a list, which can lose the rest of the chain.'
),
lesson('aptech-dsa-stackqueue',15,'Aptech DSA 5 — Stacks & queues',
 ['Use LIFO and FIFO structures','Implement stacks with list and queues with deque'],
 'A stack removes the newest item first (LIFO). A queue removes the oldest item first (FIFO). In Python, list.append/pop works well for stacks and collections.deque supports efficient queue operations.',
 ['stack','queue','LIFO','FIFO','deque'],
 [
  ['Stack',`stack=[]\nstack.append("A"); stack.append("B")\nprint(stack.pop())`],
  ['Balanced brackets',`def balanced(text):\n    pairs={')':'(',']':'[','}':'{'}; stack=[]\n    for ch in text:\n        if ch in '([{': stack.append(ch)\n        elif ch in pairs:\n            if not stack or stack.pop()!=pairs[ch]: return False\n    return not stack\nprint(balanced('(a[b])'))`],
  ['Queue',`from collections import deque\nq=deque(['A','B']); q.append('C')\nprint(q.popleft(), list(q))`],
  ['Deque',`from collections import deque\nd=deque([2,3]); d.appendleft(1); d.append(4)\nprint(list(d))`],
  ['BFS uses a queue',`from collections import deque\nq=deque([0]); seen={0}\nwhile q:\n    print(q.popleft())`]
 ],
 'Using list.pop(0) repeatedly for a large queue; deque.popleft() is the usual efficient Python choice.'
),
lesson('aptech-dsa-trees',16,'Aptech DSA 6 — Trees, binary trees & BSTs',
 ['Represent hierarchical structures with nodes','Traverse binary trees and search/insert in a BST'],
 'A tree models parent-child relationships. A binary tree gives each node at most two children. A binary search tree adds an ordering rule: smaller keys go left and larger keys go right.',
 ['tree','binary tree','BST','inorder traversal','search','insert'],
 [
  ['Tree node',`class Node:\n    def __init__(self,value,left=None,right=None): self.value,self.left,self.right=value,left,right\nroot=Node(2,Node(1),Node(3))\nprint(root.left.value, root.right.value)`],
  ['Inorder traversal',`class Node:\n    def __init__(self,value,left=None,right=None): self.value,self.left,self.right=value,left,right\nroot=Node(2,Node(1),Node(3))\ndef inorder(node): return inorder(node.left)+[node.value]+inorder(node.right) if node else []\nprint(inorder(root))`],
  ['BST search',`class Node:\n    def __init__(self,value,left=None,right=None): self.value,self.left,self.right=value,left,right\nnode=Node(4,Node(2),Node(6)); target=6\nwhile node and node.value!=target:\n    node=node.left if target<node.value else node.right\nprint(node is not None)`],
  ['BST insert',`class Node:\n    def __init__(self,value): self.value=value; self.left=None; self.right=None\ndef insert(node,value):\n    if not node: return Node(value)\n    if value<node.value: node.left=insert(node.left,value)\n    elif value>node.value: node.right=insert(node.right,value)\n    return node\nroot=None\nfor x in [4,2,6,5]: root=insert(root,x)\nprint(root.right.left.value)`],
  ['Height',`class Node:\n    def __init__(self,value,left=None,right=None): self.value,self.left,self.right=value,left,right\nroot=Node(1,Node(2,Node(3)),Node(4))\ndef height(node): return 0 if not node else 1+max(height(node.left),height(node.right))\nprint(height(root))`]
 ],
 'Assuming a BST is always balanced. A badly shaped BST can degrade from logarithmic search to linear search.'
),
lesson('aptech-dsa-graphs',17,'Aptech DSA 7 — Graphs with BFS & DFS',
 ['Represent graphs with adjacency lists','Traverse safely using visited sets','Use BFS and DFS'],
 'Graphs model arbitrary relationships. An adjacency list is compact for sparse graphs. A visited set prevents repeated work in cycles. BFS explores layer by layer; DFS explores one path deeply before backtracking.',
 ['graph','adjacency list','visited set','BFS','DFS'],
 [
  ['Adjacency list',`graph={'A':['B','C'],'B':['D'],'C':['D'],'D':[]}\nprint(graph['A'])`],
  ['BFS',`from collections import deque\ng={'A':['B','C'],'B':['D'],'C':['D'],'D':[]}\nq=deque(['A']); seen={'A'}; order=[]\nwhile q:\n    node=q.popleft(); order.append(node)\n    for nxt in g[node]:\n        if nxt not in seen: seen.add(nxt); q.append(nxt)\nprint(order)`],
  ['DFS',`g={'A':['B','C'],'B':['D'],'C':['D'],'D':[]}\nstack=['A']; seen=set(); order=[]\nwhile stack:\n    node=stack.pop()\n    if node in seen: continue\n    seen.add(node); order.append(node); stack.extend(reversed(g[node]))\nprint(order)`],
  ['Path exists',`g={1:[2],2:[3],3:[]}\ntarget=3; stack=[1]; seen=set(); found=False\nwhile stack:\n    node=stack.pop()\n    if node==target: found=True; break\n    if node in seen: continue\n    seen.add(node); stack.extend(g[node])\nprint(found)`],
  ['Connected components',`g={1:[2],2:[1],3:[4],4:[3],5:[]}\nseen=set(); components=0\nfor start in g:\n    if start in seen: continue\n    components+=1; stack=[start]\n    while stack:\n        node=stack.pop()\n        if node in seen: continue\n        seen.add(node); stack.extend(g[node])\nprint(components)`]
 ],
 'Forgetting a visited set in a cyclic graph, which can repeat nodes forever.'
),
lesson('aptech-dsa-search',18,'Aptech DSA 8 — Searching: linear & binary',
 ['Implement linear search','Implement binary search and understand its sorted-input requirement'],
 'Linear search checks items one by one and works on unsorted data. Binary search repeatedly halves a sorted search range, giving logarithmic time when its ordering assumptions are satisfied.',
 ['linear search','binary search','sorted input','O(n)','O(log n)'],
 [
  ['Linear search',`def linear_search(nums,target):\n    for i,x in enumerate(nums):\n        if x==target: return i\n    return -1\nprint(linear_search([9,3,7],7))`],
  ['Binary search',`def binary_search(nums,target):\n    low,high=0,len(nums)-1\n    while low<=high:\n        mid=(low+high)//2\n        if nums[mid]==target: return mid\n        if nums[mid]<target: low=mid+1\n        else: high=mid-1\n    return -1\nprint(binary_search([1,3,5,7,9],7))`],
  ['First position >= target',`def first_at_least(nums,target):\n    low,high=0,len(nums)\n    while low<high:\n        mid=(low+high)//2\n        if nums[mid]>=target: high=mid\n        else: low=mid+1\n    return low\nprint(first_at_least([1,3,5,7],4))`],
  ['bisect',`from bisect import bisect_left\nnums=[1,3,5,7]\nprint(bisect_left(nums,5), bisect_left(nums,4))`],
  ['Search trace',`nums=[1,3,5,7,9,11,13]; target=11\nlow,high=0,len(nums)-1\nwhile low<=high:\n    mid=(low+high)//2\n    print(low,mid,high,nums[mid])\n    if nums[mid]==target: break\n    if nums[mid]<target: low=mid+1\n    else: high=mid-1`]
 ],
 'Applying binary search to unsorted data without another monotonic property.'
),
lesson('aptech-dsa-sorting-basic',19,'Aptech DSA 9 — Bubble, selection & insertion sorting',
 ['Implement the simple quadratic sorting algorithms','Understand swaps, comparisons, and stability'],
 'Bubble, selection, and insertion sort are not usually the fastest production choices, but they make the mechanics of sorting easy to see and analyze.',
 ['bubble sort','selection sort','insertion sort','O(n²)','stability'],
 [
  ['Bubble sort',`def bubble_sort(nums):\n    nums=nums[:]\n    for end in range(len(nums)-1,0,-1):\n        swapped=False\n        for i in range(end):\n            if nums[i]>nums[i+1]: nums[i],nums[i+1]=nums[i+1],nums[i]; swapped=True\n        if not swapped: break\n    return nums\nprint(bubble_sort([5,1,4,2]))`],
  ['Selection sort',`def selection_sort(nums):\n    nums=nums[:]\n    for i in range(len(nums)):\n        smallest=i\n        for j in range(i+1,len(nums)):\n            if nums[j]<nums[smallest]: smallest=j\n        nums[i],nums[smallest]=nums[smallest],nums[i]\n    return nums\nprint(selection_sort([5,1,4,2]))`],
  ['Insertion sort',`def insertion_sort(nums):\n    nums=nums[:]\n    for i in range(1,len(nums)):\n        value=nums[i]; j=i-1\n        while j>=0 and nums[j]>value:\n            nums[j+1]=nums[j]; j-=1\n        nums[j+1]=value\n    return nums\nprint(insertion_sort([5,1,4,2]))`],
  ['Stable sorting idea',`records=[('A',90),('B',80),('C',90)]\nprint(sorted(records,key=lambda item:item[1]))`],
  ['Count comparisons',`nums=[4,3,2,1]; comparisons=0\nfor i in range(len(nums)):\n    for j in range(0,len(nums)-1-i): comparisons+=1\nprint(comparisons)`]
 ],
 'Memorizing the code without being able to explain why the nested work is O(n²).'
),
lesson('aptech-dsa-sorting-fast',20,'Aptech DSA 10 — Merge sort & quicksort',
 ['Implement merge sort','Implement quicksort and explain partition-based divide-and-conquer'],
 'Merge sort divides the input, recursively sorts each half, then merges sorted halves. Quicksort chooses a pivot and partitions values around it. Both are central examples of divide-and-conquer.',
 ['merge sort','quicksort','divide and conquer','O(n log n)'],
 [
  ['Merge sort',`def merge_sort(nums):\n    if len(nums)<=1: return nums[:]\n    mid=len(nums)//2; left=merge_sort(nums[:mid]); right=merge_sort(nums[mid:])\n    out=[]; i=j=0\n    while i<len(left) and j<len(right):\n        if left[i]<=right[j]: out.append(left[i]); i+=1\n        else: out.append(right[j]); j+=1\n    return out+left[i:]+right[j:]\nprint(merge_sort([5,1,4,2]))`],
  ['Quicksort',`def quick_sort(nums):\n    if len(nums)<=1: return nums[:]\n    pivot=nums[len(nums)//2]\n    left=[x for x in nums if x<pivot]\n    middle=[x for x in nums if x==pivot]\n    right=[x for x in nums if x>pivot]\n    return quick_sort(left)+middle+quick_sort(right)\nprint(quick_sort([5,1,4,2,4]))`],
  ['Merge two sorted lists',`a=[1,4,7]; b=[2,3,8]; i=j=0; out=[]\nwhile i<len(a) and j<len(b):\n    if a[i]<=b[j]: out.append(a[i]); i+=1\n    else: out.append(b[j]); j+=1\nout += a[i:]+b[j:]\nprint(out)`],
  ['Partition around pivot',`nums=[7,2,5,3,5]; pivot=5\nprint([x for x in nums if x<pivot])\nprint([x for x in nums if x==pivot])\nprint([x for x in nums if x>pivot])`],
  ['Compare sorted output',`nums=[9,1,7,3,8,2]\nprint(sorted(nums))`]
 ],
 'Saying quicksort is always O(n log n). Poor pivot behavior can produce quadratic worst-case time.'
)
];

function injectCourse(file, lessons, heading, blurb){
  const p=path.join(courseDir,file); if(!fs.existsSync(p)) throw new Error(`${file} missing`);
  let html=fs.readFileSync(p,'utf8');
  if(html.includes('data-aptech-curriculum="1"')) return;
  const marker=`<section class="card" data-aptech-curriculum="1" style="margin:18px 0"><div class="kicker">APTECH-ALIGNED CURRICULUM</div><h2 style="margin:.3rem 0">${esc(heading)}</h2><p class="muted">${esc(blurb)}</p></section>`;
  const lessonHtml=lessons.map(card).join('\n');
  const close='</section>\n<div class="grid">';
  if(!html.includes(close)) throw new Error(`${file}: lesson section boundary not found`);
  html=html.replace(close, marker+'\n'+lessonHtml+'\n</section>\n<div class="grid">');
  const oldCountMatch=html.match(/<span class="pill">(\d+) lessons<\/span>/);
  if(oldCountMatch){
    const total=Number(oldCountMatch[1])+lessons.length;
    html=html.replace(oldCountMatch[0],`<span class="pill">${total} lessons</span>`);
    html=html.replace(/0 of \d+ lessons complete/,`0 of ${total} lessons complete`);
  }
  html=html.replace(/(<script type="application\/json" id="course-page-meta">)([\s\S]*?)(<\/script>)/, function(_,a,json,b){
    const meta=JSON.parse(json); meta.lessonIds=(meta.lessonIds||[]).concat(lessons.map(x=>x.id)); return a+JSON.stringify(meta)+b;
  });
  fs.writeFileSync(p,html);
}

injectCourse('python.html',py,'Python for Beginners — complete Aptech syllabus coverage','All five published beginner chapters are covered explicitly with original explanations and runnable Python examples, while the existing platform lessons remain available.');
injectCourse('dsa.html',dsa,'Data Structures & Algorithms — classic syllabus implemented in Python','The classic C-style structures and algorithms are reimplemented with Python references, classes, lists, dictionaries, deque, and recursion. The existing internship-pattern lessons remain on top of this core.');
console.log(`Injected ${py.length} Aptech-aligned Python beginner modules and ${dsa.length} DSA-in-Python modules.`);
