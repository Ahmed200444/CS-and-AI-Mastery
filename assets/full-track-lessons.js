(() => {
  'use strict';

  const C = {
    'git-github': {name:'Git & GitHub', lessons:[
      ['Repositories and the Git workflow','Understand working directory, staging area, commits, and why Git records snapshots rather than simply saving files.','Create a repository, stage one file, commit it, then inspect the history.'],
      ['Branches','Use branches to develop safely without changing the stable version of a project.','Create a feature branch, make a change, and switch between branches.'],
      ['Merging and conflicts','Combine branches and resolve conflicts when two changes affect the same lines.','Create a small conflict and resolve it manually.'],
      ['Remote repositories','Connect local Git to GitHub using remotes, push, pull, and fetch.','Push a branch and pull a remote update.'],
      ['Pull requests and reviews','Use pull requests to explain, review, test, and merge changes.','Open a PR with a useful title, summary, and testing notes.'],
      ['Professional Git habits','Write clear commits, protect secrets, use .gitignore, tags, releases, and safe recovery commands.','Clean a short commit history and create a tagged release.'] ], project:'Publish a small project through a branch, pull request, review checklist, and release.'},
    linux:{name:'Linux & Command Line', lessons:[
      ['Terminal fundamentals','Learn commands, arguments, flags, paths, and how the shell interprets what you type.','Navigate a practice folder using pwd, ls, and cd.'],
      ['Files and directories','Create, copy, move, inspect, and remove files safely.','Use mkdir, touch, cp, mv, cat, and rm on sample files.'],
      ['Search and text processing','Find files and search text with find, grep, pipes, and redirection.','Search log files and save matching lines to a new file.'],
      ['Permissions and processes','Understand users, chmod, running processes, signals, and background jobs.','Change a script permission and inspect a running process.'],
      ['Environment and packages','Use environment variables, PATH, package managers, and virtual environments.','Create a Python environment and install a package.'],
      ['Bash scripting and SSH','Automate commands with variables, conditions, loops, scripts, and basic remote access.','Write a backup script and explain an SSH connection.'] ], project:'Build a command-line system health and backup toolkit.'},
    dsa:{name:'Data Structures & Algorithms', lessons:[
      ['Complexity and arrays','Measure time and space complexity and understand array access, updates, and traversal.','Compare two array solutions and state their Big-O complexity.'],
      ['Hash maps and sets','Use fast key lookup for counting, duplicates, complements, and grouping.','Solve Two Sum and a frequency-count problem.'],
      ['Two pointers and sliding window','Process ranges efficiently without checking every possible pair or subarray.','Solve one two-pointer and one fixed-window problem.'],
      ['Stacks, queues, and linked lists','Model last-in-first-out, first-in-first-out, and node-based sequences.','Validate brackets and implement a simple queue.'],
      ['Trees, heaps, and graphs','Traverse hierarchical and connected data using BFS and DFS.','Traverse a tree and find a shortest unweighted path.'],
      ['Recursion and dynamic programming','Break problems into repeated smaller states and store reusable results.','Solve a memoized staircase or coin-change problem.'] ], project:'Create an algorithm toolkit with tested solutions and complexity explanations.'},
    'problem-solving':{name:'Problem Solving', lessons:[
      ['Understand the problem','Translate wording into inputs, outputs, constraints, and examples.','Rewrite a problem as a precise specification.'],
      ['Break it into steps','Decompose a large problem into small testable operations.','Write pseudocode before coding.'],
      ['Choose a pattern','Recognize counting, lookup, traversal, window, recursion, and state patterns.','Match ten prompts to likely patterns.'],
      ['Handle edge cases','Identify empty input, duplicates, boundaries, invalid values, and large cases.','Create an edge-case checklist for a function.'],
      ['Test and debug reasoning','Trace variables, test assumptions, and isolate the first incorrect step.','Dry-run a failing case in a table.'],
      ['Improve the solution','Compare correctness, readability, performance, and maintainability.','Refactor a working but unclear solution.'] ], project:'Build a collection of solved problems with pseudocode, tests, and reflections.'},
    debugging:{name:'Debugging', lessons:[
      ['Reproduce the bug','Create a reliable minimal case before changing code.','Turn a vague report into exact reproduction steps.'],
      ['Read errors and traces','Interpret exception types, messages, stack traces, and failing lines.','Explain a Python traceback.'],
      ['Inspect program state','Use prints, logging, breakpoints, watches, and variable inspection.','Locate the first wrong variable value.'],
      ['Form and test hypotheses','Change one thing at a time and use evidence instead of guessing.','Write three hypotheses and tests for a bug.'],
      ['Debug APIs and data flows','Inspect requests, responses, status codes, schemas, and transformations.','Diagnose a malformed JSON response.'],
      ['Prevent regressions','Add a test that fails before the fix and passes afterward.','Create a regression test for a corrected bug.'] ], project:'Complete a bug-investigation lab with reports, fixes, and regression tests.'},
    testing:{name:'Software Testing', lessons:[
      ['Testing mindset','Understand why tests provide confidence rather than proving software is perfect.','Identify the most important behaviors to test.'],
      ['Unit tests','Test one function or class independently with clear arrange-act-assert structure.','Write tests for normal and boundary cases.'],
      ['Fixtures and mocks','Prepare reusable data and replace external dependencies safely.','Mock an API response in a test.'],
      ['Integration tests','Check whether components such as API, database, and services work together.','Test a complete request flow.'],
      ['Error and edge-case testing','Verify failures, invalid inputs, exceptions, and unusual boundaries.','Create a negative-test table.'],
      ['Coverage and CI','Use coverage intelligently and run tests automatically on every change.','Design a basic GitHub Actions test workflow.'] ], project:'Build and test a small Python service with unit and integration coverage.'},
    'software-engineering':{name:'Software Engineering Fundamentals', lessons:[
      ['Requirements','Turn user needs into functional requirements, constraints, and acceptance criteria.','Write requirements for a small feature.'],
      ['Modular design','Separate responsibilities into understandable components and interfaces.','Split a large script into modules.'],
      ['Clean code','Use clear names, small functions, consistent style, and useful documentation.','Refactor unclear code without changing behavior.'],
      ['Error handling and reliability','Validate inputs, handle failures, log useful context, and avoid silent errors.','Design failure behavior for a service.'],
      ['Collaboration workflow','Use issues, branches, reviews, documentation, and version control effectively.','Plan a feature from issue to merge.'],
      ['Trade-offs and maintenance','Balance speed, quality, complexity, performance, and future change.','Compare two designs and justify one.'] ], project:'Deliver a production-style feature case study from requirements through tests and review.'},
    apis:{name:'APIs', lessons:[
      ['HTTP and client-server basics','Understand clients, servers, requests, responses, URLs, endpoints, headers, and bodies.','Label every part of a sample HTTP request.'],
      ['HTTP methods','Use GET to read, POST to create, PUT/PATCH to update, and DELETE to remove resources.','Choose the correct method for ten scenarios.'],
      ['Status codes','Interpret successful, client-error, and server-error responses.','Match common status codes to situations.'],
      ['JSON and validation','Send structured request bodies and validate required fields and types.','Create and validate a JSON purchase request.'],
      ['Authentication','Understand API keys, bearer tokens, sessions, permissions, and safe secret storage.','Add a mock Authorization header correctly.'],
      ['Errors, rate limits, and pagination','Handle failures, retries, limits, timeouts, and multi-page data.','Write logic for a paginated, rate-limited endpoint.'] ], project:'Build and document a reliable REST API client and a small API service.'},
    'backend-development':{name:'Backend Development', lessons:[
      ['Backend architecture','Understand routes, controllers, services, repositories, databases, and external systems.','Draw the flow of one request.'],
      ['Building REST services','Create endpoints, parse requests, validate data, and return consistent responses.','Build CRUD endpoints with FastAPI.'],
      ['Databases and persistence','Store, query, update, and relate application data safely.','Connect an API to a small SQL database.'],
      ['Authentication and authorization','Identify users and control which actions each role may perform.','Protect an admin-only endpoint.'],
      ['Reliability and observability','Add logging, error handling, timeouts, retries, and health checks.','Diagnose a failed service request.'],
      ['Testing and deployment readiness','Test routes and services and prepare configuration for deployment.','Write API tests and a production checklist.'] ], project:'Build a tested task-management or procurement backend API.'},
    databases:{name:'Databases', lessons:[
      ['Data modeling','Turn real entities and relationships into tables, keys, and constraints.','Design a procurement schema.'],
      ['Normalization','Reduce duplication and update problems while keeping queries practical.','Normalize a messy table.'],
      ['Indexes','Understand how indexes speed reads and affect writes and storage.','Choose indexes for common queries.'],
      ['Transactions','Use atomicity, consistency, isolation, and durability for safe multi-step operations.','Design a purchase-and-payment transaction.'],
      ['Query planning','Read execution plans and identify scans, joins, and bottlenecks.','Compare two query plans.'],
      ['Database reliability','Handle migrations, backups, concurrency, permissions, and recovery.','Create a safe migration plan.'] ], project:'Create an application data layer with schema, migrations, indexes, and transactions.'},
    'computer-networks':{name:'Computer Networks', lessons:[
      ['Network layers','Understand how application data travels through protocols and network layers.','Trace a web request from browser to server.'],
      ['IP, ports, and routing','Understand addresses, ports, routers, private networks, and NAT.','Explain how a client reaches a server port.'],
      ['DNS','Learn how names are translated into addresses and how caching affects results.','Trace a DNS lookup.'],
      ['TCP and UDP','Compare reliable connections with lightweight datagrams.','Choose TCP or UDP for common applications.'],
      ['HTTP and TLS','Connect networking concepts to web requests and encrypted communication.','Explain the stages of an HTTPS connection.'],
      ['Diagnostics','Use ping, traceroute, nslookup/dig, curl, and connection tools.','Diagnose a simulated connectivity failure.'] ], project:'Build a network diagnostic toolkit and troubleshooting report.'},
    'web-development':{name:'Web Development', lessons:[
      ['HTML structure','Create semantic, accessible page structure using meaningful elements.','Build a simple structured page.'],
      ['CSS layout and responsive design','Use the box model, flexbox, grid, and media queries.','Create a responsive card layout.'],
      ['JavaScript fundamentals','Use variables, functions, arrays, objects, events, and DOM updates.','Build an interactive form.'],
      ['State and data','Manage UI state and display data returned from APIs.','Render a list from JSON.'],
      ['Accessibility and UX','Use labels, keyboard support, focus, contrast, and clear feedback.','Audit a form for accessibility.'],
      ['Testing and deployment','Test behavior, handle errors, optimize assets, and deploy a site.','Deploy a small app and verify it on mobile.'] ], project:'Build a responsive portfolio web application connected to an API.'},
    'machine-learning':{name:'Machine Learning', lessons:[
      ['ML problem framing','Distinguish classification, regression, clustering, and recommendation problems.','Frame a business problem as an ML task.'],
      ['Data preparation','Clean data, encode features, handle missing values, and split datasets correctly.','Prepare a small tabular dataset.'],
      ['Core models','Understand linear models, trees, nearest neighbors, and ensembles.','Train and compare two baseline models.'],
      ['Evaluation','Use suitable metrics, validation, confusion matrices, and error analysis.','Evaluate a classifier beyond accuracy.'],
      ['Overfitting and improvement','Use regularization, cross-validation, feature work, and tuning.','Diagnose an overfitting model.'],
      ['Inference and reproducibility','Save preprocessing and models and reproduce predictions reliably.','Create a simple inference script.'] ], project:'Build an evaluated prediction system with a reproducible inference pipeline.'},
    'deep-learning':{name:'Deep Learning', lessons:[
      ['Neural network foundations','Understand layers, weights, activations, forward passes, and learned representations.','Calculate the shape through a small network.'],
      ['Loss and optimization','Use loss functions, gradients, backpropagation, and optimizers.','Explain one training step.'],
      ['PyTorch workflow','Use tensors, datasets, DataLoaders, modules, optimizers, and training loops.','Train a small PyTorch network.'],
      ['Regularization','Use dropout, normalization, augmentation, and early stopping.','Improve an overfitting model.'],
      ['CNNs and sequence models','Understand architectures for images and sequential data.','Choose an architecture for a task.'],
      ['Evaluation and debugging','Track metrics, inspect failures, and diagnose unstable training.','Debug a training curve.'] ], project:'Train and evaluate a PyTorch classifier with documented experiments.'},
    transformers:{name:'Transformers', lessons:[
      ['Embeddings and tokens','Represent discrete tokens as vectors that models can process.','Inspect tokenization and embedding shapes.'],
      ['Attention intuition','Understand queries, keys, values, and weighted information gathering.','Work through a tiny attention example.'],
      ['Self-attention and masking','Model relationships within a sequence and control which positions can attend.','Compare encoder and causal masks.'],
      ['Transformer blocks','Combine attention, feed-forward layers, residual connections, and normalization.','Trace data through one block.'],
      ['Encoder and decoder models','Understand BERT-style, GPT-style, and encoder-decoder architectures.','Choose a model family for a task.'],
      ['Fine-tuning and evaluation','Adapt pretrained models and measure quality, cost, and failure modes.','Plan a fine-tuning experiment.'] ], project:'Create a transformer exploration notebook and fine-tuned text model.'},
    'hugging-face':{name:'Hugging Face', lessons:[
      ['Hub and model cards','Find models and understand licenses, intended use, limitations, and files.','Evaluate two model cards.'],
      ['Tokenizers','Load tokenizers and understand truncation, padding, and special tokens.','Tokenize a batch correctly.'],
      ['Pipelines and inference','Run pretrained models and interpret structured outputs.','Build a simple inference pipeline.'],
      ['Datasets','Load, transform, split, and batch datasets.','Prepare a dataset for training.'],
      ['Trainer and fine-tuning','Configure training, evaluation, checkpoints, and metrics.','Fine-tune a small model.'],
      ['Sharing and reproducibility','Save, document, and share models responsibly.','Write a model card for your result.'] ], project:'Fine-tune and document a transformer model with reproducible evaluation.'},
    'generative-ai':{name:'Generative AI', lessons:[
      ['Generative modeling','Understand how generative systems learn distributions and create new samples.','Compare discriminative and generative tasks.'],
      ['Autoencoders and VAEs','Learn latent representations, reconstruction, sampling, and the VAE objective.','Build or analyze a simple VAE.'],
      ['GANs','Understand generator-discriminator training, instability, and evaluation.','Trace a GAN training step.'],
      ['Diffusion models','Understand adding noise, denoising, conditioning, and sampling.','Explain a diffusion sampling process.'],
      ['Prompted generation','Control text and image generation using instructions, examples, and constraints.','Improve a weak prompt systematically.'],
      ['Evaluation and safety','Measure quality, diversity, hallucination, bias, and misuse risks.','Create an evaluation rubric.'] ], project:'Build a small generative-model studio with evaluation and documentation.'},
    llms:{name:'Large Language Models', lessons:[
      ['LLM foundations','Understand tokens, next-token prediction, context, parameters, and inference.','Explain what happens after sending a prompt.'],
      ['Prompt engineering','Use clear instructions, examples, roles, constraints, and decomposition.','Improve prompts for three tasks.'],
      ['Structured outputs','Make models produce validated JSON or schema-constrained responses.','Parse and validate a model response.'],
      ['Model APIs','Call models, handle streaming, configuration, errors, cost, and latency.','Build a small LLM API client.'],
      ['Evaluation','Create test cases and score correctness, usefulness, safety, and consistency.','Build a small evaluation set.'],
      ['Guardrails and production concerns','Handle hallucinations, prompt injection, privacy, limits, and fallbacks.','Design safe behavior for a business assistant.'] ], project:'Build an evaluated LLM application with structured outputs and safeguards.'},
    rag:{name:'Retrieval-Augmented Generation', lessons:[
      ['Why RAG','Understand how retrieval supplies external knowledge and reduces unsupported answers.','Identify when RAG is appropriate.'],
      ['Document processing','Load, clean, split, and attach metadata to documents.','Design chunks for a policy document.'],
      ['Embeddings and vector search','Represent meaning as vectors and retrieve similar chunks.','Run or trace a similarity search.'],
      ['Retrieval quality','Use filters, hybrid search, reranking, and query rewriting.','Improve a weak retrieval result.'],
      ['Answer generation and citations','Build grounded prompts and show evidence for claims.','Generate an answer with cited sources.'],
      ['RAG evaluation','Measure retrieval recall, answer correctness, faithfulness, latency, and cost.','Create a RAG evaluation dataset.'] ], project:'Build a cited knowledge-base assistant with retrieval and answer evaluation.'},
    'ai-agents':{name:'AI Agents', lessons:[
      ['Agent foundations','Understand goals, state, observations, actions, and the agent loop.','Diagram a simple agent cycle.'],
      ['Tool and function calling','Define tools with clear schemas, validate arguments, and return results.','Create tools for supplier search and budget checks.'],
      ['Planning and routing','Break goals into steps and select the right tool or specialist.','Plan a multi-step procurement task.'],
      ['Memory and state','Store short-term workflow state and carefully selected long-term memory.','Design an agent state object.'],
      ['Reliability and guardrails','Use approvals, permissions, retries, timeouts, stopping conditions, and injection defenses.','Handle a failing or unsafe tool call.'],
      ['Evaluation and observability','Trace decisions and measure task success, tool accuracy, cost, latency, and safety.','Build an agent test suite.'] ], project:'Build a procurement agent with RAG, tools, state, approvals, tests, and traces.'},
    'model-deployment':{name:'Model Deployment', lessons:[
      ['Inference services','Wrap a model in a reliable API with validated inputs and outputs.','Create a prediction endpoint.'],
      ['Packaging dependencies','Pin versions, separate configuration, and make environments reproducible.','Prepare deployment requirements.'],
      ['Performance','Measure latency, throughput, memory, batching, caching, and model size.','Profile an inference request.'],
      ['Reliability','Use health checks, timeouts, retries, fallbacks, and graceful failures.','Design failure handling.'],
      ['Monitoring','Track technical metrics, model quality, drift, errors, and usage.','Create a monitoring plan.'],
      ['Release strategy','Use versions, staged rollouts, rollback, and model governance.','Plan a safe model update.'] ], project:'Deploy a monitored ML or LLM inference service.'},
    docker:{name:'Docker', lessons:[
      ['Containers and images','Understand images, containers, layers, registries, and isolation.','Run and inspect a container.'],
      ['Dockerfiles','Build reproducible images using FROM, WORKDIR, COPY, RUN, and CMD.','Write a Dockerfile for a Python API.'],
      ['Volumes and networking','Persist data and connect services securely.','Connect an API and database container.'],
      ['Compose','Define and run multi-service applications.','Create a Compose file.'],
      ['Security and optimization','Use small images, non-root users, secrets, and efficient layers.','Improve an unsafe Dockerfile.'],
      ['Debugging containers','Inspect logs, processes, ports, files, and health checks.','Diagnose a container startup failure.'] ], project:'Containerize an AI application with health checks and multiple services.'},
    cloud:{name:'Cloud Fundamentals', lessons:[
      ['Cloud concepts','Understand compute, storage, networking, managed services, regions, and shared responsibility.','Map an app to cloud components.'],
      ['Identity and secrets','Use roles, least privilege, secret managers, and secure configuration.','Design service permissions.'],
      ['Deploying services','Deploy web APIs and background jobs using managed or virtualized compute.','Plan an API deployment.'],
      ['Storage and databases','Choose object, block, file, relational, or NoSQL storage.','Select storage for several workloads.'],
      ['Observability and reliability','Use logs, metrics, alerts, redundancy, backups, and recovery.','Create an operations checklist.'],
      ['Cost and scaling','Estimate usage, autoscale responsibly, cache, and control spending.','Compare two deployment options.'] ], project:'Deploy an observable AI service with secure configuration and cost notes.'},
    'system-design':{name:'System Design', lessons:[
      ['Requirements and constraints','Clarify users, features, scale, latency, consistency, security, and cost.','Write requirements for an AI procurement platform.'],
      ['High-level architecture','Divide systems into clients, APIs, services, data stores, queues, and external dependencies.','Draw a high-level design.'],
      ['Data and communication','Choose schemas, APIs, synchronous calls, events, and queues.','Design a purchase-request flow.'],
      ['Scaling and caching','Handle load using horizontal scaling, caching, partitioning, and asynchronous work.','Identify likely bottlenecks.'],
      ['Reliability and security','Plan redundancy, retries, idempotency, permissions, auditing, and disaster recovery.','Design safe tool execution.'],
      ['AI system design','Combine LLMs, RAG, agents, evaluations, guardrails, monitoring, and human approval.','Design a production AI agent architecture.'] ], project:'Create and present a GenAI solution architecture with trade-offs and failure handling.'}
  };

  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const completedKey = slug => `cs-ai-full-lessons-${slug}`;
  const getDone = slug => new Set(JSON.parse(localStorage.getItem(completedKey(slug)) || '[]'));
  const saveDone = (slug,set) => localStorage.setItem(completedKey(slug), JSON.stringify([...set]));

  function courseRoot(){ return document.querySelector('main') || document.querySelector('[role="main"]') || document.body; }
  function render(slug){
    const cfg=C[slug], root=courseRoot();
    const old=document.getElementById('full-study-track');
    if(old) old.remove();
    if(!cfg || ['python','sql','oop'].includes(slug) || !root) return;
    const done=getDone(slug);
    const box=document.createElement('section');
    box.id='full-study-track'; box.dataset.track=slug;
    box.innerHTML=`<div class="fst-head"><div><div class="fst-kicker">COMPLETE STUDY TRACK</div><h2>${esc(cfg.name)} — Lessons, Practice & Project</h2><p>Study the lessons in order, complete each practice task, then continue to the interactive labs already on this page.</p></div><div class="fst-progress"><strong>${done.size}/${cfg.lessons.length}</strong><span>lessons complete</span></div></div><div class="fst-lessons">${cfg.lessons.map((l,i)=>`<details class="fst-lesson" ${i===0?'open':''}><summary><span class="fst-num">${String(i+1).padStart(2,'0')}</span><span>${esc(l[0])}</span><label><input type="checkbox" data-lesson="${i}" ${done.has(i)?'checked':''}> Done</label></summary><div class="fst-body"><h4>Explanation</h4><p>${esc(l[1])}</p><h4>Practice</h4><p>${esc(l[2])}</p></div></details>`).join('')}</div><div class="fst-after"><div><h3>Exercises</h3><p>Complete the existing interactive tasks below this study track. Repeat any task you cannot explain without looking at the solution.</p></div><div><h3>Quick quiz</h3><p>After the lessons, explain the main concepts aloud and answer the course quiz before marking the track complete.</p></div><div><h3>Final GitHub project</h3><p>${esc(cfg.project)}</p><code>student-code/practice/${esc(slug)}/</code></div></div>`;
    const heading=[...root.querySelectorAll('h1,h2')].find(h=>h.textContent.toLowerCase().includes(cfg.name.toLowerCase().split(' ')[0]));
    const anchor=heading ? (heading.closest('section,article') || heading.parentElement) : root.firstElementChild;
    if(anchor && anchor.parentNode===root) anchor.insertAdjacentElement('afterend',box); else root.insertBefore(box,root.firstChild);
    box.addEventListener('change',e=>{ if(!e.target.matches('[data-lesson]'))return; const s=getDone(slug),n=Number(e.target.dataset.lesson); e.target.checked?s.add(n):s.delete(n); saveDone(slug,s); box.querySelector('.fst-progress strong').textContent=`${s.size}/${cfg.lessons.length}`; });
  }

  const style=document.createElement('style'); style.textContent=`
  #full-study-track{margin:28px 0;padding:24px;border:1px solid #d7dee7;border-radius:18px;background:#f8fafc;color:#15202b;font-family:inherit}
  .fst-head{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;margin-bottom:18px}.fst-kicker{font-size:12px;letter-spacing:.14em;font-weight:800;color:#17649a}.fst-head h2{margin:6px 0 8px;font-size:clamp(24px,3vw,38px)}.fst-head p{margin:0;max-width:760px;line-height:1.6}.fst-progress{min-width:120px;text-align:center;padding:14px;border-radius:14px;background:#162433;color:white}.fst-progress strong{display:block;font-size:24px}.fst-progress span{font-size:12px}.fst-lessons{display:grid;gap:10px}.fst-lesson{border:1px solid #d7dee7;border-radius:12px;background:white;overflow:hidden}.fst-lesson summary{display:grid;grid-template-columns:48px 1fr auto;gap:12px;align-items:center;padding:15px;cursor:pointer;font-weight:800}.fst-num{color:#17649a;font-size:18px}.fst-lesson label{font-size:13px;font-weight:600}.fst-body{padding:0 20px 18px 75px;border-top:1px solid #edf0f4}.fst-body h4{margin:16px 0 5px;color:#17649a}.fst-body p{margin:0;line-height:1.65}.fst-after{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px}.fst-after>div{padding:16px;border-radius:12px;background:#eaf2f8}.fst-after h3{margin:0 0 8px}.fst-after p{line-height:1.5}.fst-after code{display:block;overflow:auto;padding:8px;background:#162433;color:white;border-radius:7px}
  html[data-theme="dark"] #full-study-track{background:#111b25!important;color:#edf3f8!important;border-color:#344352!important}html[data-theme="dark"] .fst-lesson{background:#17212c!important;border-color:#344352!important}html[data-theme="dark"] .fst-body{border-color:#344352!important}html[data-theme="dark"] .fst-after>div{background:#17212c!important;color:#edf3f8!important}
  @media(max-width:760px){.fst-head{display:block}.fst-progress{margin-top:14px}.fst-after{grid-template-columns:1fr}.fst-lesson summary{grid-template-columns:40px 1fr}.fst-lesson label{grid-column:2}.fst-body{padding-left:20px}}
  `; document.head.appendChild(style);

  let last=''; function refresh(){const slug=window.CSAIMasteryPracticeFolder?.currentTrack?.(); if(slug!==last || !document.getElementById('full-study-track')){last=slug||'';render(slug);}}
  const start=()=>{refresh();new MutationObserver(()=>setTimeout(refresh,30)).observe(document.body,{childList:true,subtree:true});window.addEventListener('hashchange',()=>setTimeout(refresh,80));};
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
})();