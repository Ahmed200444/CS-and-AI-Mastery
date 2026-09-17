const fs = require('fs');
const path = require('path');

const root = process.cwd();
const coursesDir = path.join(root, 'courses');
const dsaPath = path.join(coursesDir, 'dsa.html');
const reportPath = path.join(root, 'EXAMPLE_COVERAGE_QA_v5.75.json');

function esc(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);
}

function codeBlock(code) {
  return `<pre class="code" data-example-audit="candidate">${esc(code.trim())}</pre>`;
}

/*
  The browser study layer already creates an adaptive example plan for every lesson:
  one example per key concept plus integration/debug examples, with a five-example floor.
  This build-time layer fixes the remaining static/native DSA gaps so the interview-prep
  lessons are still useful even before the browser enhancement hydrates them.
*/
const curated = {
  'dsa-hash-maps': [
`words = ["ai", "data", "ai", "python", "ai"]
counts = {}
for word in words:
    counts[word] = counts.get(word, 0) + 1
print(counts)`,
`scores = {"Ali": 90, "Maya": 84}
print(scores["Ali"])
print(scores.get("Omar", 0))`,
`def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        needed = target - n
        if needed in seen:
            return [seen[needed], i]
        seen[n] = i
    return []

print(two_sum([2, 7, 11, 15], 9))`,
`nums = [4, 2, 5, 2, 6]
seen = set()
for n in nums:
    if n in seen:
        print(n)
        break
    seen.add(n)`
  ],

  'dsa-two-pointers': [
`text = "level"
left, right = 0, len(text) - 1
is_palindrome = True
while left < right:
    if text[left] != text[right]:
        is_palindrome = False
        break
    left += 1
    right -= 1
print(is_palindrome)`,
`nums = [1, 2, 4, 6, 10]
target = 8
left, right = 0, len(nums) - 1
while left < right:
    total = nums[left] + nums[right]
    if total == target:
        print(nums[left], nums[right])
        break
    if total < target:
        left += 1
    else:
        right -= 1`,
`nums = [2, 1, 5, 1, 3, 2]
k = 3
window_sum = sum(nums[:k])
best = window_sum
for right in range(k, len(nums)):
    window_sum += nums[right] - nums[right - k]
    best = max(best, window_sum)
print(best)`,
`text = "abcabcbb"
left = 0
seen = {}
best = 0
for right, ch in enumerate(text):
    if ch in seen and seen[ch] >= left:
        left = seen[ch] + 1
    seen[ch] = right
    best = max(best, right - left + 1)
print(best)`
  ],

  'dsa-recursion-backtracking': [
`def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(factorial(5))`,
`def recursive_sum(nums):
    if not nums:
        return 0
    return nums[0] + recursive_sum(nums[1:])

print(recursive_sum([2, 4, 6]))`,
`def permutations(nums):
    result = []
    path = []
    used = [False] * len(nums)

    def backtrack():
        if len(path) == len(nums):
            result.append(path.copy())
            return
        for i, value in enumerate(nums):
            if used[i]:
                continue
            used[i] = True
            path.append(value)
            backtrack()
            path.pop()
            used[i] = False

    backtrack()
    return result

print(permutations([1, 2, 3]))`,
`def combinations(nums, k):
    result = []
    path = []

    def backtrack(start):
        if len(path) == k:
            result.append(path.copy())
            return
        for i in range(start, len(nums)):
            path.append(nums[i])
            backtrack(i + 1)
            path.pop()

    backtrack(0)
    return result

print(combinations([1, 2, 3, 4], 2))`
  ],

  'dsa-heaps-priority-queues': [
`import heapq

tasks = [(3, "email"), (1, "fix bug"), (2, "review")]
heapq.heapify(tasks)
while tasks:
    priority, task = heapq.heappop(tasks)
    print(priority, task)`,
`import heapq

nums = [5, 1, 9, 3, 7, 8]
k = 3
heap = []
for n in nums:
    heapq.heappush(heap, n)
    if len(heap) > k:
        heapq.heappop(heap)
print(sorted(heap, reverse=True))`,
`import heapq

nums = [3, 2, 1, 5, 6, 4]
k = 2
heap = nums[:k]
heapq.heapify(heap)
for n in nums[k:]:
    if n > heap[0]:
        heapq.heapreplace(heap, n)
print(heap[0])`,
`import heapq

items = ["a", "b", "a", "c", "a", "b"]
counts = {}
for item in items:
    counts[item] = counts.get(item, 0) + 1
heap = [(-count, item) for item, count in counts.items()]
heapq.heapify(heap)
print(heapq.heappop(heap)[1])`
  ],

  'dsa-divide-conquer': [
`def binary_search(nums, target, left, right):
    if left > right:
        return -1
    mid = (left + right) // 2
    if nums[mid] == target:
        return mid
    if nums[mid] < target:
        return binary_search(nums, target, mid + 1, right)
    return binary_search(nums, target, left, mid - 1)

nums = [1, 3, 5, 7, 9]
print(binary_search(nums, 7, 0, len(nums) - 1))`,
`def find_max(nums):
    if len(nums) == 1:
        return nums[0]
    mid = len(nums) // 2
    left_max = find_max(nums[:mid])
    right_max = find_max(nums[mid:])
    return max(left_max, right_max)

print(find_max([7, 2, 9, 4, 6]))`,
`def divide_sum(nums):
    if len(nums) <= 1:
        return sum(nums)
    mid = len(nums) // 2
    return divide_sum(nums[:mid]) + divide_sum(nums[mid:])

print(divide_sum([1, 2, 3, 4, 5, 6]))`,
`def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    return result + left[i:] + right[j:]

print(merge([1, 4, 7], [2, 3, 8]))`
  ],

  'dsa-greedy': [
`coins = [25, 10, 5, 1]
amount = 41
chosen = []
for coin in coins:
    while amount >= coin:
        amount -= coin
        chosen.append(coin)
print(chosen)`,
`def can_reach_end(nums):
    farthest = 0
    for i, jump in enumerate(nums):
        if i > farthest:
            return False
        farthest = max(farthest, i + jump)
    return True

print(can_reach_end([2, 3, 1, 1, 4]))`,
`intervals = [(1, 3), (2, 4), (3, 5), (6, 8)]
intervals.sort(key=lambda item: item[1])
selected = []
last_end = float("-inf")
for start, end in intervals:
    if start >= last_end:
        selected.append((start, end))
        last_end = end
print(selected)`,
`people = [1, 2, 2, 3]
cookies = [1, 1, 2, 3]
people.sort()
cookies.sort()
i = j = 0
while i < len(people) and j < len(cookies):
    if cookies[j] >= people[i]:
        i += 1
    j += 1
print(i)`
  ],

  'dsa-dynamic-programming': [
`def climb_stairs(n):
    if n <= 2:
        return n
    prev2, prev1 = 1, 2
    for _ in range(3, n + 1):
        prev2, prev1 = prev1, prev1 + prev2
    return prev1

print(climb_stairs(5))`,
`def fibonacci(n, memo=None):
    if memo is None:
        memo = {}
    if n <= 1:
        return n
    if n not in memo:
        memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo)
    return memo[n]

print(fibonacci(10))`,
`def house_robber(nums):
    prev2 = 0
    prev1 = 0
    for money in nums:
        prev2, prev1 = prev1, max(prev1, prev2 + money)
    return prev1

print(house_robber([2, 7, 9, 3, 1]))`,
`def coin_change(coins, amount):
    dp = [amount + 1] * (amount + 1)
    dp[0] = 0
    for total in range(1, amount + 1):
        for coin in coins:
            if coin <= total:
                dp[total] = min(dp[total], dp[total - coin] + 1)
    return -1 if dp[amount] > amount else dp[amount]

print(coin_change([1, 2, 5], 11))`
  ],

  'dsa-intervals-sweep': [
`intervals = [(1, 3), (5, 7), (6, 9)]
for i in range(1, len(intervals)):
    previous_end = intervals[i - 1][1]
    current_start = intervals[i][0]
    if current_start < previous_end:
        print("overlap:", intervals[i - 1], intervals[i])`,
`def insert_interval(intervals, new_interval):
    result = []
    start, end = new_interval
    i = 0
    while i < len(intervals) and intervals[i][1] < start:
        result.append(intervals[i])
        i += 1
    while i < len(intervals) and intervals[i][0] <= end:
        start = min(start, intervals[i][0])
        end = max(end, intervals[i][1])
        i += 1
    result.append((start, end))
    return result + intervals[i:]

print(insert_interval([(1, 2), (5, 7)], (2, 6)))`,
`import heapq

meetings = [(0, 30), (5, 10), (15, 20)]
meetings.sort()
rooms = []
for start, end in meetings:
    if rooms and rooms[0] <= start:
        heapq.heappop(rooms)
    heapq.heappush(rooms, end)
print(len(rooms))`,
`intervals = [(1, 4), (2, 5), (7, 9)]
events = []
for start, end in intervals:
    events.append((start, 1))
    events.append((end, -1))
active = best = 0
for _, change in sorted(events):
    active += change
    best = max(best, active)
print(best)`
  ],

  'dsa-monotonic-stack-queue': [
`temperatures = [73, 74, 75, 71, 69, 72, 76, 73]
answer = [0] * len(temperatures)
stack = []
for i, temp in enumerate(temperatures):
    while stack and temperatures[stack[-1]] < temp:
        j = stack.pop()
        answer[j] = i - j
    stack.append(i)
print(answer)`,
`nums = [3, 7, 2, 5]
stack = []
previous_smaller = []
for n in nums:
    while stack and stack[-1] >= n:
        stack.pop()
    previous_smaller.append(stack[-1] if stack else -1)
    stack.append(n)
print(previous_smaller)`,
`prices = [100, 80, 60, 70, 60, 75, 85]
stack = []
spans = []
for i, price in enumerate(prices):
    while stack and prices[stack[-1]] <= price:
        stack.pop()
    spans.append(i + 1 if not stack else i - stack[-1])
    stack.append(i)
print(spans)`,
`from collections import deque

nums = [1, 3, -1, -3, 5, 3, 6, 7]
k = 3
window = deque()
result = []
for i, n in enumerate(nums):
    while window and window[0] <= i - k:
        window.popleft()
    while window and nums[window[-1]] <= n:
        window.pop()
    window.append(i)
    if i >= k - 1:
        result.append(nums[window[0]])
print(result)`
  ],

  'dsa-build-set-hash-table': [
`size = 5
for value in [12, 7, 22, 9]:
    print(value, "-> bucket", hash(value) % size)`,
`buckets = [[] for _ in range(4)]
for value in [1, 5, 9]:
    bucket = buckets[hash(value) % len(buckets)]
    if value not in bucket:
        bucket.append(value)
print(buckets)`,
`class SimpleSet:
    def __init__(self, size=8):
        self.buckets = [[] for _ in range(size)]

    def _bucket(self, value):
        return self.buckets[hash(value) % len(self.buckets)]

    def add(self, value):
        bucket = self._bucket(value)
        if value not in bucket:
            bucket.append(value)

    def remove(self, value):
        bucket = self._bucket(value)
        if value in bucket:
            bucket.remove(value)

s = SimpleSet()
s.add("python")
s.remove("python")
print(s.buckets)`,
`values = ["a", "b", "c", "d", "e"]
bucket_count = 8
load_factor = len(values) / bucket_count
print(load_factor)`
  ]
};

