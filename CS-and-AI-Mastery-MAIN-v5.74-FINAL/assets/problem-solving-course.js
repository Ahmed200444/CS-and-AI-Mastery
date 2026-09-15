(() => {
  'use strict';

  const lessons = [
    ['Read the problem carefully','Identify the inputs, outputs, constraints, and exact success condition before thinking about code.','Rewrite one prompt as a clear input-output specification.','Coding immediately after reading only the example.','Strong problem solvers reduce ambiguity before implementation.'],
    ['Work through examples','Use the provided examples, then create one normal case, one edge case, and one invalid or extreme case.','Build a small example table for a new problem.','Copying examples without explaining why each output occurs.','Examples reveal hidden rules and prevent incorrect assumptions.'],
    ['Translate words into rules','Convert phrases such as “strictly increasing,” “at most,” and “exactly once” into precise conditions.','Translate five natural-language conditions into boolean expressions.','Treating similar phrases as identical.','Precise interpretation is essential in assessments and real requirements.'],
    ['Separate required from optional','Distinguish what the solution must guarantee from what would merely be convenient.','Mark every sentence in a prompt as input, output, constraint, example, or note.','Adding assumptions not supported by the prompt.','This avoids solving a different problem than the one asked.'],
    ['Start with a simple solution','A clear brute-force method is often the best first step because it proves understanding and creates a correctness baseline.','Write pseudocode for the simplest correct approach.','Trying to optimize before a correct approach exists.','Interviewers value a correct baseline and a clear improvement path.'],
    ['Write pseudocode first','Describe the algorithm in plain steps without syntax details. Each step should be small enough to translate directly into code.','Write pseudocode for checking whether an array forms a valley.','Writing vague steps such as “process the data.”','Good pseudocode makes implementation and explanation easier.'],
    ['Choose useful state','Decide what information must be remembered while scanning, such as a count, best value, index, set, or previous item.','List the minimum state needed for a one-pass maximum problem.','Tracking many variables without knowing their purpose.','Choosing the right state often determines the whole solution.'],
    ['Recognize counting problems','When the question asks how many times something occurs, frequency maps or counters are often useful.','Solve a character-frequency task on paper.','Using nested loops for every count.','Counting appears in data processing, logs, and interviews.'],
    ['Recognize lookup problems','When you repeatedly ask whether something has appeared before, use a set or dictionary instead of rescanning.','Explain why Two Sum stores seen[value] = index.','Storing the wrong relationship between keys and values.','Fast lookup changes many O(n²) solutions into O(n).'],
    ['Recognize contiguous-range problems','Words such as subarray, substring, consecutive, and window suggest scanning a contiguous range.','Classify three prompts as fixed-window, dynamic-window, or not a window problem.','Using sliding window when negative values or conditions break its assumptions.','Pattern recognition speeds up assessments.'],
    ['Recognize ordered-search problems','Sorted data or a monotonic condition may allow binary search or two pointers.','Choose between binary search and two pointers for four scenarios.','Using binary search without a monotonic search space.','Order can reduce large searches dramatically.'],
    ['Break the task into functions','Separate parsing, validation, core logic, and formatting when it makes the solution clearer.','Split a mixed solution into two or three named helpers.','Creating helpers that merely rename one line.','Decomposition improves testing and debugging.'],
    ['Handle edge cases deliberately','Check empty input, one element, duplicates, negative values, boundaries, and the smallest valid size.','Create an edge-case checklist for a valley-array function.','Adding random special cases without connecting them to constraints.','Many hidden tests target boundaries rather than normal cases.'],
    ['Dry-run with a trace table','Track index, current value, and important variables after every iteration.','Trace Two Sum or a running-maximum solution in a table.','Skipping iterations mentally and missing the first wrong state.','Dry-running builds reliable reasoning without a debugger.'],
    ['Prove why it works','Explain the invariant: what remains true after each step and why the final state gives the answer.','Write a two-sentence correctness explanation for a one-pass algorithm.','Saying “it works because I tested it.”','Correctness explanations are valuable in interviews and reviews.'],
    ['Analyze time complexity','Count how work grows with input size, including nested loops, sorting, lookups, and helper calls.','Compare an O(n²) and O(n) solution for duplicate detection.','Assuming every dictionary operation is always free.','Complexity helps choose solutions that scale.'],
    ['Analyze space complexity','Count extra memory created by the algorithm, excluding the input unless copied.','Compare a set-based solution with an in-place solution.','Ignoring recursion stacks and copied slices.','Space trade-offs matter in large systems and interviews.'],
    ['Test systematically','Use normal cases, boundaries, adversarial cases, and a case that distinguishes your approach from a tempting wrong approach.','Write six tests for a second-largest-distinct function.','Testing only the sample input.','Systematic testing catches logical errors before submission.'],
    ['Debug the first wrong step','Find the earliest point where actual state differs from expected state instead of focusing only on the final wrong output.','Trace a failing case and mark the first incorrect variable.','Changing several lines before locating the fault.','This is the fastest way to fix logic bugs.'],
    ['Improve without losing clarity','After correctness, improve unnecessary repeated work while preserving readable names, structure, and tests.','Refactor a nested-loop lookup using a set or dictionary.','Replacing clear code with a clever but fragile trick.','Companies prefer maintainable efficiency over unexplained cleverness.'],
    ['Communicate your solution','State the approach, key data structure, complexity, and major edge cases before or after coding.','Give a sixty-second explanation of one solved problem.','Narrating every syntax detail instead of the reasoning.','Clear communication strongly affects interview performance.'],
    ['Timed problem-solving workflow','Use a repeatable sequence: understand, examples, simple approach, pattern, pseudocode, code, tests, complexity, review.','Complete one easy problem using a 25-minute timer and record each phase.','Spending most of the time stuck on one untested idea.','A structured workflow improves consistency under assessment pressure.']
  ];

  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const KEY = 'cs-ai-problem-solving-lessons';
  const getDone = () => new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));

  function render(){
    if(window.CSAIMasteryPracticeFolder?.currentTrack?.() !== 'problem-solving') return;
    const old = document.getElementById('full-study-track');
    if(!old || old.dataset.problemSolving === 'true') return;
    const done = getDone();
    const section = document.createElement('section');
    section.id = 'full-study-track';
    section.dataset.track = 'problem-solving';
    section.dataset.problemSolving = 'true';
    section.innerHTML = `<div class="fst-head"><div><div class="fst-kicker">COMPLETE PROBLEM-SOLVING TRACK</div><h2>Problem Solving — ${lessons.length} Lessons, Practice & Project</h2><p>Learn a repeatable method for understanding, solving, testing, debugging, and explaining technical problems.</p></div><div class="fst-progress"><strong>${done.size}/${lessons.length}</strong><span>lessons complete</span></div></div><div class="fst-lessons">${lessons.map((l,i)=>`<details class="fst-lesson" ${i===0?'open':''}><summary><span class="fst-num">${String(i+1).padStart(2,'0')}</span><span>${esc(l[0])}</span><label><input type="checkbox" data-ps-lesson="${i}" ${done.has(i)?'checked':''}> Done</label></summary><div class="fst-body"><h4>Explanation</h4><p>${esc(l[1])}</p><h4>Practice</h4><p>${esc(l[2])}</p><div class="fst-note fst-mistake"><strong>Common mistake</strong><span>${esc(l[3])}</span></div><div class="fst-note fst-career"><strong>Why this matters</strong><span>${esc(l[4])}</span></div></div></details>`).join('')}</div><div class="fst-after"><div><h3>Exercises</h3><p>Solve problems in increasing difficulty and include your pseudocode, tests, and complexity notes.</p></div><div><h3>Interview review</h3><p>Practise explaining your approach before coding and summarizing trade-offs afterward.</p></div><div><h3>Final GitHub project</h3><p>Publish a problem-solving portfolio with at least 20 solutions, trace tables, tests, complexity analysis, bug reflections, and a README that explains your workflow.</p><code>student-code/practice/problem-solving/</code></div></div>`;
    old.replaceWith(section);
    section.addEventListener('change', event => {
      if(!event.target.matches('[data-ps-lesson]')) return;
      const current = getDone();
      const index = Number(event.target.dataset.psLesson);
      event.target.checked ? current.add(index) : current.delete(index);
      localStorage.setItem(KEY, JSON.stringify([...current]));
      section.querySelector('.fst-progress strong').textContent = `${current.size}/${lessons.length}`;
    });
  }

  const start = () => {
    render();
    new MutationObserver(() => setTimeout(render, 25)).observe(document.body,{childList:true,subtree:true});
    window.addEventListener('hashchange',()=>setTimeout(render,100));
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded',start) : start();
})();