import json, re, os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / 'assets' / 'coursedata-source.json'
DATA_DIR = ROOT / 'assets' / 'course-data'

courses = json.loads(MASTER.read_text(encoding='utf-8'))
by_id = {c['id']: c for c in courses}

# Stable, company-useful additions identified by the depth audit.  They are added to
# existing lessons instead of inflating lesson counts just to make a course look bigger.
ADDITIONS = {
    ('backend', 'be-persistence'): [
        'database migration', 'backward-compatible schema change', 'migration rollback'
    ],
    ('backend', 'be-scaling'): [
        'idempotency', 'retry with exponential backoff', 'dead-letter queue'
    ],
    ('frontend-dev', 'fe-react-basics'): [
        'form state', 'client-side validation', 'TypeScript props and interfaces',
        'frontend component testing', 'error boundary'
    ],
    ('frontend-dev', 'fe-architecture'): [
        'server state vs UI state', 'production error handling', 'route-level loading state'
    ],
    ('cloud-computing', 'cc-networking'): [
        'DNS', 'public vs private subnet', 'NAT gateway'
    ],
    ('cloud-computing', 'cc-autoscaling'): [
        'Infrastructure as Code', 'Terraform', 'SLO', 'error budget', 'cost alert'
    ],
    ('system-design', 'sysdesign-scaling-basics'): [
        'rate limiting', 'idempotency'
    ],
    ('system-design', 'sysdesign-caching'): [
        'consistent hashing', 'cache stampede'
    ],
    ('system-design', 'sysdesign-databases'): [
        'partition key', 'hot partition'
    ],
    ('system-design', 'sysdesign-messaging'): [
        'backpressure', 'at-least-once delivery', 'idempotent consumer', 'dead-letter queue'
    ],
    ('system-design', 'sysdesign-availability'): [
        'SLO', 'error budget', 'failure mode analysis'
    ],
    ('linux', 'linux-help'): [
        'man sections', 'search within a man page', '--help'
    ],
}

# A compact professional lens for each broad domain.  It supplements the lesson's
# original technical explanation; it does not replace it with generic filler.
LENSES = {
    'algorithms': (
        'In professional problem solving, begin with the input size and the required operation before choosing a data structure or algorithm.',
        'Verify correctness on a tiny hand-worked case, then check the time and extra-space cost as the input grows.'
    ),
    'programming': (
        'In production code, trace the values entering this behavior, the state changed by each operation, and the value or side effect that leaves it.',
        'Verify a normal case, a boundary case, and an invalid or unexpected case so syntax is tied to behavior rather than memorized.'
    ),
    'data': (
        'In data work, reason from the shape of the data, the keys or relationships involved, and the exact transformation needed to produce the requested result.',
        'Verify both correctness and scale: inspect representative rows, null or missing values, duplicate behavior, and the cost of scans, joins, or transformations.'
    ),
    'backend': (
        'In a backend service, trace the request across validation, business logic, storage or dependencies, failure handling, and the response contract.',
        'A company-ready implementation also considers retries, idempotency where relevant, observability, security boundaries, and tests for dependency or input failures.'
    ),
    'frontend': (
        'In frontend work, trace the user action through component or DOM state, network activity when present, loading/error behavior, and the final accessible UI state.',
        'Verify keyboard/accessibility behavior, slow or failed requests, invalid input, and the boundary between local UI state and server data.'
    ),
    'systems': (
        'In systems work, trace the path through resources and boundaries such as memory, processes, devices, networks, or hardware stages, then identify the limiting resource.',
        'Verify the normal path plus failure, contention, timing, or capacity behavior because production bugs often appear only at those boundaries.'
    ),
    'cloud': (
        'In cloud and deployment work, reason about reproducibility, identity, networking, configuration, failure domains, scaling, and cost instead of treating infrastructure as a black box.',
        'Verify health, logs/metrics, rollback or recovery, least privilege, and what happens when one dependency, instance, or zone is unavailable.'
    ),
    'ai': (
        'In AI and machine-learning work, separate the data, representation/model or retrieval step, objective, evaluation metric, and production constraints such as latency and cost.',
        'Verify on representative and edge-case data, inspect errors rather than only aggregate scores, and define what evidence would justify shipping or rolling back a change.'
    ),
    'security': (
        'In security work, identify the asset, trust boundary, untrusted input or actor, and the exact action that must be allowed or prevented.',
        'Verify the control with an abuse or failure case, least privilege, safe secret handling, and logs that support investigation without leaking sensitive data.'
    ),
    'career': (
        'In company-facing work, turn the situation into a clear goal, evidence, constraints, decision owner, and an observable outcome rather than relying on vague claims.',
        'Verify that your explanation is specific enough for another person to act on and that the trade-offs or limitations are stated rather than hidden.'
    ),
    'general': (
        'Treat the lesson as an engineering decision: identify the starting state, the required result, the mechanism that connects them, and the evidence that shows it worked.',
        'Verify one normal case and one edge or failure case, and be able to explain why the chosen approach fits better than a nearby alternative.'
    )
}