if (!fs.existsSync(coursesDir)) throw new Error('courses directory is missing');
const courseFiles = fs.readdirSync(coursesDir).filter(name => name.endsWith('.html')).sort();
if (courseFiles.length !== 62) throw new Error(`Expected 62 course pages, found ${courseFiles.length}`);

function lessonRanges(html) {
  const starts = [];
  const re = /<details\b[^>]*class=(?:"[^"]*\blesson\b[^"]*"|'[^']*\blesson\b[^']*')[^>]*data-lesson=(?:"([^"]+)"|'([^']+)')[^>]*>/gi;
  let match;
  while ((match = re.exec(html))) starts.push({ id: match[1] || match[2], start: match.index });
  return starts.map((item, index) => ({
    id: item.id,
    start: item.start,
    end: index + 1 < starts.length ? starts[index + 1].start : html.length
  }));
}

function countExamples(block) {
  return (block.match(/<pre\b[^>]*class=(?:"[^"]*\bcode\b[^"]*"|'[^']*\bcode\b[^']*')[^>]*>/gi) || []).length;
}

let totalLessons = 0;
let totalStaticExamplesBefore = 0;
const courseStats = [];
for (const name of courseFiles) {
  const html = fs.readFileSync(path.join(coursesDir, name), 'utf8');
  const ranges = lessonRanges(html);
  let examples = 0;
  for (const range of ranges) examples += countExamples(html.slice(range.start, range.end));
  totalLessons += ranges.length;
  totalStaticExamplesBefore += examples;
  courseStats.push({ course: name.replace(/\.html$/, ''), lessons: ranges.length, staticExamples: examples });
}

