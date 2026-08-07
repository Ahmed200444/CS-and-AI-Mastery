const fs = require('fs');
const path = require('path');

const root = process.cwd();
const courseDataDir = path.join(root, 'assets', 'course-data');
const coursesDir = path.join(root, 'courses');

if (!fs.existsSync(courseDataDir)) throw new Error('course-data directory is missing');
if (!fs.existsSync(coursesDir)) throw new Error('courses directory is missing');

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);
}
function arr(value) { return Array.isArray(value) ? value : []; }
function list(value) { return Array.isArray(value) ? value : (value ? [value] : []); }
function rx(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function lessonOrder(course) {
  return arr(course.lessons)
    .map((lesson, index) => ({ lesson, index }))
    .sort((a, b) => {
      let x = Number(a.lesson.displayOrder), y = Number(b.lesson.displayOrder);
      if (!Number.isFinite(x)) x = a.index;
      if (!Number.isFinite(y)) y = b.index;
      return x - y;
    });
}
function cleanTitle(value) {
  return String(value || 'this concept').replace(/\s+/g, ' ').trim();
}
function sentence(value) {
  let s = String(value || '').trim();
  if (!s) return '';
  return /[.!?]$/.test(s) ? s : s + '.';
}
function unique(values) {
  const seen = new Set();
  return values.filter(value => {
    const key = String(value || '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
}

const PROFILES = {
  algorithms: {
    mental: 'Treat the topic as a problem-solving pattern, not a piece of syntax. First identify the shape of the input, then the operation you need, then the time and memory trade-off of the approach.',
    practical: 'These patterns appear directly in coding assessments and technical interviews. Recognizing the pattern quickly is often more important than memorizing a particular solution.',
    interview: 'Be able to explain the brute-force idea first, improve it, and state both time and space complexity in plain language.',
    mistake: 'Jumping into code before identifying the pattern can lead to an unnecessarily slow or complicated solution.'
  },
  programming: {
    mental: 'Focus on what data enters the code, how each statement changes that data, and what value or side effect comes out. Reading code line by line is more useful than memorizing isolated syntax.',
    practical: 'This is foundational knowledge you will reuse in backend code, automation, testing, data work, and technical assessments.',
    interview: 'You should be able to write a small example from memory and explain what each line does without relying on an IDE.',
    mistake: 'Memorizing syntax without understanding the state of the program makes debugging much harder.'
  },
  data: {
    mental: 'Think in terms of data shape: rows, columns, keys, relationships, and the transformation that turns the starting data into the required result.',
    practical: 'Real engineering work constantly moves data between applications, databases, APIs, and analytics systems.',
    interview: 'Explain not only what query or data structure works, but why it is correct and what happens as the dataset becomes large.',
    mistake: 'A result can look correct on a tiny dataset while still being logically wrong or inefficient at scale.'
  },
  backend: {
    mental: 'Think of the system as a request moving through boundaries: input validation, business logic, storage or external services, error handling, and the response returned to the caller.',
    practical: 'Backend reliability comes from making each boundary explicit and predictable, especially when databases or external APIs can fail.',
    interview: 'Be ready to describe the request flow, failure cases, data model, and how you would test the behavior.',
    mistake: 'Building only the happy path creates systems that fail unpredictably when inputs, networks, or dependencies are imperfect.'
  },
  web: {
    mental: 'Separate structure, presentation, and behavior. Understand what the browser receives, what it renders, and what changes when the user interacts with the page.',
    practical: 'Even backend and AI engineers often need to understand how a client calls APIs and presents results to users.',
    interview: 'Explain the browser-side flow from user action to network request to DOM update.',
    mistake: 'Mixing too many responsibilities into one component or script makes the interface difficult to debug and maintain.'
  },
  systems: {
    mental: 'Follow the path of information through the system and identify the responsibility of each layer. Then ask what can fail, what can become slow, and what resource is limited.',
    practical: 'Operating systems, networking, and system design concepts explain why production applications behave differently from small local programs.',
    interview: 'Use simple diagrams and clearly state assumptions, bottlenecks, and trade-offs instead of trying to name every technology.',
    mistake: 'Treating infrastructure as magic makes it difficult to diagnose latency, capacity, and reliability problems.'
  },
  ai: {
    mental: 'Separate the data, the model or retrieval step, the objective, and the evaluation. A system is not useful just because it produces an output; you need a way to measure whether that output is good.',
    practical: 'Modern AI engineering combines model behavior with normal software engineering: APIs, testing, observability, data quality, latency, and cost.',
    interview: 'Explain the full pipeline, how you would evaluate it, and what you would do when quality is poor rather than only naming a model.',
    mistake: 'Optimizing a model or prompt without a clear evaluation method can make the system feel better while actually becoming less reliable.'
  },
  devops: {
    mental: 'Think about reproducibility: the same code, configuration, dependencies, and environment should behave predictably wherever it runs.',
    practical: 'Deployment skills turn working local code into software that teammates and users can actually run reliably.',
    interview: 'Explain the build-to-deploy path, configuration handling, rollback strategy, and what you would monitor after release.',
    mistake: 'Relying on manual environment changes creates “works on my machine” failures that are hard to reproduce.'
  },
  security: {
    mental: 'Assume inputs, identities, and external systems cannot automatically be trusted. Define what is allowed, validate it, and give each component only the permissions it needs.',
    practical: 'Security problems often come from ordinary engineering shortcuts: weak validation, excessive permissions, unsafe secrets, or missing audit trails.',
    interview: 'State the threat, the boundary being protected, and the concrete control that reduces the risk.',
    mistake: 'Adding security only after the system is finished usually leaves important trust boundaries poorly designed.'
  },
  general: {
    mental: 'Build a clear mental model: what the concept is, what problem it solves, what goes in, what happens, and what comes out.',
    practical: 'The goal is to connect the definition to something you could recognize or use in a real technical task.',
    interview: 'Explain the idea in simple language first, then give one concrete example.',
    mistake: 'Knowing a definition without being able to apply it is usually not enough for an assessment or interview.'
  }
};

function profileFor(course) {
  const id = String(course.id || '').toLowerCase();
  const title = String(course.title || '').toLowerCase();
  const all = id + ' ' + title;
  if (/dsa|algorithm|problem-solving|problem solving|competitive/.test(all)) return PROFILES.algorithms;
  if (/python|oop|object-oriented|programming|debug|testing/.test(all)) return PROFILES.programming;
  if (/sql|database|data-science|data science|data-engineering|data engineering/.test(all)) return PROFILES.data;
  if (/backend|api|software-engineering|software engineering/.test(all)) return PROFILES.backend;
  if (/web|frontend|javascript|html|css|react/.test(all)) return PROFILES.web;
  if (/network|linux|system-design|system design|operating|computer-architecture/.test(all)) return PROFILES.systems;
  if (/machine-learning|machine learning|deep-learning|deep learning|llm|rag|agent|transformer|generative|nlp|vision|pytorch|tensorflow|hugging|mlops|ai-/.test(all)) return PROFILES.ai;
  if (/docker|kubernetes|cloud|devops|deployment|ci-cd|ci cd/.test(all)) return PROFILES.devops;
  if (/security|secure|cyber/.test(all)) return PROFILES.security;
  return PROFILES.general;
}

const GUIDES = [
  {
    test: /big[- ]?o|time complexity|space complexity|complexity analysis/i,
    mental: 'Big-O describes how resource usage grows as the input size n grows. It is not a stopwatch measurement. O(1) stays roughly constant, O(log n) grows slowly by repeatedly shrinking the problem, O(n) grows with the number of items, and O(n²) often appears when work is repeated for every pair of items.',
    steps: ['Identify what n represents in the problem.', 'Count the operations that grow when n grows.', 'For sequential blocks, keep the dominant growing term; for nested repeated work, consider multiplication.', 'Analyze extra memory separately from runtime.'],
    scenario: 'One loop over n items is typically O(n). Two independent loops one after another are still O(n). A loop nested inside another loop over n items is commonly O(n²). Binary search is O(log n) because it removes about half of the remaining search space each step.',
    mistake: 'Do not say O(2n) or O(n + 5) as the final Big-O. Constants and lower-order terms are normally removed, so both simplify to O(n).',
    interview: 'State the complexity and then justify it with the structure of the code: “This is O(n) because each element is visited once.”'
  },
  {
    test: /array|list(?! comprehension)|string/i,
    mental: 'Arrays, lists, and strings are ordered sequences. The position of an item matters, so index-based access is usually the first operation to think about. Many interview problems are really about scanning, comparing, or maintaining information while moving through a sequence.',
    steps: ['Clarify whether the sequence can be changed or must remain unchanged.', 'Decide whether you need values, indices, or both.', 'Look for repeated work that could be replaced by one pass plus stored information.', 'Test empty, one-item, duplicate, and boundary cases.'],
    scenario: 'If you need the largest value in a list, one pass is enough: keep the best value seen so far and update it when a larger value appears. You do not need to sort the entire list first.',
    mistake: 'Be careful with index boundaries. The first index is 0, and the final valid index is length - 1.',
    interview: 'Explain whether your solution modifies the input and whether it needs extra memory proportional to the sequence size.'
  },
  {
    test: /hash ?map|dictionary|dict|hash ?set|set\b/i,
    mental: 'A hash map stores key-value relationships, while a set stores unique keys. Their main advantage is fast average-case membership or lookup, which often lets you replace repeated linear searches with a single pass.',
    steps: ['Choose what information should become the key.', 'Decide what value must be remembered for that key, such as a count or index.', 'During one pass, check whether the needed key was seen before.', 'Update the map or set only with information that future iterations need.'],
    scenario: 'In Two Sum, instead of comparing every pair, store each number and its index. For the current number x, check whether target - x has already been seen.',
    mistake: 'A dictionary is not automatically the answer; choose keys that directly support the lookup the problem repeatedly asks for.',
    interview: 'Mention the trade-off: extra memory can reduce runtime from a nested scan to approximately one pass.'
  },
  {
    test: /two pointers?/i,
    mental: 'Two pointers use two positions that move through the same sequence, often from opposite ends or at different speeds. The pattern works when moving a pointer lets you safely eliminate possibilities without checking every pair.',
    steps: ['Define exactly what each pointer represents.', 'State the condition that tells you which pointer can move.', 'Move at least one pointer every iteration so the loop makes progress.', 'Stop when the pointers cross or the required condition is satisfied.'],
    scenario: 'For a sorted pair-sum problem, start one pointer at the smallest value and one at the largest. If the sum is too small, move the left pointer right; if it is too large, move the right pointer left.',
    mistake: 'Two pointers are not magic on unsorted data; the property that makes pointer movement safe must be clear.',
    interview: 'Explain why moving one pointer cannot skip a valid answer. That justification is more important than merely naming the pattern.'
  },
  {
    test: /sliding window/i,
    mental: 'A sliding window represents a contiguous range. Instead of recomputing information for every possible range, update the current window when the right side expands and the left side shrinks.',
    steps: ['Define what must be true for a valid window.', 'Expand the right boundary to include new data.', 'While the window violates the condition, move the left boundary and remove its contribution.', 'Update the best answer at the correct point in the loop.'],
    scenario: 'For the longest substring without repeated characters, extend the right edge one character at a time. If a duplicate appears inside the current window, move the left edge past the earlier copy.',
    mistake: 'Do not reset the entire window unnecessarily; the advantage comes from reusing work from the previous window.',
    interview: 'State what your window represents and the invariant that remains true after the shrinking step.'
  },
  {
    test: /stack|queue|deque/i,
    mental: 'A stack is last-in, first-out; a queue is first-in, first-out. The ordering rule determines which previously seen item becomes available next.',
    steps: ['Ask which earlier item you need to revisit first.', 'Use push/pop for LIFO behavior or enqueue/dequeue for FIFO behavior.', 'Store only the information needed later.', 'Handle the empty-structure case explicitly.'],
    scenario: 'Balanced-bracket checking uses a stack because the most recently opened bracket must be the first one closed. Breadth-first search uses a queue because earlier discovered nodes should be processed first.',
    mistake: 'Choosing a stack when the problem needs arrival order, or a queue when it needs reverse/nested order, usually produces complicated code.',
    interview: 'Explain the ordering requirement first, then name the data structure that naturally provides it.'
  },
  {
    test: /binary search/i,
    mental: 'Binary search works because a sorted or otherwise monotonic search space lets you discard half of the remaining possibilities after each comparison.',
    steps: ['Define the search interval and whether its boundaries are inclusive.', 'Compute the middle position.', 'Use the comparison to decide which half cannot contain the answer.', 'Update the boundary so the search space strictly shrinks.'],
    scenario: 'Searching a sorted list of 1,024 items takes at most about 10 halving steps because 2¹⁰ = 1,024.',
    mistake: 'Most binary-search bugs are boundary bugs: mixing inclusive and exclusive intervals or updating lo/hi without removing mid.',
    interview: 'Say what property makes the search space monotonic. Binary search is about that property, not only about arrays.'
  },
  {
    test: /tree|binary search tree|bst/i,
    mental: 'A tree models hierarchical relationships. Each node can lead to child subproblems, so recursive thinking and traversal order are central. In a binary search tree, ordering adds the rule that smaller and larger keys belong on predictable sides.',
    steps: ['Identify the information stored at each node.', 'Choose traversal order based on when the node itself should be processed.', 'Define the base case for a missing child.', 'Combine results returned from child subtrees.'],
    scenario: 'In-order traversal of a valid binary search tree visits values in sorted order. That happens because the traversal processes left subtree, node, then right subtree.',
    mistake: 'Do not assume every binary tree is balanced or every binary tree is a binary search tree.',
    interview: 'State the traversal (preorder, inorder, postorder, or level order) and explain why that order matches the problem.'
  },
  {
    test: /heap|priority queue/i,
    mental: 'A heap keeps the most important item accessible without fully sorting everything. A min-heap exposes the smallest item; a max-heap exposes the largest.',
    steps: ['Decide what “highest priority” means.', 'Push candidates as they become available.', 'Pop when you need the next best candidate.', 'Keep the heap bounded if you only need the top k items.'],
    scenario: 'To track the 10 largest values from a stream, keep a min-heap of size 10. When a larger value arrives, replace the smallest value currently in the heap.',
    mistake: 'A heap does not keep every element globally sorted; it only guarantees the priority element at the top.',
    interview: 'Compare heap operations, usually O(log n), with fully sorting the entire dataset when only the next best item is needed.'
  },
  {
    test: /graph|bfs|dfs|breadth|depth/i,
    mental: 'A graph represents entities and connections. Traversal is about systematically visiting reachable nodes while preventing repeated work. BFS explores by distance layers; DFS follows one path deeply before backtracking.',
    steps: ['Choose an adjacency representation.', 'Track visited nodes so cycles do not cause infinite work.', 'Use a queue for BFS or a stack/recursion for DFS.', 'Record extra information such as parent or distance only if the problem needs it.'],
    scenario: 'If every edge has equal cost and you need the fewest number of edges from A to B, BFS is a natural choice because it explores all nodes at distance 1 before distance 2.',
    mistake: 'Forgetting a visited structure can make traversal repeat nodes indefinitely in cyclic graphs.',
    interview: 'Explain why BFS or DFS matches the required result rather than choosing based on habit.'
  },
  {
    test: /recursion|recursive/i,
    mental: 'Recursion solves a problem by reducing it to smaller instances of the same problem. Every recursive solution needs a base case and a recursive step that moves toward that base case.',
    steps: ['Write the smallest case that can be answered directly.', 'Define how the current problem becomes a smaller problem.', 'Assume the recursive call correctly solves the smaller problem.', 'Combine that smaller result with the current step.'],
    scenario: 'For factorial, factorial(1) is the base case. factorial(n) becomes n × factorial(n - 1), so every call moves toward 1.',
    mistake: 'If the recursive input does not get closer to the base case, the calls never stop.',
    interview: 'Mention recursion depth and whether an iterative solution could avoid extra call-stack space.'
  },
  {
    test: /dynamic programming|\bdp\b|memoization|tabulation/i,
    mental: 'Dynamic programming is useful when a problem has repeated subproblems and the final answer can be built from smaller answers. The key is defining the state precisely.',
    steps: ['Define what one DP state means in a complete sentence.', 'Write the transition: how larger states depend on smaller states.', 'Set base cases.', 'Choose memoization (top-down) or tabulation (bottom-up), then compute each state once.'],
    scenario: 'For climbing stairs, let dp[i] mean the number of ways to reach step i. If you can move 1 or 2 steps, then dp[i] = dp[i-1] + dp[i-2].',
    mistake: 'Do not start by building a table. First define the state and recurrence; otherwise the table has no clear meaning.',
    interview: 'Say the state, transition, base cases, computation order, and final time/space complexity.'
  },
  {
    test: /sorting|sort algorithm|merge sort|quick sort/i,
    mental: 'Sorting reorganizes data according to an ordering rule. Different algorithms trade simplicity, runtime, memory, stability, and worst-case behavior.',
    steps: ['Clarify the ordering key.', 'Decide whether you need a custom comparator or key function.', 'Ask whether stability or in-place behavior matters.', 'Avoid sorting when the problem only needs a smaller operation such as min, max, or top k.'],
    scenario: 'If you only need the smallest item, a single O(n) scan is enough; sorting the entire collection at O(n log n) performs unnecessary work.',
    mistake: 'Using sorting automatically can hide a more direct linear-time solution.',
    interview: 'If you sort, include the sorting cost in the final complexity analysis.'
  },
  {
    test: /variables?|data types?|types and values/i,
    mental: 'A variable is a name that refers to a value. The value has a type, and that type determines which operations make sense. In Python, the name itself is not permanently tied to one type.',
    steps: ['Identify the value being stored.', 'Know its type and the operations that type supports.', 'Track reassignment: a variable name can later refer to a different value.', 'Convert types explicitly when input data arrives as text but arithmetic is required.'],
    scenario: 'If age = "20", age is a string. age + "1" produces text concatenation, while int(age) + 1 produces the number 21.',
    mistake: 'A common bug is assuming user input is numeric when it is actually a string.',
    interview: 'Explain mutability and type conversion with one small example instead of only listing built-in types.'
  },
  {
    test: /conditionals?|if statements?|boolean logic/i,
    mental: 'A conditional chooses which code path runs based on a Boolean expression. Conditions should be ordered from the most specific case to more general cases when the cases overlap.',
    steps: ['Translate the requirement into true/false conditions.', 'Check whether any conditions overlap.', 'Place more specific cases before broader cases.', 'Make sure the else branch represents all remaining possibilities.'],
    scenario: 'FizzBuzz checks divisibility by both 3 and 5 before checking either one separately. Otherwise 15 would match the 3 condition first and never reach FizzBuzz.',
    mistake: 'Overlapping conditions in the wrong order can make a later branch impossible to reach.',
    interview: 'Walk through one boundary input and explain exactly which branch executes and why.'
  },
  {
    test: /loops?|iteration|for loop|while loop/i,
    mental: 'A loop repeats work. A for loop is convenient when iterating over a known sequence or range; a while loop is useful when repetition should continue until a condition changes.',
    steps: ['Define what changes each iteration.', 'Define when the loop must stop.', 'Keep updates inside the loop easy to trace.', 'Test the first and last iteration to catch boundary errors.'],
    scenario: 'range(1, n + 1) produces 1 through n because Python includes the start but stops before the end value.',
    mistake: 'A while loop that never changes the value used in its condition can become infinite.',
    interview: 'Be able to trace the loop manually for a tiny input and state how many iterations it performs.'
  },
  {
    test: /functions?|parameters?|arguments?|return value/i,
    mental: 'A function packages one responsibility behind a clear interface. Parameters are inputs; return values are outputs. Good functions make assumptions explicit and avoid unnecessary side effects.',
    steps: ['Define what inputs the function receives.', 'Decide the exact output it should return.', 'Keep the function focused on one responsibility.', 'Test normal, empty, and boundary inputs.'],
    scenario: 'A function total(nums) should receive a list and return one numeric result. Printing the total is different from returning it because callers cannot directly reuse printed output.',
    mistake: 'Forgetting return causes Python to return None, even if the function printed the correct-looking value.',
    interview: 'Describe the function contract: input types, output type, and important edge cases.'
  },
  {
    test: /exception|error handling|try|except/i,
    mental: 'Exception handling separates expected failure cases from normal logic. Catch errors you can handle meaningfully and let unexpected errors remain visible during development.',
    steps: ['Identify the operation that can fail.', 'Catch the narrowest relevant exception.', 'Return or report a useful fallback or error.', 'Avoid swallowing unrelated exceptions.'],
    scenario: 'Division can raise ZeroDivisionError. Catching that specific error lets the program report an understandable message while other programming bugs still surface.',
    mistake: 'A broad except: pass hides bugs and makes failures difficult to diagnose.',
    interview: 'Explain which failures are expected and which should propagate rather than saying “I would catch every exception.”'
  },
  {
    test: /encapsulation|inheritance|polymorphism|composition|class|object-oriented|oop/i,
    mental: 'Object-oriented design groups state and behavior around meaningful objects. The goal is not to create many classes; it is to create clear responsibilities and controlled interactions.',
    steps: ['Identify the object’s responsibility.', 'Keep its internal state valid through methods or clear interfaces.', 'Prefer composition when one object simply uses another.', 'Use inheritance only when there is a genuine is-a relationship and substitutability makes sense.'],
    scenario: 'A ShoppingCart can contain a list of Product objects. That is composition: the cart has products. Making ShoppingCart inherit from Product would not model the relationship correctly.',
    mistake: 'Creating inheritance only to reuse code can create tight coupling and confusing class hierarchies.',
    interview: 'Explain encapsulation and composition with a concrete domain example, then discuss why that design is easier to change or test.'
  },
  {
    test: /select statement|where clause|sql basics|querying/i,
    mental: 'A SQL query describes the result set you want rather than a loop that manually processes rows. SELECT chooses columns, FROM chooses the source, and WHERE filters rows before they reach later stages.',
    steps: ['Start from the table or tables containing the needed data.', 'Select only the columns you need.', 'Filter rows with WHERE.', 'Then add grouping, ordering, or limits if the requirement asks for them.'],
    scenario: 'SELECT name FROM Employees WHERE salary > 8000 returns only the name column for employees whose salary passes the condition.',
    mistake: 'Do not use SELECT * automatically in production queries when only a few columns are needed.',
    interview: 'Describe the logical purpose of each clause and verify the result with a small sample table.'
  },
  {
    test: /join|joins/i,
    mental: 'A join combines rows from related tables using a matching condition. The join type determines what happens to rows that do not find a match.',
    steps: ['Identify the relationship key in both tables.', 'Choose INNER JOIN if unmatched rows should disappear.', 'Choose LEFT JOIN if all rows from the left table must remain.', 'Check whether the relationship can create multiple matching rows.'],
    scenario: 'Joining Orders to Customers on customer_id lets each order include customer information. A LEFT JOIN would also keep an order even if its customer row were missing.',
    mistake: 'A missing or incorrect ON condition can create a huge Cartesian product.',
    interview: 'Explain the expected row count and how unmatched rows should behave before writing the join.'
  },
  {
    test: /group by|aggregation|aggregate|count\(|sum\(|avg\(/i,
    mental: 'Aggregation reduces many rows into summary values. GROUP BY defines which rows belong to the same group, and aggregate functions calculate one result per group.',
    steps: ['Decide what one output row should represent.', 'Put that grouping key in GROUP BY.', 'Apply COUNT, SUM, AVG, MIN, or MAX to the values being summarized.', 'Use HAVING for conditions on aggregate results.'],
    scenario: 'GROUP BY department with AVG(salary) produces one row per department and calculates the average salary inside each group.',
    mistake: 'WHERE filters individual rows before grouping; HAVING filters groups after aggregation.',
    interview: 'State what one result row represents. That sentence usually reveals the correct GROUP BY keys.'
  },
  {
    test: /window function|over\(|partition by|common table expression|\bcte\b/i,
    mental: 'Window functions compute information across related rows without collapsing those rows into a single group. CTEs give a complex query an intermediate named step so the logic is easier to reason about.',
    steps: ['Define the rows that belong in the window with PARTITION BY.', 'Define ordering if the calculation depends on sequence.', 'Choose the window function such as ROW_NUMBER, RANK, SUM, or AVG.', 'Use a CTE when separating stages makes the query easier to verify.'],
    scenario: 'ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) can number employees from highest to lowest salary inside each department while keeping every employee row.',
    mistake: 'GROUP BY and window functions solve different problems: GROUP BY collapses rows; window functions usually preserve them.',
    interview: 'Explain the partition and ordering in words before writing the OVER clause.'
  },
  {
    test: /index|database index|transaction|acid|normalization/i,
    mental: 'Database design balances correctness, query speed, write cost, and maintainability. Indexes accelerate specific lookups but cost storage and write work; transactions protect multi-step changes that must succeed or fail together.',
    steps: ['Start from the access pattern: what queries must be fast?', 'Add indexes that support those filters, joins, or ordering patterns.', 'Use transactions for related writes that must remain consistent.', 'Measure rather than assuming an index will always help.'],
    scenario: 'An index on users(email) can speed up login lookup by email, but every insert or email update must also maintain that index.',
    mistake: 'Adding indexes to every column increases write cost and storage without necessarily improving real queries.',
    interview: 'Connect each index or transaction choice to a concrete query or consistency requirement.'
  },
  {
    test: /http|rest|api endpoint|request|response|status code/i,
    mental: 'An API is a contract between a client and server. A request carries method, path, headers, and possibly a body; the response carries a status code, headers, and data. REST-style APIs use these pieces consistently to represent operations on resources.',
    steps: ['Define the resource and endpoint.', 'Choose the HTTP method that matches the operation.', 'Validate input before business logic runs.', 'Return a meaningful status code and predictable response schema.'],
    scenario: 'POST /orders can validate the submitted order, create it, and return 201 Created with the new order representation. Invalid input should return a 4xx response rather than a server crash.',
    mistake: 'Returning 200 for every outcome makes clients guess whether the operation actually succeeded.',
    interview: 'Describe the endpoint contract, validation, failure responses, and idempotency expectations.'
  },
  {
    test: /authentication|authorization|jwt|oauth|permission/i,
    mental: 'Authentication answers “who are you?” while authorization answers “what are you allowed to do?” A secure system performs both at the correct trust boundary.',
    steps: ['Verify identity using an appropriate credential or session.', 'Load the permissions or role associated with that identity.', 'Check authorization for the specific resource or action.', 'Never trust a client-provided role without server-side verification.'],
    scenario: 'A logged-in user may be authenticated but still forbidden from deleting another user’s account. Authentication succeeded; authorization should deny the action.',
    mistake: 'Hiding a button in the frontend is not authorization. The server must enforce permissions too.',
    interview: 'Clearly separate identity verification from permission checking.'
  },
  {
    test: /git|commit|branch|merge|rebase|pull request/i,
    mental: 'Git records snapshots of project history. Branches are movable references to commits, which makes isolated work cheap. Merging or rebasing combines histories in different ways.',
    steps: ['Make a focused change.', 'Review the diff before committing.', 'Create a commit with a meaningful message.', 'Synchronize and resolve conflicts carefully before sharing the final history.'],
    scenario: 'A feature branch lets you build and test a change without moving the main branch until the work is ready for review.',
    mistake: 'Committing unrelated changes together makes reviews, debugging, and rollback harder.',
    interview: 'Explain what a commit and branch actually represent, then describe how you would safely resolve a conflict.'
  },
  {
    test: /linux|shell|command line|filesystem|permissions|process|ssh|environment variable/i,
    mental: 'The command line exposes files, processes, permissions, environment, and networking as composable tools. Learn what each command reads, what it changes, and what it writes.',
    steps: ['Confirm the current directory and target path.', 'Use commands that inspect state before commands that modify it.', 'Understand permissions and ownership before changing them.', 'Use pipes and redirection to connect small tools instead of doing everything manually.'],
    scenario: 'ps can inspect running processes, grep can filter output, and a pipe connects them so you can search for a particular process without writing a custom program.',
    mistake: 'Running destructive commands without checking the current path or target first can remove the wrong files.',
    interview: 'Be comfortable diagnosing a simple issue using pwd, ls, cat, grep, ps, environment variables, logs, and network tools.'
  },
  {
    test: /tcp|udp|dns|ip address|subnet|http networking|network layer|osi|routing/i,
    mental: 'Networking is a layered path from one process to another. Names resolve to addresses, packets are routed between networks, and transport protocols define how endpoints exchange data.',
    steps: ['Identify the source and destination process.', 'Resolve names to addresses when DNS is involved.', 'Determine the transport behavior needed, such as reliable ordered delivery with TCP.', 'Trace where latency or failure could occur along the path.'],
    scenario: 'Opening a website may involve DNS resolution, a TCP connection, TLS setup, an HTTP request, and an HTTP response. Each stage can fail for a different reason.',
    mistake: 'DNS, IP, TCP, TLS, and HTTP are related but not interchangeable; each solves a different layer of the communication problem.',
    interview: 'Walk through what happens when you type a URL into a browser, one layer at a time.'
  },
  {
    test: /unit test|integration test|test case|testing strategy|mock|fixture/i,
    mental: 'Testing checks behavior against expectations. Unit tests isolate small logic; integration tests verify that components work together. Good tests protect important behavior, not implementation trivia.',
    steps: ['Define the behavior being protected.', 'Arrange the required state or inputs.', 'Act by calling the code under test.', 'Assert the observable result, including important failure cases.'],
    scenario: 'A unit test can check a price-calculation function with fixed inputs. An integration test can verify that creating an order writes the expected database record.',
    mistake: 'Tests that only repeat the implementation can pass while the real requirement is still wrong.',
    interview: 'Explain what belongs in unit versus integration tests and how you keep tests deterministic.'
  },
  {
    test: /debug|breakpoint|stack trace|logging|root cause/i,
    mental: 'Debugging is evidence-driven narrowing. Start from the observed failure, form a small hypothesis, gather evidence, and change one thing at a time until you identify the root cause.',
    steps: ['Reproduce the problem consistently.', 'Read the exact error and stack trace.', 'Reduce the failing path and inspect relevant state.', 'Fix the cause, then add a regression test when possible.'],
    scenario: 'If an API returns 500, first inspect the server log and stack trace rather than changing random code. The failing line usually narrows which assumption was wrong.',
    mistake: 'Making several speculative changes at once destroys the evidence about which change actually fixed the issue.',
    interview: 'Describe a structured debugging process rather than saying you would “add print statements everywhere.”'
  },
  {
    test: /load balanc|cache|scalability|replication|sharding|message queue|system design/i,
    mental: 'System design is the process of matching requirements to components and trade-offs. Start with traffic, data, latency, consistency, and availability before choosing technologies.',
    steps: ['Clarify functional and scale requirements.', 'Draw the simplest working architecture.', 'Identify the first likely bottleneck.', 'Add caching, replication, queues, partitioning, or other complexity only to solve a stated problem.'],
    scenario: 'A read-heavy service may place a cache between the API and database to reduce repeated database work, but then must define expiration and stale-data behavior.',
    mistake: 'Adding every scaling technology at the start makes the design harder to explain and may solve problems the system does not have.',
    interview: 'State assumptions and trade-offs explicitly. A clear simple design is better than a complicated diagram with no reasoning.'
  },
  {
    test: /supervised|regression|classification|machine learning|feature|training data/i,
    mental: 'Machine learning learns a mapping or pattern from data instead of encoding every decision by hand. The core workflow is data preparation, training, validation, evaluation, and iteration.',
    steps: ['Define the target and the information available at prediction time.', 'Split data so evaluation is performed on unseen examples.', 'Choose a simple baseline.', 'Train, evaluate with an appropriate metric, and inspect errors before increasing complexity.'],
    scenario: 'For spam classification, the model learns from labeled examples, but evaluation must use messages that were not used to fit the model.',
    mistake: 'Data leakage can make validation scores look excellent while the model fails in real use.',
    interview: 'Explain the baseline, split strategy, metric, and error analysis before discussing advanced models.'
  },
  {
    test: /overfitting|underfitting|validation|train.*test|metric|precision|recall|f1|regularization/i,
    mental: 'Evaluation asks whether the model generalizes beyond its training data. Overfitting means the model learned training-specific patterns that do not transfer; underfitting means it has not captured enough useful structure.',
    steps: ['Keep training, validation, and final test purposes separate.', 'Choose metrics that match the real cost of mistakes.', 'Compare training and validation behavior.', 'Use regularization, data improvements, or model changes based on the observed error pattern.'],
    scenario: 'For a rare-fraud detector, accuracy can be misleading because predicting “not fraud” almost always may still score highly. Precision and recall reveal more useful behavior.',
    mistake: 'Repeatedly tuning against the test set turns the test set into another validation set and weakens the final estimate.',
    interview: 'Connect the metric to the product consequence of false positives and false negatives.'
  },
  {
    test: /neural network|backprop|gradient descent|activation|loss function/i,
    mental: 'A neural network composes weighted transformations. Training measures error with a loss function, computes how parameters contributed to that error using backpropagation, and adjusts parameters with an optimizer.',
    steps: ['Run a forward pass to produce predictions.', 'Compute loss against the target.', 'Backpropagate gradients through the computational graph.', 'Update parameters and repeat over many batches.'],
    scenario: 'If a prediction is too high, the gradient tells each parameter the direction and relative sensitivity needed to reduce the loss on the next update.',
    mistake: 'Backpropagation computes gradients; the optimizer uses those gradients to update parameters. They are related but not the same step.',
    interview: 'Explain forward pass, loss, gradients, and update in that order without relying only on equations.'
  },
  {
    test: /attention|transformer|self-attention|multi-head/i,
    mental: 'Attention lets each token build a context-aware representation by weighting information from other tokens. Transformers repeat attention and feed-forward blocks so representations become increasingly contextual.',
    steps: ['Represent tokens as vectors.', 'Compute query, key, and value projections.', 'Use query-key similarity to produce attention weights.', 'Combine value vectors using those weights, then continue through the block.'],
    scenario: 'In “The animal did not cross the street because it was tired,” attention can help the representation of “it” incorporate information from “animal” rather than treating the word in isolation.',
    mistake: 'Attention weights are part of the computation, but a single attention score should not automatically be interpreted as a complete explanation of model reasoning.',
    interview: 'Explain what query, key, and value are conceptually before discussing the matrix formula.'
  },
  {
    test: /embedding|vector similarity|cosine similarity/i,
    mental: 'An embedding maps an item such as text into a numeric vector where useful semantic relationships can be compared mathematically. Similar meaning often corresponds to vectors that are near each other under a chosen similarity measure.',
    steps: ['Choose what unit you are embedding, such as a sentence or document chunk.', 'Generate vectors with the same embedding model.', 'Store and index those vectors.', 'Compare a query vector with stored vectors and retrieve the closest candidates.'],
    scenario: 'A query about “refund policy” may retrieve a chunk titled “returning a purchase” even if the exact phrase “refund policy” is not present, because their embeddings can be semantically similar.',
    mistake: 'Embeddings do not guarantee factual relevance; retrieval quality still depends on chunking, data quality, filters, and evaluation.',
    interview: 'Explain embeddings as a retrieval representation, then discuss similarity, indexing, and evaluation.'
  },
  {
    test: /prompt|structured output|function calling|tool calling|llm/i,
    mental: 'An LLM application should treat model output as an uncertain component inside normal software boundaries. Define the task clearly, constrain the output shape when possible, validate results, and handle failure.',
    steps: ['Provide the minimum context needed for the task.', 'Specify the expected output format or schema.', 'Validate model output before using it in downstream code.', 'Measure quality, latency, and cost with representative examples.'],
    scenario: 'If an app needs a JSON object with name and priority, request a structured schema and validate those fields instead of parsing arbitrary prose.',
    mistake: 'A stronger prompt cannot replace validation, authorization, or deterministic business rules.',
    interview: 'Discuss evaluation and failure handling, not only prompt wording.'
  },
  {
    test: /rag|retrieval augmented|chunk|rerank|hybrid search|citation/i,
    mental: 'RAG separates knowledge retrieval from generation. The system first finds relevant source material, then asks the model to answer using that context. Quality therefore depends on retrieval as much as generation.',
    steps: ['Split source documents into meaningful retrievable units.', 'Index them with lexical, vector, or hybrid retrieval.', 'Retrieve and optionally rerank candidates for the query.', 'Generate an answer grounded in selected context and preserve citations.', 'Evaluate retrieval and answer quality separately.'],
    scenario: 'If the correct policy paragraph never reaches the model, better prompting cannot recover the missing evidence. Retrieval recall must be fixed first.',
    mistake: 'Evaluating only whether the final answer “sounds good” hides retrieval failures and unsupported claims.',
    interview: 'Draw ingestion, retrieval, reranking, generation, citation, and evaluation as separate stages.'
  },
  {
    test: /agent|tool use|agentic|memory|planning|stopping rule|guardrail/i,
    mental: 'An agent is a control loop around a model: observe state, decide the next action, call an allowed tool, update state, and stop when a defined condition is met. Reliability comes from constraining this loop.',
    steps: ['Define the goal and explicit state.', 'Expose only necessary tools with validated arguments.', 'Define when human approval is required.', 'Set retry limits, stopping rules, and audit logs.', 'Evaluate both task success and unsafe or unnecessary actions.'],
    scenario: 'A procurement agent may search approved suppliers automatically but require human approval before creating a purchase request that spends money.',
    mistake: 'Giving an agent unrestricted tools without permissions, budgets, or stopping conditions turns ordinary model mistakes into real side effects.',
    interview: 'Explain state, tools, approvals, retries, observability, and stopping rules as engineering components—not just “the model plans.”'
  },
  {
    test: /docker|container|image|dockerfile/i,
    mental: 'A container packages an application with its runtime dependencies into an isolated process environment. An image is the immutable template; a container is a running instance of that image.',
    steps: ['Define a reproducible image with a Dockerfile.', 'Keep the image small and avoid storing secrets inside it.', 'Pass runtime configuration through environment or secret systems.', 'Expose only the ports and files the service needs.'],
    scenario: 'The same built image can run in development, CI, and production while environment variables provide different database URLs or credentials.',
    mistake: 'Putting secrets into an image layer can expose them even if a later Dockerfile line deletes the file.',
    interview: 'Explain image versus container, layers, ports, volumes, and environment configuration.'
  },
  {
    test: /kubernetes|k8s|pod|deployment|service/i,
    mental: 'Kubernetes manages desired state for containerized workloads. You declare how many instances and what configuration you want; controllers continually work to make the actual cluster match that desired state.',
    steps: ['Package the workload as a container image.', 'Describe pods through a Deployment or similar controller.', 'Expose stable networking with a Service when needed.', 'Add health checks, resource limits, configuration, and observability.'],
    scenario: 'If a pod crashes under a Deployment that requests three replicas, Kubernetes can create a replacement so the desired replica count returns to three.',
    mistake: 'Kubernetes does not fix a broken application design; it automates deployment and recovery of the workload you give it.',
    interview: 'Explain Pod, Deployment, Service, readiness, liveness, and configuration at a conceptual level.'
  },
  {
    test: /cloud|serverless|availability zone|region|object storage/i,
    mental: 'Cloud platforms provide compute, storage, networking, and managed services through APIs. The engineering challenge is choosing the simplest service that meets reliability, latency, security, and cost requirements.',
    steps: ['Identify the workload and data characteristics.', 'Choose the minimum managed services needed.', 'Design for failure across instances or zones when required.', 'Monitor usage, latency, errors, and cost.'],
    scenario: 'Static files can live in object storage behind a CDN instead of requiring an application server to serve every file request.',
    mistake: 'Cloud does not automatically make an application scalable or secure; architecture and configuration still matter.',
    interview: 'Connect each cloud service to a requirement rather than listing vendor products.'
  },
  {
    test: /security|injection|xss|csrf|secret|least privilege|threat model/i,
    mental: 'Security starts by identifying assets, trust boundaries, possible attackers, and the actions they should not be able to perform. Controls should reduce specific risks rather than being added randomly.',
    steps: ['Identify trusted and untrusted inputs.', 'Validate and encode data at the correct boundary.', 'Use least privilege for users and services.', 'Protect secrets and sensitive data.', 'Log important security events without leaking sensitive information.'],
    scenario: 'Parameterized SQL queries keep user input separate from SQL syntax, preventing input from being interpreted as executable query structure.',
    mistake: 'Client-side validation improves usability but cannot replace server-side validation because clients can be bypassed.',
    interview: 'Name the threat, the boundary, and the control that mitigates it.'
  }
];

function guideFor(course, lesson) {
  const concepts = list(lesson.concepts).join(' ');
  const text = [course.id, course.title, lesson.title, concepts, lesson.explanation, lesson.description].join(' ');
  return GUIDES.find(guide => guide.test.test(text)) || null;
}

function fallbackSteps(course, lesson, profile) {
  const title = cleanTitle(lesson.title);
  const concepts = list(lesson.concepts).slice(0, 4);
  const objectives = list(lesson.objectives).slice(0, 3);
  const steps = [];
  if (objectives.length) {
    steps.push(`Start by stating the lesson goal in your own words: ${objectives[0]}`);
  } else {
    steps.push(`Define ${title} in one sentence before trying to use it.`);
  }
  if (concepts.length) {
    steps.push(`Connect the key ideas (${concepts.join(', ')}) instead of memorizing them as separate terms.`);
  } else {
    steps.push('Identify the inputs, the operation or decision being made, and the expected output.');
  }
  steps.push('Work through one small example manually and predict the result before checking it.');
  steps.push('Change one part of the example and explain what should change and what should stay the same.');
  return steps;
}

function scenarioFor(course, lesson, guide) {
  if (guide && guide.scenario) return guide.scenario;
  const ex = list(lesson.examples || lesson.example)[0];
  if (ex) {
    return `Use the example already shown in the lesson as a trace exercise. Before running or accepting the result, go through it one step at a time and explain why each intermediate value or decision occurs. The important skill is predicting the result, not only recognizing it after you see it.`;
  }
  const title = cleanTitle(lesson.title);
  return `Imagine you need to use ${title} in a small production feature. Write down the input, the required result, and one failure or edge case. Then explain how this concept helps move from the input to the result. This turns the definition into an engineering decision rather than something to memorize.`;
}

function deeperText(course, lesson, profile, guide) {
  const title = cleanTitle(lesson.title);
  const base = sentence(lesson.explanation || lesson.explain || lesson.description);
  const concepts = list(lesson.concepts).slice(0, 5);
  const objective = list(lesson.objectives)[0];
  const p1 = base || `${title} is one of the building blocks in ${course.title || 'this course'}. The goal is to understand the behavior well enough to recognize when it should be used and to predict what it will do.`;
  let p2 = guide && guide.mental ? guide.mental : profile.mental;
  if (concepts.length) {
    p2 += ` As you study it, connect the lesson to these ideas: ${concepts.join(', ')}.`;
  }
  if (objective) {
    p2 += ` A useful test of understanding is whether you can ${String(objective).replace(/^./, c => c.toLowerCase())}` + (/[.!?]$/.test(String(objective)) ? '' : '.');
  }
  return [p1, p2];
}

function expansionHtml(course, lesson) {
  const profile = profileFor(course);
  const guide = guideFor(course, lesson);
  const title = cleanTitle(lesson.title);
  const paragraphs = deeperText(course, lesson, profile, guide);
  const steps = guide && guide.steps ? guide.steps : fallbackSteps(course, lesson, profile);
  const existingMistakes = list(lesson.commonMistakes || lesson.commonMistake);
  const mistakes = unique([
    ...existingMistakes,
    guide && guide.mistake ? guide.mistake : profile.mistake,
    `Do not move on from ${title} only because the example looks familiar. Make sure you can predict the result of a slightly changed example without looking at the answer.`
  ]).slice(0, 4);
  const practical = guide && guide.practical ? guide.practical : profile.practical;
  const interview = guide && guide.interview ? guide.interview : profile.interview;
  const scenario = scenarioFor(course, lesson, guide);
  const concepts = list(lesson.concepts).slice(0, 3);
  const check1 = concepts.length
    ? `Can you explain how ${concepts.join(', ')} connect to ${title} without reading the lesson?`
    : `Can you explain ${title} in your own words without repeating the definition?`;
  const check2 = `Can you make a small example of ${title}, predict the result, and explain one edge case or failure case?`;

  return `<section class="lesson-deep-dive" data-expanded-lesson>
<h3>Deeper explanation</h3>
${paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}
<h3>How to think about it step by step</h3>
<ol class="deep-steps">${steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol>
<h3>Worked scenario</h3>
<div class="deep-scenario"><p>${esc(scenario)}</p></div>
<h3>Why this matters</h3>
<p>${esc(practical)}</p>
<h3>Common pitfalls</h3>
<ul>${mistakes.map(m => `<li>${esc(m)}</li>`).join('')}</ul>
<h3>Interview / practical takeaway</h3>
<div class="deep-takeaway"><p>${esc(interview)}</p></div>
<h3>Check yourself</h3>
<ul class="deep-check"><li>${esc(check1)}</li><li>${esc(check2)}</li></ul>
</section>`;
}

const STYLE = `<style id="csai-expanded-lessons-style">
.lesson-deep-dive{margin-top:20px;padding-top:4px;border-top:1px solid var(--border)}
.lesson-deep-dive h3{margin-top:22px!important;margin-bottom:8px!important;font-size:1.02rem!important}
.lesson-deep-dive p,.lesson-deep-dive li{line-height:1.75!important}
.deep-steps{margin:8px 0 4px;padding-left:24px}.deep-steps li{margin:7px 0}
.deep-scenario,.deep-takeaway{margin:9px 0;padding:13px 14px;border:1px solid var(--border);border-radius:10px;background:var(--bg)}
.deep-scenario{border-left:4px solid var(--accent)}
.deep-takeaway{border-left:4px solid #16805b}
.deep-scenario p,.deep-takeaway p{margin:0}
.deep-check{margin-bottom:4px}.deep-check li{margin:6px 0}
</style>`;

let pages = 0;
let lessonsExpanded = 0;

for (const file of fs.readdirSync(coursesDir).filter(name => name.endsWith('.html'))) {
  const id = file.replace(/\.html$/, '');
  const dataPath = path.join(courseDataDir, `${id}.json`);
  if (!fs.existsSync(dataPath)) throw new Error(`Missing course data for ${id}`);
  const course = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const lessons = lessonOrder(course);
  const pagePath = path.join(coursesDir, file);
  let html = fs.readFileSync(pagePath, 'utf8');

  html = html.replace(/<style\b[^>]*\bid=["']csai-expanded-lessons-style["'][^>]*>[\s\S]*?<\/style>\s*/gi, '');
  const head = html.toLowerCase().lastIndexOf('</head>');
  html = head >= 0 ? html.slice(0, head) + STYLE + '\n' + html.slice(head) : STYLE + '\n' + html;

  lessons.forEach((entry, index) => {
    const lesson = entry.lesson;
    const lessonId = lesson.id || `lesson-${index}`;
    const attrValue = esc(lessonId);
    const pattern = new RegExp(`(<details class="lesson" data-lesson="${rx(attrValue)}"[\\s\\S]*?<div class="body">)([\\s\\S]*?)(<\\/div><\\/details>)`);
    const match = html.match(pattern);
    if (!match) throw new Error(`Could not locate lesson ${lessonId} in ${file}`);
    const originalBody = match[2].replace(/<section class="lesson-deep-dive"[\s\S]*?<\/section>\s*/g, '');
    const expanded = expansionHtml(course, lesson);
    html = html.replace(pattern, `${match[1]}${originalBody}${expanded}${match[3]}`);
    lessonsExpanded++;
  });

  fs.writeFileSync(pagePath, html, 'utf8');
  pages++;
}

if (pages !== 54) throw new Error(`Expected 54 course pages, expanded ${pages}`);
if (lessonsExpanded < 54) throw new Error(`Expected many lessons to be expanded, found ${lessonsExpanded}`);
console.log(`Expanded the existing content of ${lessonsExpanded} lessons across ${pages} courses without adding lessons.`);