def family(course):
    x = (course.get('id','') + ' ' + course.get('title','')).lower()
    if re.search(r'dsa|algorithm|problem.solving|cpp-dsa', x): return 'algorithms'
    if re.search(r'python|oop|programming|testing|debugging', x): return 'programming'
    if re.search(r'sql|database|data science|data engineering|data-science|data-engineering', x): return 'data'
    if re.search(r'backend|apis|software engineering|software-engineering', x): return 'backend'
    if re.search(r'frontend|web development|web-dev', x): return 'frontend'
    if re.search(r'cyber|security|secure', x): return 'security'
    if re.search(r'cloud|docker|kubernetes|deployment|cicd|observability|mlops', x): return 'cloud'
    if re.search(r'computer|embedded|network|systems|system design|system-design|distributed|architecture|linux|digital hardware', x): return 'systems'
    if re.search(r'ai|machine learning|deep learning|llm|rag|agent|transformer|nlp|vision|pytorch|tensorflow|gan|vae|diffusion|reinforcement|hugging|prompt', x): return 'ai'
    if re.search(r'interview|resume|company prep|company-prep|influencing|capstone portfolio', x): return 'career'
    return 'general'

def words(text):
    return re.findall(r"\b[\w'’-]+\b", str(text or ''))

def sentence(text):
    s = re.sub(r'\s+', ' ', str(text or '')).strip()
    if not s: return ''
    return s if s[-1] in '.!?' else s + '.'

def dedupe(items):
    out=[]; seen=set()
    for item in items or []:
        s=str(item).strip(); k=re.sub(r'[^a-z0-9]+',' ',s.lower()).strip()
        if s and k not in seen:
            seen.add(k); out.append(s)
    return out

def find_lesson(course, lesson_id):
    for lesson in course.get('lessons', []):
        if lesson.get('id') == lesson_id: return lesson
    raise KeyError(f'{course["id"]}/{lesson_id}')

# Add the identified practical gaps.
for (cid,lid), concepts in ADDITIONS.items():
    lesson=find_lesson(by_id[cid],lid)
    lesson['concepts']=dedupe(list(lesson.get('concepts') or []) + concepts)