if (!fs.existsSync(dsaPath)) throw new Error('courses/dsa.html is missing');
let dsa = fs.readFileSync(dsaPath, 'utf8');
let added = 0;
const dsaCoverage = {};

for (const [lessonId, bank] of Object.entries(curated)) {
  const ranges = lessonRanges(dsa);
  const range = ranges.find(item => item.id === lessonId);
  if (!range) throw new Error(`DSA lesson not found: ${lessonId}`);
  let block = dsa.slice(range.start, range.end);
  let count = countExamples(block);
  const needed = Math.max(0, 5 - count);
  if (needed > bank.length) throw new Error(`${lessonId} needs ${needed} examples but only ${bank.length} curated examples exist`);

  if (needed) {
    const insertion = bank.slice(0, needed).map(codeBlock).join('');
    const mistakeAt = block.search(/<div\b[^>]*class=(?:"[^"]*\bnote\b[^"]*"|'[^']*\bnote\b[^']*')[^>]*>\s*<b>Common mistake:/i);
    if (mistakeAt < 0) throw new Error(`Common-mistake anchor missing for ${lessonId}`);
    block = block.slice(0, mistakeAt) + insertion + block.slice(mistakeAt);
    dsa = dsa.slice(0, range.start) + block + dsa.slice(range.end);
    added += needed;
    count += needed;
  }
  dsaCoverage[lessonId] = count;
}

