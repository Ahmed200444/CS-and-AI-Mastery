# Repetition Audit — OOP Merge & Curriculum Cleanup

## Resolved

- **Standalone OOP course vs Python/Aptech OOP:** merged into Python → Aptech Beginner 9. The legacy OOP URL now redirects there and the old course is hidden from the catalog.
- **Aptech Python duplicate beginner chapters:** strings, control flow, loops, collections, functions, exceptions, and file I/O now map to one canonical Python lesson set instead of appearing twice. Unique Aptech chapters (environment, modules, regex) remain explicit.
- **Web Development vs Frontend Development:** Frontend owns HTML/CSS/DOM/React fundamentals. Web Development is now Full-Stack Web Integration (browser/server lifecycle, responsibilities, APIs/data flow, deployment, architecture).
- **Deployment vs CI/CD:** Deployment now focuses on production runtime concerns (health/readiness, artifacts, configuration, observability, scaling, shutdown, smoke validation). CI/CD remains the dedicated build/release automation course.
- **System Design vs Distributed Systems CAP lesson:** Distributed Systems teaches CAP itself; System Design now applies consistency/availability requirements to architecture decisions.
- **DSA core vs Aptech DSA:** merged repeated Big-O, arrays, linked lists, stacks/queues, trees, graphs, and searching into canonical DSA lessons. The unique Python-reference/memory bridge remains, and sorting stays as two genuinely distinct chapters (quadratic sorts vs merge/quicksort).

## Intentionally retained overlaps

- **SQL vs Databases:** SQL teaches query language; Databases teaches storage, transactions, indexing internals, and schema design. Some shared vocabulary is prerequisite reinforcement, not duplicate lessons.
- **Computer Architecture & OS vs Advanced Computer Organization:** the latter is an explicit advanced continuation (pipelines, hazards, caches, TLB, coherence, performance).
- **Generative AI vs GANs/VAEs/Diffusion:** Generative AI is an overview/integration course; the model-family courses provide specialized depth.
- **PyTorch vs TensorFlow:** parallel framework implementations are intentionally separate.
- **System Design vs AI System Design:** general scalable-system design vs AI-specific model/retrieval/serving/cost/evaluation architecture.
- **Python OOP overview vs Software Architecture:** Python OOP establishes object-design foundations; Software Architecture expands SOLID principles/patterns into deeper codebase/service-level design.


## Requested mastery expansion review

- **Software Engineering in Practice:** kept focused on end-to-end professional delivery rather than duplicating the dedicated Git, Testing, Architecture, CI/CD, or Observability courses.
- **Classical AI:** adds search, CSPs, logic, reasoning, planning, uncertainty, and decision-making that were not previously covered as one coherent classical-AI curriculum.
- **Reinforcement Learning & Modern LLM Post-Training:** adds a dedicated progression from MDP/Q-learning through PPO and current preference/post-training workflows instead of scattering these topics across ML/LLM courses.
- **Large-Scale AI Training & Inference:** adds distributed model-training and serving systems rather than repeating ordinary Deployment/MLOps material.
- **MCP:** integrated as a 12-lesson module inside AI Agents because it is an agent/tool integration protocol, avoiding an unnecessary standalone duplicate course.
- Exact duplicate normalized lesson titles across the **61 visible courses** after this expansion: **0**.

## Final duplicate scan

- Visible catalog: **61 courses** plus **1 hidden legacy OOP compatibility route**.
- Visible curriculum after the C++/DSA addition: **791 lessons**; the hidden legacy OOP compatibility page retains 9 old lesson blocks only so old links/test coverage do not break (**800 generated lesson blocks total**).
- Exact duplicate normalized lesson titles across visible courses: **0**.
- Highest remaining same-course near-match: SQL **Aggregation** vs **GROUP BY & HAVING in depth**. Kept intentionally because the first introduces aggregate functions and the second develops grouping/filtering groups in depth.
- Course-level related pairs such as APIs/Backend, SQL/Databases, PyTorch/TensorFlow, MLOps/Observability, and System Design/Distributed Systems were reviewed and retained where they teach different layers or tools rather than duplicate curricula.