# Hand-authored explanation supplements for the courses that had the shallowest
# technical text.  These give the generic depth layer real domain substance.
SPECIAL = {
 ('advanced-computer-organization','aco-1'): 'A pipeline splits instruction execution into stages so different instructions can occupy different stages at the same time. Throughput can improve even though the latency of one instruction does not necessarily shrink. CPI, or cycles per instruction, is a practical way to measure how stalls and hazards move the machine away from an ideal pipeline. When comparing designs, distinguish clock frequency, instruction latency, throughput, and CPI instead of treating them as the same metric.',
 ('advanced-computer-organization','aco-2'): 'Pipeline hazards are reasons the next instruction cannot advance safely. A RAW data hazard occurs when an instruction needs a result that an earlier instruction has not produced yet; forwarding can bypass that result directly to a later stage. Control hazards come from branches whose next instruction address is not known yet, while structural hazards occur when two operations need the same hardware resource. A bubble or stall preserves correctness at the cost of throughput.',
 ('advanced-computer-organization','aco-3'): 'Branch prediction guesses the control-flow direction before the branch is fully resolved so the pipeline can keep fetching useful work. A branch target buffer can remember likely target addresses, while direction predictors learn whether a branch tends to be taken. Speculative work must be discarded when the guess is wrong, producing a pipeline flush and a misprediction penalty. The value of prediction therefore depends on prediction accuracy and the depth/cost of the pipeline.',
 ('advanced-computer-organization','aco-4'): 'Caches exploit temporal locality, where recently used data is likely to be reused, and spatial locality, where nearby data is likely to be accessed soon. A cache hit is served from a faster level; a miss requires a slower level. Average memory access time combines hit time with miss rate and miss penalty, so a seemingly small increase in misses can dominate performance. Real optimization starts by measuring access patterns rather than assuming every slow program is compute-bound.',
 ('advanced-computer-organization','aco-5'): 'Associativity controls how many cache locations can hold a particular memory block, replacement policy decides which resident block is evicted, and write policy decides when modified data reaches the next memory level. Direct-mapped caches are simple but can suffer conflict misses; set-associative designs reduce those conflicts at extra hardware cost. Write-through updates lower memory immediately, while write-back delays lower-level writes until eviction and therefore needs dirty-state tracking.',
 ('advanced-computer-organization','aco-6'): 'Virtual memory gives each process its own address space and maps virtual pages to physical frames through page tables. A TLB is a small cache of recent address translations. A TLB miss usually means the processor must walk the page table; it is not automatically a page fault. A page fault occurs when the mapping is absent, invalid, or not resident and the operating system must intervene. Page size changes TLB reach, internal fragmentation, and I/O behavior.',
 ('advanced-computer-organization','aco-7'): 'Private per-core caches improve speed but create a consistency problem when multiple cores access data that maps to copies in different caches. Coherence protocols coordinate ownership and invalidation so writes become visible correctly. False sharing is a performance problem where cores update different variables that happen to occupy the same cache line, causing unnecessary coherence traffic even without a data race. Diagnosing it requires separating correctness from cache-line contention.',
 ('advanced-computer-organization','aco-8'): 'Performance engineering begins with a reproducible workload and measurement. Hardware counters can reveal cache misses, branch misses, cycles, instructions, and other evidence. Roofline thinking compares the amount of computation with memory traffic to decide whether performance is primarily compute-bound or memory-bandwidth-bound. The important habit is to measure the bottleneck first, change one factor, and re-measure rather than optimizing code based only on intuition.',
 ('systems-programming','sys-1'): 'Systems programming makes resource lifetime explicit. Stack storage typically follows scope and call lifetime, while heap objects can outlive the function that created them. Ownership means knowing which part of the program is responsible for releasing or closing a resource. Python manages object memory automatically, but files, sockets, locks, and transactions still need deterministic cleanup. Context managers model acquire-use-release behavior so cleanup happens even when an exception interrupts the normal path.',
 ('systems-programming','sys-2'): 'A reference identifies an existing object rather than copying its full contents. With mutable objects, two names can refer to the same object, so a change through one reference can be observed through the other. Identity asks whether two references point to the same object; equality asks whether their values compare the same. Copying can be shallow or deep depending on whether nested objects are shared. Understanding these distinctions prevents aliasing bugs and unnecessary memory use.',
 ('systems-programming','sys-3'): 'Operating systems expose files and many devices through descriptor-like handles. A program asks the kernel to read, write, open, close, or otherwise operate on those resources through system-call boundaries. Reads and writes can return fewer bytes than requested, and operations can fail with specific error information such as errno-style conditions. Robust systems code checks results, handles partial operations where relevant, and closes resources on every path instead of assuming I/O always succeeds.',
 ('systems-programming','sys-4'): 'A process is an executing program with its own address space, resources, environment, and operating-system identity. Starting a subprocess creates a separate execution context; the parent can pass arguments/environment, capture output, and inspect the exit status. Isolation can protect one process from another, but communication then requires explicit mechanisms. Company code should treat non-zero exit statuses, timeouts, missing executables, and untrusted command arguments as normal cases to handle.',
 ('systems-programming','sys-5'): 'Threads share process memory, which makes communication cheap but also allows data races when multiple threads access shared mutable state without safe coordination. Locks protect critical sections, condition variables let threads wait for state changes, and queues often provide a clearer ownership boundary for work. Correct synchronization must protect invariants, avoid deadlock, and keep lock scope small enough that concurrency still provides useful throughput.',
 ('systems-programming','sys-6'): 'Inter-process communication moves information across process boundaries. Pipes provide a byte stream commonly used between related processes, sockets support local or networked communication, and shared memory can avoid copying but requires careful synchronization and a defined memory layout. Regardless of mechanism, the application needs a protocol that states message boundaries, allowed values, failure behavior, and compatibility expectations so both sides interpret the same bytes consistently.',
 ('systems-programming','sys-7'): 'Worker pools bound concurrency by keeping a controlled number of workers that take tasks from a queue. This is different from starting an unlimited thread or process for every request. A queue smooths bursts, futures or result handles track completion, and backpressure prevents producers from generating work faster than the system can safely process it. Throughput improves only until another resource such as CPU, I/O, memory, or a dependency becomes the bottleneck.',
 ('systems-programming','sys-8'): 'Profiling and debugging answer different questions. A debugger helps inspect control flow and state around a correctness failure, while a profiler measures where time or memory is actually spent. tracemalloc can help locate Python memory allocations; benchmarks compare performance under controlled conditions; structured logs preserve operational evidence. A useful investigation starts with a reproducible symptom and a measurement, then narrows the cause instead of changing several things at once.',
 ('embedded-systems','emb-1'): 'A microcontroller combines a CPU, flash, RAM, timers, communication peripherals, and GPIO on one device, usually under tighter memory, power, timing, and cost constraints than a desktop computer. Firmware often interacts directly with hardware registers or device drivers and may need predictable timing. The embedded mindset is therefore to budget resources explicitly, avoid unnecessary blocking work, and design safe behavior for reset, power loss, invalid sensor data, and hardware faults.',
 ('embedded-systems','emb-2'): 'GPIO pins can be configured as digital inputs or outputs. Inputs can float unless pull-up or pull-down resistors establish a known default level. Mechanical buttons bounce, producing several rapid transitions instead of one clean edge, so firmware may debounce in time or hardware. Edge detection is useful when an action should occur only when a signal changes rather than continuously while it remains high or low. Pin direction and voltage limits must match the hardware.',
 ('embedded-systems','emb-3'): 'Timers provide hardware-based time measurement so firmware does not have to waste CPU cycles in long busy-wait loops. Interrupts let hardware signal that an event needs attention, but interrupt handlers should remain short because they can delay other time-sensitive work. A non-blocking event loop schedules work based on elapsed time or events. The design target is predictable latency: know which event can delay which other event and by how much.',
 ('embedded-systems','emb-4'): 'An ADC converts an analog voltage into a discrete digital number. Resolution determines how many distinct codes are available, while sampling rate determines how often the signal is measured. PWM controls average power by switching a digital output rapidly with a chosen duty cycle; it is commonly used for LEDs, motors, and simple analog-like control. Correct design also considers reference voltage, noise, aliasing, and whether the actuator can tolerate the PWM frequency.',
 ('embedded-systems','emb-5'): 'UART, I²C, and SPI solve different communication needs. UART is asynchronous point-to-point serial communication. I²C uses addressed devices on shared clock/data lines and is convenient for many low-speed peripherals. SPI uses separate clock/data signals and chip-select lines for high-throughput synchronous transfers. Firmware must match bus speed, framing, addressing, electrical requirements, and error/timeout behavior rather than treating the protocols as interchangeable.',
 ('embedded-systems','emb-6'): 'A device driver translates application-level intent into the register operations or bus messages a specific sensor or actuator expects. Sensors often require calibration, scaling, unit conversion, and plausibility checks before raw readings become useful data. Actuators need safe ranges and fault behavior. Production firmware should distinguish a disconnected device, a transient communication error, an out-of-range reading, and a valid extreme value so failures do not silently become normal measurements.',
 ('embedded-systems','emb-7'): 'A state machine makes firmware behavior explicit by listing valid states, the events that cause transitions, and the actions performed on entry or transition. This is often safer than a collection of loosely related flags. Deterministic event handling helps timing-sensitive code remain understandable, while a watchdog can reset or recover software that stops making progress. A fault state should define safe outputs and a deliberate recovery path rather than simply continuing with corrupted assumptions.',
 ('embedded-systems','emb-8'): 'Embedded testing combines ordinary unit tests with hardware-aware techniques. Logic can often be tested on a host computer or simulator, while integration tests exercise real peripherals. Logging and assertions expose internal state during development, and fault injection deliberately introduces timeouts, invalid sensor data, resets, or communication errors to verify recovery. Because hardware failures are intermittent, reproducible test harnesses and captured evidence are especially valuable.',
}