fs.writeFileSync(dsaPath, dsa, 'utf8');

for (const [lessonId, count] of Object.entries(dsaCoverage)) {
  if (count < 5) throw new Error(`${lessonId} has only ${count} static examples after enrichment`);
}

let totalStaticExamplesAfter = 0;
for (const name of courseFiles) {
  const html = fs.readFileSync(path.join(coursesDir, name), 'utf8');
  for (const range of lessonRanges(html)) totalStaticExamplesAfter += countExamples(html.slice(range.start, range.end));
}

const report = {
  release: '5.75-example-depth',
  status: 'PASS',
  coursesAudited: courseFiles.length,
  lessonsAudited: totalLessons,
  staticExamplesBefore: totalStaticExamplesBefore,
  staticExamplesAfter: totalStaticExamplesAfter,
  staticExamplesAdded: added,
  universalStudyLayer: {
    policy: 'one example per key concept plus integration/debug examples, minimum five per lesson',
    verifiedSeparatelyBy: 'scripts/verify-study-examples.cjs'
  },
  dsaStaticFiveExampleFloor: dsaCoverage,
  courseStatsBeforeEnrichment: courseStats
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(`Example-depth audit passed: ${courseFiles.length} courses / ${totalLessons} lessons checked; added ${added} curated DSA examples; all targeted DSA lessons now have at least 5 static examples.`);
