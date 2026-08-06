(() => {
  'use strict';

  const MODULES = [
    ['Complexity and problem analysis','Measure time and space growth, identify constraints, and compare O(1), O(log n), O(n), O(n log n), and O(n²) solutions.','Classify eight snippets and explain which input sizes each can handle.','Counting only visible loops while ignoring work inside helper functions.','Explain the complexity of your solution before writing code.'],
    ['Arrays: access and traversal','Arrays provide ordered storage and fast indexed access. Most array problems begin with a careful one-pass traversal and a small amount of tracked state.','Find the minimum, maximum, sum, and second-largest distinct value in one or two passes.','Changing an array while iterating without tracking how indices move.','When is an array scan better than sorting?'],
    ['Arrays: insertion, deletion, and rotation','Insertion and deletion may shift later elements. Rotation and in-place updates require precise index boundaries.','Rotate an array right by k positions and remove a chosen value in place.','Overwriting a value before saving the element needed later.','Describe the time cost of inserting at the beginning of an array.'],
    ['Strings and character processing','Strings are sequences. Common techniques include normalization, counting, two pointers, and building output with a list before joining.','Check palindromes, count words, and compress repeated characters.','Repeatedly concatenating large strings inside a loop.','How would you compare two strings while ignoring punctuation and case?'],
    ['Hash maps','Hash maps store key-value pairs with average constant-time lookup. They are ideal for counts, complements, grouping, and remembering earlier indices.','Solve Two Sum and a frequency-count problem, then explain why seen[value] stores an index.','Storing index-to-value when the lookup needs value-to-index.','Why does Two Sum return [seen[complement], i]?'],
    ['Sets','Sets store unique values and support fast membership checks. They simplify duplicate detection, visited tracking, and intersections.','Detect duplicates and find the longest consecutive sequence.','Using a list for repeated membership checks and accidentally creating O(n²).','When should you use a set instead of a dictionary?'],
    ['Two pointers','Two indices move through data from opposite ends or at different speeds. The pattern often replaces nested loops when ordering or structure permits it.','Find a target pair in a sorted array and remove duplicates in place.','Using two pointers on unsorted data when the logic assumes sorted order.','What invariant stays true as the pointers move?'],
    ['Fast and slow pointers','Pointers moving at different speeds detect linked-list cycles, find middle nodes, and model repeated-state processes.','Find the middle of a linked list and detect whether it contains a cycle.','Comparing node values instead of node identity during cycle detection.','Why does Floyd’s cycle algorithm use constant extra space?'],
    ['Sliding window: fixed size','A fixed-size window updates its state when one item enters and another leaves, avoiding repeated calculation of the full range.','Find the maximum sum of any k consecutive values.','Recomputing every window from scratch.','What data must be added and removed when the window moves?'],
    ['Sliding window: variable size','A variable window expands until a condition fails, then shrinks until it becomes valid again.','Find the longest substring without repeating characters.','Moving the left pointer backward or failing to remove outgoing state.','How do you prove each element is processed only a constant number of times?'],
    ['Prefix sums and range queries','Prefix sums preprocess cumulative totals so range sums can be answered quickly. Boundary definitions must remain consistent.','Answer multiple range-sum queries and count subarrays whose sum equals k.','Mixing inclusive and exclusive endpoints.','Why can a prefix-sum hash map solve cases that a sliding window cannot?'],
    ['Binary search','Binary search repeatedly halves a sorted or monotonic search space. Correct loop boundaries and update rules are essential.','Search a sorted array and find the first position where a condition becomes true.','Using binary search on data without an ordered or monotonic property.','What does low or high represent in your implementation?'],
    ['Stacks','Stacks are last-in, first-out. They support nested structures, undo operations, expression parsing, and monotonic-stack problems.','Validate brackets and solve next-greater-element.','Popping without first checking whether the stack is empty.','Why is a stack the natural structure for matching nested brackets?'],
    ['Queues and deques','Queues are first-in, first-out. Deques support efficient operations at both ends and are useful for BFS and monotonic windows.','Implement a task queue and compute a sliding-window maximum using a deque.','Using list.pop(0) repeatedly in Python.','Why is a queue required for breadth-first traversal?'],
    ['Linked lists','Linked lists connect nodes through references. Solving them requires preserving links before changing them.','Reverse a list, merge two sorted lists, and remove the nth node from the end.','Updating current.next before saving the remaining list.','Compare array and linked-list trade-offs.'],
    ['Trees and traversal','Trees model hierarchy. DFS uses recursion or a stack; BFS uses a queue. Each traversal order answers different questions.','Implement preorder, inorder, postorder, and level-order traversal.','Ignoring the empty-tree base case.','When would you choose BFS instead of DFS?'],
    ['Binary search trees','A BST keeps smaller values on one side and larger values on the other, enabling ordered search when balanced.','Search, insert, validate a BST, and find the kth-smallest value.','Checking only each node against its direct children when validating a BST.','Why can an unbalanced BST degrade to O(n)?'],
    ['Heaps and priority queues','A heap efficiently exposes the highest- or lowest-priority item. It is useful for top-k, scheduling, and merging streams.','Find the k largest values and merge k sorted lists.','Sorting an entire dataset when only a small top-k result is required.','What operations does a heap optimize?'],
    ['Graphs: representation and traversal','Graphs model arbitrary connections. Adjacency lists are common; visited tracking prevents repeated work and cycles.','Build an adjacency list and traverse it with BFS and DFS.','Marking nodes visited too late and adding them repeatedly.','Compare BFS and DFS complexity using vertices and edges.'],
    ['Topological sort and dependency graphs','A directed acyclic graph can be ordered so each dependency appears before the work that depends on it.','Determine whether courses can be completed and return a valid order.','Applying topological sort to an undirected graph or a graph with an unresolved cycle.','How does indegree reveal which node can be processed next?'],
    ['Union Find','Disjoint Set Union tracks connected components with parent links, path compression, and union by rank or size.','Count connected components and detect a redundant edge.','Implementing union without finding the current roots first.','Why do path compression and union by rank make operations nearly constant time?'],
    ['Shortest paths','BFS solves shortest paths in unweighted graphs. Dijkstra handles non-negative weighted edges using a priority queue.','Find the shortest unweighted path, then implement Dijkstra on a small weighted graph.','Using Dijkstra when negative edge weights are present.','Why is the first BFS visit the shortest unweighted distance?'],
    ['Recursion and backtracking','Recursion solves smaller versions of a problem. Backtracking chooses, explores, and undoes choices to search a decision tree.','Generate subsets and permutations, then solve a small maze.','Forgetting to undo mutable state after a recursive choice.','State the choice, constraint, and stopping condition of your recursion.'],
    ['Dynamic programming','DP stores solutions to overlapping subproblems. Define the state, recurrence, base cases, evaluation order, and final answer.','Solve climbing stairs, coin change, and longest increasing subsequence.','Writing a table before clearly defining what each state means.','How do you recognize overlapping subproblems and optimal substructure?'],
    ['Greedy algorithms','A greedy algorithm makes the best local choice and needs a reason that this choice can be part of an optimal solution.','Merge intervals and select the maximum number of non-overlapping activities.','Calling an approach greedy simply because it chooses the largest value first.','What exchange argument or invariant supports the greedy choice?'],
    ['Tries and string prefixes','A trie stores strings character by character, making prefix lookup efficient at the cost of extra memory.','Implement insert, exact search, and starts-with operations.','Forgetting a marker that distinguishes a complete word from a prefix.','When is a trie better than a hash set of full words?'],
    ['Bit manipulation','Bits support masks, flags, subset representation, and XOR-based patterns. Use them when the binary structure simplifies the problem.','Find the single non-duplicated number and generate subsets with bit masks.','Using clever bit tricks without explaining why they work.','Why does x XOR x equal zero?'],
    ['Advanced structures: Fenwick and segment trees','These trees answer repeated range queries and updates faster than rescanning an array. Learn the purpose and interface before implementation details.','Trace point updates and range queries on a small example.','Using an advanced structure when prefix sums are enough because there are no updates.','What workload justifies a segment tree or Fenwick tree?'],
    ['Pattern selection and interview workflow','Translate the prompt into inputs, constraints, edge cases, and likely patterns. Start with a correct approach, test it, then improve it.','Classify twenty prompts by likely pattern and explain each choice.','Memorizing solutions without learning the signals that identify a pattern.','Walk through clarification, brute force, optimization, correctness, and complexity.']
  ];

  const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const storageKey = 'cs-ai-dsa-complete-lessons';
  const getDone = () => new Set(JSON.parse(localStorage.getItem(storageKey) || '[]'));

  function active(){ return window.CSAIMasteryPracticeFolder?.currentTrack?.() === 'dsa'; }

  function render(){
    if(!active()) return;
    const current = document.getElementById('full-study-track');
    if(!current || current.dataset.dsaComplete === 'true') return;
    const done = getDone();
    const section = document.createElement('section');
    section.id = 'full-study-track';
    section.dataset.track = 'dsa';
    section.dataset.dsaComplete = 'true';
    section.innerHTML = `<div class="fst-head"><div><div class="fst-kicker">COMPLETE CONCEPT-FIRST DSA COURSE</div><h2>Data Structures & Algorithms — ${MODULES.length} Lessons</h2><p>Learn the concept and pattern first, practise it, study the common mistake, then answer the interview question.</p></div><div class="fst-progress"><strong>${done.size}/${MODULES.length}</strong><span>lessons complete</span></div></div><div class="dsa-sections"><button data-dsa-view="all" class="active">All lessons</button><button data-dsa-view="foundation">Foundations</button><button data-dsa-view="linear">Linear structures</button><button data-dsa-view="trees">Trees & graphs</button><button data-dsa-view="advanced">Algorithms & advanced</button></div><div class="fst-lessons">${MODULES.map((m,i)=>`<details class="fst-lesson" data-dsa-index="${i}" ${i===0?'open':''}><summary><span class="fst-num">${String(i+1).padStart(2,'0')}</span><span>${esc(m[0])}</span><label><input type="checkbox" data-dsa-done="${i}" ${done.has(i)?'checked':''}> Done</label></summary><div class="fst-body"><h4>Explanation</h4><p>${esc(m[1])}</p><h4>Practice</h4><p>${esc(m[2])}</p><div class="fst-note fst-mistake"><strong>Common mistake</strong><span>${esc(m[3])}</span></div><div class="fst-note fst-career"><strong>Interview check</strong><span>${esc(m[4])}</span></div></div></details>`).join('')}</div><div class="fst-after"><div><h3>Exercise progression</h3><p>Complete easy, medium, debugging, and timed exercises after each topic. Explain the pattern before coding.</p></div><div><h3>Final assessment</h3><p>Solve a mixed set without topic labels, test edge cases, and state time and space complexity.</p></div><div><h3>GitHub project</h3><p>Build a tested DSA interview toolkit with topic folders, explanations, brute-force and optimized versions, complexity notes, and a progress README.</p><code>student-code/practice/dsa/</code></div></div>`;
    current.replaceWith(section);
    section.addEventListener('change', event => {
      if(!event.target.matches('[data-dsa-done]')) return;
      const set = getDone(), index = Number(event.target.dataset.dsaDone);
      event.target.checked ? set.add(index) : set.delete(index);
      localStorage.setItem(storageKey, JSON.stringify([...set]));
      section.querySelector('.fst-progress strong').textContent = `${set.size}/${MODULES.length}`;
    });
    section.addEventListener('click', event => {
      const button = event.target.closest('[data-dsa-view]');
      if(!button) return;
      section.querySelectorAll('[data-dsa-view]').forEach(b=>b.classList.toggle('active',b===button));
      const view=button.dataset.dsaView;
      section.querySelectorAll('[data-dsa-index]').forEach(card=>{
        const n=Number(card.dataset.dsaIndex);
        const group=n<6?'foundation':n<15?'linear':n<22?'trees':'advanced';
        card.hidden=view!=='all'&&view!==group;
      });
    });
  }

  const style=document.createElement('style');
  style.textContent=`.dsa-sections{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 16px}.dsa-sections button{border:1px solid #b8c7d4;background:transparent;color:inherit;border-radius:999px;padding:8px 12px;font:inherit;font-weight:700;cursor:pointer}.dsa-sections button.active{background:#17649a;color:#fff;border-color:#17649a}html[data-theme="dark"] .dsa-sections button{border-color:#536473}html[data-theme="dark"] .dsa-sections button.active{background:#2f85bd;border-color:#2f85bd}`;
  document.head.appendChild(style);
  const start=()=>{render();new MutationObserver(()=>setTimeout(render,25)).observe(document.body,{childList:true,subtree:true});window.addEventListener('hashchange',()=>setTimeout(render,100));};
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
})();