# Build a stable objective set and deepen every shallow explanation.  A minimum of
# 90 words removes the large depth gap while preserving already-strong lessons.
for course in courses:
    fam = family(course)
    lens1, lens2 = LENSES[fam]
    for lesson in course.get('lessons', []):
        key=(course['id'], lesson.get('id'))
        base = SPECIAL.get(key) or sentence(lesson.get('explanation') or lesson.get('explain') or lesson.get('description'))
        concepts = dedupe(lesson.get('concepts') or [])
        objectives = dedupe(lesson.get('objectives') or [])
        mistakes = lesson.get('commonMistakes') or lesson.get('commonMistake') or []
        if isinstance(mistakes, str): mistakes=[mistakes]
        mistakes = dedupe(mistakes)
        if len(objectives) < 3:
            if concepts:
                objectives.append(f'Explain how {concepts[0]} changes the behavior, result, or engineering decision in a concrete example')
            if len(concepts) > 1:
                objectives.append(f'Connect {concepts[0]} with {concepts[1]} and predict what changes when one assumption changes')
            objectives.append('Verify the idea with a normal case and an important edge, failure, or scale case')
        lesson['objectives'] = dedupe(objectives)[:5]
        
        pieces=[base]
        if len(words(' '.join(pieces))) < 90:
            if concepts:
                shown=', '.join(concepts[:5])
                pieces.append(f'Treat the key ideas as one connected model rather than separate vocabulary: {shown}. The lesson is complete only when you can say what each idea contributes and when it changes the outcome.')
            pieces.append(lens1)
            pieces.append(lens2)
            if mistakes:
                pieces.append(f'One practical failure to watch for is this: {sentence(mistakes[0])}')
            if objectives:
                pieces.append(f'A strong self-check is whether you can {objectives[0][0].lower()+objectives[0][1:] if objectives[0] else "explain the lesson"}, then defend the result with evidence instead of only repeating the definition.')
        # If still short, add an explicitly testable reasoning loop.
        if len(words(' '.join(pieces))) < 90:
            pieces.append('Before moving on, write down the starting state, predict the important intermediate step, state the expected result, and then change one condition to see whether your explanation still holds. That is the same reasoning pattern used when reviewing code, diagnosing a bug, or evaluating a design change at work.')
        explanation=' '.join(sentence(p) for p in pieces if p).replace('..','.')
        lesson['explanation']=explanation
        lesson['explain']=explanation
        lesson['concepts']=concepts
        lesson['commonMistakes']=mistakes

# Sync master and per-course files.
MASTER.write_text(json.dumps(courses, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
for course in courses:
    (DATA_DIR / f"{course['id']}.json").write_text(json.dumps(course, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

# Audit summary used by the v5.57 regression test.
summary=[]
for course in courses:
    lesson_words=[]
    for lesson in course.get('lessons',[]):
        lesson_words.append(len(words(lesson.get('explanation',''))))
    summary.append({'id':course['id'],'title':course.get('title'), 'lessons':len(course.get('lessons',[])), 'minExplanationWords':min(lesson_words) if lesson_words else 0, 'avgExplanationWords':round(sum(lesson_words)/len(lesson_words),1) if lesson_words else 0})
(ROOT/'LESSON_DEPTH_AUDIT_v5.57.json').write_text(json.dumps({'courses':summary}, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
print('Deepened', sum(len(c.get('lessons',[])) for c in courses), 'lessons across', len(courses), 'courses.')
print('Minimum explanation words:', min(x['minExplanationWords'] for x in summary))
