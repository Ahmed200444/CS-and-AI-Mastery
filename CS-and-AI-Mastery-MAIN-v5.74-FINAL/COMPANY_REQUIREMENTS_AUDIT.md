# ByteDance + Revolut Curriculum Integration Audit

**Audit date:** 2026-08-13  
**Integration rule:** Company requirements are used to strengthen the existing technical curriculum. No new ByteDance- or Revolut-named course was added.

## Result

- Catalog courses: **57**
- Company-named courses newly added: **0**
- Existing courses improved: **13**
- New lessons added across those courses: **35**
- Total lessons after integration: **654**

## What was added, by existing course

### Python — 6 lessons
- Iterators & generators
- Decorators: wrapping behavior cleanly
- Context managers & resource safety
- Type hints, dataclasses & clean interfaces
- Python concurrency: threads, asyncio, locks & race conditions
- Decimal & money-safe arithmetic

### DSA — 8 lessons
- Recursion & backtracking
- Heaps & priority queues
- Divide and conquer
- Greedy algorithms
- Dynamic programming
- Intervals & sweep-line patterns
- Monotonic stacks & queues
- Build a set / hash table from scratch

### Databases — 7 lessons
- Transaction isolation levels & anomalies
- Optimistic vs pessimistic locking
- Query plans, EXPLAIN & index trade-offs
- Redis caching & database consistency
- B+ trees & LSM trees
- MySQL & PostgreSQL production fundamentals
- Schema migrations & safe database changes

### Testing — 2 lessons
- TDD in practice: Red → Green → Refactor
- Testing concurrent & transactional behavior

### Data Engineering — 2 lessons
- Apache Kafka: topics, partitions & consumer groups
- Apache Airflow: DAGs, scheduling, retries & backfills

### Cloud Computing — 1 lesson
- GCP fundamentals for application & data workloads

### Computer Architecture & OS — 2 lessons
- Address spaces, segmentation & memory protection
- File systems, system calls & I/O

### Networking — 1 lesson
- Routing protocols: OSPF & BGP fundamentals

### Distributed Systems — 2 lessons
- Consensus fundamentals: Raft & Paxos
- Distributed storage: replication & erasure coding

### Backend — 1 lesson
- Async FastAPI, concurrency & request safety

### Software Architecture — 1 lesson
- CQRS & DDD fundamentals

### System Design — 1 lesson
- Designing a distributed data storage service

### Data Science — 1 lesson
- Model-ready data preprocessing pipelines

## ByteDance coverage map

The website now covers the major themes found across current ByteDance software/backend/infrastructure internship material:

- **Programming / Python:** Python course
- **DSA:** DSA course (Big-O, arrays/lists, hash tables, linked lists, stacks/queues, trees, graphs, searching/sorting, divide-and-conquer, backtracking, heaps, greedy, DP and interview patterns)
- **Operating systems:** Computer Architecture & OS (processes/threads, synchronization/deadlocks, paging, segmentation/address spaces, file systems/system calls)
- **Networking:** Networking (OSI/TCP-IP, TCP/UDP, IP, HTTP/HTTPS/TLS, DNS, routing, OSPF/BGP)
- **Databases:** Databases + SQL (relational/NoSQL, transactions, isolation, indexes/query plans, PostgreSQL/MySQL)
- **Caching:** Databases (Redis and cache/database consistency)
- **Distributed systems:** Distributed Systems (CAP, replication, consistency, locks, messaging, Raft/Paxos, erasure coding)
- **Kafka:** Data Engineering
- **Git:** Git
- **Cloud/deployment:** Cloud Computing, Docker, Kubernetes, Deployment
- **Generative AI / BytePlus:** Generative AI, GANs, VAEs, PyTorch, TensorFlow, Data Science preprocessing, Deep Learning

## Revolut Python coverage map

The website now covers the stack and engineering themes from the current Revolut 2027 Python internship:

- **Python 3:** Python
- **SQL:** SQL
- **PostgreSQL:** Databases
- **Kafka:** Data Engineering
- **Airflow:** Data Engineering
- **Kubernetes:** Kubernetes
- **Docker:** Docker
- **GCP:** Cloud Computing
- **TDD:** Testing
- **Scalable APIs:** Backend + APIs
- **Data pipelines:** Data Engineering
- **Distributed systems:** Distributed Systems + System Design
- **Transactions / isolation / locking / concurrency:** Databases + Python + Testing
- **SOLID / clean design:** OOP + Software Architecture
- **Money-safe arithmetic:** Python Decimal lesson

## Deliberate non-duplication

The audit did **not** add separate “ByteDance DSA”, “Revolut Python”, “Revolut SQL”, or “Company Interview Prep” courses. Shared requirements improve the core courses once, so studying the normal roadmap prepares you broadly rather than duplicating the same topic under multiple company labels.

## Source basis

The requirement map was built from current official ByteDance internship/job material (Dubai backend, foundation software, network automation and BytePlus GenAI roles) and Revolut's current 2027 Software Engineer (Python) internship listing. Candidate reports were used only as secondary evidence for practical interview emphasis; they were not treated as guaranteed interview formats.
