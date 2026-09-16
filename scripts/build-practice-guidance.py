#!/usr/bin/env python3
"""Build exam-style requirement briefs for every course learning item.

The output tells the learner what each course, lesson, example, exercise, project,
and knowledge check requires, plus relevant course concepts, without embedding
finished solution code or answer keys. It is consumed by assets/practice-guidance.js.
"""
from __future__ import annotations

import ast
import json
import re
from pathlib import Path
from typing import Any, Iterable

ROOT = Path(__file__).resolve().parents[1]
COURSE_DIR = ROOT / "assets" / "course-data"
OUT_DIR = ROOT / "assets" / "practice-guidance"
INDEX_OUT = ROOT / "assets" / "practice-guidance-index.json"


def text(v: Any) -> str:
    if v is None:
        return ""
    if isinstance(v, list):
        return " ".join(text(x) for x in v)
    if isinstance(v, dict):
        return " ".join(text(x) for x in v.values())
    return str(v)


def uniq(items: Iterable[str], limit: int | None = None) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for raw in items:
        item = re.sub(r"\s+", " ", str(raw or "")).strip()
        if not item:
            continue
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
        if limit and len(out) >= limit:
            break
    return out


def normalized(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


def language_for(course: dict[str, Any], sample: str = "") -> str:
    cid = str(course.get("id", "")).lower()
    blob = (cid + " " + str(course.get("title", "")) + " " + sample[:500]).lower()
    if cid == "cpp-dsa" or "#include" in sample or "std::" in sample:
        return "C++"
    if cid in {"sql", "databases"} or re.search(r"\bselect\b.+\bfrom\b", sample, re.I | re.S):
        return "SQL"
    if cid in {"web-dev", "frontend-dev"} or "document.queryselector" in blob or "<!doctype" in blob:
        return "HTML/CSS/JavaScript"
    if cid in {"linux", "git", "docker", "kubernetes", "cloud-computing", "cicd", "deployment"}:
        return "commands/configuration + Python where useful"
    if cid in {"resume-prep", "company-prep", "interview-prep", "influencing-without-authority"}:
        return "written reasoning / planning"
    return "Python"


def python_features(code: str) -> tuple[list[str], list[str]]:
    imports: list[str] = []
    features: list[str] = []
    try:
        tree = ast.parse(code)
    except Exception:
        return imports, features
    for n in ast.walk(tree):
        if isinstance(n, ast.Import):
            imports.extend(a.name for a in n.names)
        elif isinstance(n, ast.ImportFrom):
            imports.append(n.module or "module")
        elif isinstance(n, (ast.For, ast.AsyncFor)):
            features.append("for loop")
        elif isinstance(n, ast.While):
            features.append("while loop")
        elif isinstance(n, ast.If):
            features.append("if / elif / else")
        elif isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)):
            features.append("function")
        elif isinstance(n, ast.ClassDef):
            features.append("class / object")
        elif isinstance(n, ast.Try):
            features.append("try / except")
        elif isinstance(n, (ast.With, ast.AsyncWith)):
            features.append("context manager / with")
        elif isinstance(n, ast.Dict):
            features.append("dictionary")
        elif isinstance(n, (ast.List, ast.ListComp)):
            features.append("list")
        elif isinstance(n, ast.Set):
            features.append("set")
        elif isinstance(n, ast.Lambda):
            features.append("lambda")
        elif isinstance(n, (ast.ListComp, ast.DictComp, ast.SetComp, ast.GeneratorExp)):
            features.append("comprehension / generator expression")
        elif isinstance(n, ast.Raise):
            features.append("raise / custom error path")
    return uniq(imports, 5), uniq(features, 7)


def code_features(code: str, course: dict[str, Any]) -> tuple[list[str], list[str]]:
    imports, feats = python_features(code)
    if imports or feats:
        return imports, feats
    low = code.lower()
    if re.search(r"\bselect\b", low): feats.append("SELECT")
    if re.search(r"\bjoin\b", low): feats.append("JOIN")
    if "group by" in low: feats.append("GROUP BY")
    if "order by" in low: feats.append("ORDER BY")
    if "with " in low and "select" in low: feats.append("CTE / WITH")
    if re.search(r"\bover\s*\(", low): feats.append("window function")
    if re.search(r"\bfor\s*\(", low) or re.search(r"\bfor\s+\w+\s+of\b", low): feats.append("loop")
    if re.search(r"\bif\s*\(", low): feats.append("conditional")
    if "function " in low or "=>" in code: feats.append("function")
    if "document." in low: feats.append("DOM API")
    if "fetch(" in low: feats.append("fetch / HTTP request")
    if "class " in low: feats.append("class / object")
    if "docker" in low or "from " in low and "run " in low: feats.append("Dockerfile / container config")
    if "kubectl" in low or "apiversion:" in low: feats.append("Kubernetes manifest / command")
    if "git " in low: feats.append("Git command")
    if re.search(r"<(?:!doctype|html|head|body|main|section|article|nav|div|span|p|h[1-6]|ul|ol|li|a|button|input|form|label|script|style|table|tr|td|th)\b", code, re.I): feats.append("HTML structure")
    if re.search(r"[.#][a-zA-Z_-][\w-]*\s*\{", code): feats.append("CSS rule")
    return uniq(imports, 5), uniq(feats, 7)



def behavioralize_sentence(value: str) -> str:
    """Rewrite syntax-first wording as behavior-first wording for visible guidance."""
    s = re.sub(r"`([^`]+)`", r"\1", str(value or ""))
    replacements = [
        (r"\bwrite a list comprehension that\b", "produce a new collection that"),
        (r"\bloops?:\s*for,\s*while,\s*do-while,\s*break\s*&\s*continue\b", "repetition over a known sequence/count, repetition controlled by a condition, stopping early, and skipping one turn"),
        (r"\bchoose between for and while loops?\b", "choose whether repetition should follow a known set of items/count or keep repeating until a condition changes"),
        (r"\bcontrol loops? safely with break and continue\b", "stop repetition early or skip one turn when the situation requires it"),
        (r"\buse enumerate\(\) instead of a manual index when appropriate\b", "track each item's position and value together instead of managing the position separately when that is clearer"),
        (r"\bfor loops?\b", "repetition over a known sequence or count"),
        (r"\bwhile loops?\b", "repetition that continues while a condition remains true"),
        (r"\bbreak\b", "stopping the current repetition early"),
        (r"\bcontinue\b", "skipping the rest of the current turn"),
        (r"\benumerate\(\)", "tracking each item's position and value together"),
        (r"\brange\(\)", "a generated sequence of numbers"),
        (r"\bif\s*/\s*elif\s*/\s*else\b|\bif/elif/else\b", "choosing one path based on conditions"),
        (r"\btry\s*/\s*except\b", "safe handling of expected failures"),
        (r"\blist comprehensions?\b", "building a new collection from existing values in one transformation"),
        (r"\bdictionaries?\b|\bdict\b", "key-based collections"),
        (r"\blists?\b", "ordered collections of values"),
        (r"\bfunctions?\b", "reusable operations"),
        (r"\bclasses?\b|\bobjects?\b", "grouped state and behavior"),
        (r"\blambda\b", "a short unnamed operation"),
        (r"\bappend\(\)", "adding an item to the end of a collection"),
        (r"\bprint\(\)", "displaying a result"),
        (r"\binput\(\)", "receiving a value from the user"),
        (r"\bSELECT\b", "reading requested data"),
        (r"\bJOIN\b", "combining related data"),
        (r"\bGROUP BY\b", "grouping related rows for a summary"),
        (r"\bORDER BY\b", "arranging results in a requested order"),
        (r"\bLIMIT\b", "restricting how many results are returned"),
    ]
    for pat, repl in replacements:
        s = re.sub(pat, repl, s, flags=re.I)
    # Replace import statements as a concept, not a literal line to copy.
    s = re.sub(r"\bimport\s+[A-Za-z_][\w.]*", "make the needed outside library capability available", s, flags=re.I)
    return re.sub(r"\s+", " ", s).strip()

def behavior_focus(items: Iterable[str], limit: int = 7) -> list[str]:
    """Translate code/tool names into behavior-first study language.

    The learner sees what to reason about without being told the exact syntax,
    variable name, library call, or implementation construct to copy.
    """
    out: list[str] = []
    def add(label: str) -> None:
        if label and label.lower() not in {x.lower() for x in out}:
            out.append(label)
    for raw in items:
        t = normalized(str(raw))
        if not t:
            continue
        if re.search(r"break|stop condition|early exit", t): add("stopping repetition at the right moment")
        elif re.search(r"continue|skip.*iteration|skip.*turn", t): add("skipping one turn without ending the whole repetition")
        elif re.search(r"enumerate|index|position", t): add("tracking an item's position while reading its value")
        elif re.search(r"for loop|while loop|loop|range|iterate|iteration", t): add("repeating an action the correct number of times")
        elif re.search(r"if|elif|else|condition|boolean|comparison|decision", t): add("choosing what happens based on a condition")
        elif re.search(r"list|array|tuple|set|collection|sequence", t): add("working through a group of values")
        elif re.search(r"dict|dictionary|hash map|key lookup|key value", t): add("finding and updating information by a key")
        elif re.search(r"function|method|return|argument|parameter|lambda", t): add("organizing reusable behavior around inputs and results")
        elif re.search(r"class|object|oop|inheritance|polymorphism|encapsulation", t): add("grouping related state and behavior")
        elif re.search(r"exception|error|try|raise|validation|failure", t): add("handling invalid or failing cases safely")
        elif re.search(r"json|serialize|persist|save|load", t): add("keeping structured information available between runs")
        elif re.search(r"file|path|open|context manager|resource", t): add("working with external resources without leaving them in a bad state")
        elif re.search(r"input|prompt|stdin", t): add("receiving information from the user or another source")
        elif re.search(r"string|format|slice|join|text|conversion", t): add("transforming and presenting text or values correctly")
        elif re.search(r"variable|assignment|type|binding|identifier|name", t): add("storing values and understanding what kind of data they represent")
        elif re.search(r"recurs", t): add("solving a problem by reducing it to smaller versions of the same problem")
        elif re.search(r"big o|complexity|runtime|space complexity", t): add("estimating how the amount of work grows as the input grows")
        elif re.search(r"binary search", t): add("narrowing a search area by repeatedly discarding half of it")
        elif re.search(r"print|output|display|stdout", t): add("showing the result clearly")
        elif re.search(r"select|query|sql|table|database", t): add("asking stored data for the exact result you need")
        elif re.search(r"join", t): add("combining related information from different data sources")
        elif re.search(r"group|aggregate|count|sum|average", t): add("summarizing related values into useful results")
        elif re.search(r"order|sort", t): add("arranging results in a meaningful order")
        elif re.search(r"api|http|request|response|endpoint", t): add("sending information to another service and handling its response")
        elif re.search(r"html|dom|component|element", t): add("building and updating the visible page structure")
        elif re.search(r"css|flex|grid|responsive|style", t): add("controlling layout and presentation clearly")
        elif re.search(r"git|branch|commit|merge", t): add("tracking changes and combining work safely")
        elif re.search(r"test|debug|edge case", t): add("checking normal behavior and important edge cases")
        elif re.search(r"model|train|evaluation|metric|classifier|regression", t): add("learning from data and checking performance on unseen cases")
        elif re.search(r"graph|tree|node|bfs|dfs", t): add("following relationships between connected pieces of data")
        elif re.search(r"queue|stack", t): add("processing stored items in the required order")
        elif re.search(r"python|c |cpp|java|javascript|typescript", t): add("turning the required behavior into a working program")
        else: add("understanding what changes, what is checked, and what result should follow")
        if len(out) >= limit:
            break
    if not out:
        out.append("understanding what changes, what is checked, and what result should follow")
    return out[:limit]


TOOL_RULES: list[tuple[str, list[str]]] = [
    # High-signal task patterns come first so beginner exercises receive useful
    # concrete building blocks even when they are not one-to-one with lessons.
    (r"\bfizzbuzz\b", ["for/while loop", "modulo (%)", "if / elif / else", "ordered condition checks"]),
    (r"\b(?:sum|total)\b.{0,30}\blist\b|\blist\b.{0,30}\b(?:sum|total)\b", ["list", "loop", "running accumulator", "function + return value"]),
    (r"\b(?:hash map|hash maps|hashmap|hash table|hash tables|hashtable)\b", ["bucket/slot structure", "hash function", "collision handling", "key lookup/update", "load-factor/resize rule if required", "get/set/delete tests"]),
    (r"\bword frequency\b|\bword counts?\b", ["dictionary", "loop over words", "get/default count", "string splitting/normalization"]),
    (r"\blist comprehension\b|\bcomprehension\b", ["list comprehension", "iteration expression", "optional filter condition", "result-list check"]),
    (r"\b(?:dictionary|dict)\b", ["dictionary", "key lookup", "get()/membership check", "key/value update"]),
    (r"\bmutable default(?: argument)?\b", ["function default argument", "None sentinel", "create mutable state inside the call", "repeat-call test"]),
    (r"\b(?:type error|typeerror|type conversion|convert(?:ing)? .*\b(?:int|float|string|str)\b)\b", ["type conversion", "input/value type check", "consistent operand types", "small failing example"]),
    (r"\b(?:exception|exceptions|try except|divide by zero|zerodivisionerror)\b", ["exception/error handling", "specific exception/error type", "normal path", "failure-path message"]),
    (r"\b(?:encapsulation|polymorphism|inheritance|composition|abstract class|interface)\b", ["class/object design", "methods", "valid state / contract", "small behavior test"]),
    (r"\b(?:css|flexbox|css grid|grid layout|responsive|border radius|box shadow)\b", ["CSS selector/rule", "layout with Flexbox/Grid", "spacing/sizing", "responsive check", "browser inspection"]),
    (r"\b(?:accessibility|accessible|aria|keyboard navigation|screen reader|semantic html)\b", ["semantic HTML", "labels/ARIA only when needed", "keyboard interaction", "focus behavior", "contrast/readability check"]),
    (r"\breact\b", ["components", "props/state", "event handlers", "routing when required", "data fetching/effects", "render-state checks"]),
    (r"\b(?:createelement|addeventlistener|event listener|dom update|dom manipulation)\b", ["DOM selection/creation", "event listener", "state/data update", "DOM render/update", "browser test"]),
    (r"\bfetch\b|\bhttp request\b", ["fetch/HTTP request", "async/await or promise flow", "response parsing", "loading/error path", "render/use result"]),
    (r"\b(?:retry|retries|backoff|circuit breaker)\b", ["retry limit", "backoff schedule", "circuit states/threshold", "failure counter/timing state", "recovery test"]),
    (r"\b(?:idempotent|idempotency|deduplicate|deduplication)\b", ["idempotency key", "processed-request store", "check-before-side-effect", "repeat-request test", "atomic state update"]),
    (r"\b(?:classify|classifier|classification|scikit learn|sklearn|iris dataset|train test split|test set|accuracy|precision|recall|f1|rmse|mae)\b", ["features/labels", "train/test split", "model/baseline", "evaluation metric", "unseen-data check"]),
    (r"\b(?:data leakage|leakage|overfitting|underfitting|cross validation)\b", ["train/validation/test separation", "fit preprocessing on training data", "compare train vs validation/test", "diagnose before tuning"]),
    (r"\b(?:consistent hash|hash ring)\b", ["hash function", "ordered ring/positions", "key-to-node lookup", "add/remove-node simulation", "reassignment measurement"]),
    (r"\btrie\b|\bautocomplete\b", ["trie node", "children map", "insert", "prefix traversal", "collect completions"]),
    (r"\b(?:expense|expenses|spending|budget|budgets)\b", ["list of dictionaries", "while-loop menu", "functions", "input validation", "JSON persistence", "date/time stamp"]),
    (r"\b(?:number guessing|guessing game|guess the number)\b", ["random number generation", "while loop", "numeric input validation", "if / elif comparison", "attempt counter"]),
    (r"\b(?:markdown|parser|parsing)\b", ["string processing", "line-by-line loop", "conditionals", "small helper functions", "regular expressions only if they simplify a rule"]),
    (r"\b(?:inventory|inventories|stock|warehouse|shopping cart|order processing|order system|purchase order)\b", ["data model / records", "validation rules", "functions or methods", "collections", "tests for invalid state changes"]),
    (r"\b(?:deck|playing cards?|shuffle cards?|deal cards?)\b", ["card/deck data model", "list/collection", "shuffle operation", "methods/functions", "readable representation"]),
    (r"\b(?:text adventure|adventure game|player inventory|room exits?)\b", ["room/player/item data model", "composition", "map/dictionary of exits", "while-loop command loop", "state updates"]),
    (r"\bcli\b|\bcommand line\b|\bautomation tool\b", ["functions", "command-line input/arguments", "file/path handling when needed", "clear error handling", "tests"]),
    (r"\bjson\b|\bseriali[sz](?:e|ation|ing)\b|\bpersist(?:ence|ent|ing)?\b|\bsave(?:d|s|ing)? (?:to )?(?:a )?file\b|\bload(?:ed|s|ing)? (?:from )?(?:a )?file\b", ["JSON parser/library", "safe file handling", "error handling", "data validation"]),
    (r"\bcsv\b", ["CSV parser/library or dataframe", "file handling", "row validation"]),
    (r"\bregex\b|\bregular expressions?\b", ["regular-expression library", "small test strings", "positive and negative cases"]),
    (r"\b(?:date|dates|datetime|calendar|timestamp|timestamps|time zone|timezone|current time)\b", ["date/time value handling", "explicit formatting", "boundary cases"]),
    (r"\b(?:random number|random numbers|randomness|simulation|simulate|simulated)\b", ["random-number generator", "loop", "deterministic seed/repeatable test when useful"]),
    (r"\bbinary search\b", ["left/right indices", "while loop", "midpoint calculation", "sorted-input assumption"]),
    (r"\b(?:bfs|breadth first|breadth first search)\b", ["queue", "visited set", "adjacency structure", "loop"]),
    (r"\b(?:dfs|depth first|depth first search)\b", ["stack or recursion", "visited set", "adjacency structure"]),
    (r"\bgraph(?:s)?\b", ["adjacency representation", "set/map", "BFS or DFS when traversal is required"]),
    (r"\b(?:tree|trees|bst|binary search tree)\b", ["node structure", "recursion or explicit stack", "base case", "tree traversal"]),
    (r"\blinked lists?\b", ["node structure", "next reference", "careful head/tail updates"]),
    (r"(?<!full )\bstack(?:s)?\b|\blifo\b", ["stack abstraction", "push/pop discipline", "empty-state check"]),
    (r"\bqueue(?:s)?\b|\bfifo\b", ["queue abstraction", "enqueue/dequeue", "empty-state check"]),
    (r"\b(?:hash map|hash table|frequency map|frequency table|word count|count words)\b", ["dictionary/map", "loop", "get/default count"]),
    (r"\b(?:sort|sorting|sorted order)\b", ["comparison/key rule", "loop/recursion depending algorithm", "before/after test cases", "time complexity"]),
    (r"\bapi(?:s)?\b|\bendpoint(?:s)?\b|\brestful\b|\brest api\b", ["request/response model", "input validation", "status/error handling", "small endpoints/functions", "tests"]),
    (r"\b(?:database|databases|schema|schemas|table|tables|sql|query|queries|select|join)\b|\bgroup by\b|\border by\b", ["schema/tables when relevant", "keys/constraints when relevant", "query/operation", "edge-case rows/data", "result verification"]),
    (r"\bhtml\b|\bweb pages?\b|\bfrontend\b|\bdom\b", ["semantic HTML", "CSS layout", "JavaScript event handling", "DOM updates", "browser testing"]),
    (r"\b(?:test|tests|testing|pytest|unit tests?|regression tests?)\b", ["small test cases", "assertions/checks", "normal case", "edge case", "failure case"]),
    (r"\b(?:debug|debugging|bug|bugs|diagnose|diagnosis|diagnostic)\b", ["reproduce first", "small failing case", "inspect state", "change one cause at a time", "regression test"]),
    (r"\b(?:thread|threads|threading|concurrency|concurrent|worker|workers|lock|locks|race condition)\b", ["thread/task model", "queue when appropriate", "synchronization rule", "timeout/cancellation", "concurrency test"]),
    (r"\b(?:async|await|asynchronous)\b", ["async function/task", "await points", "task lifecycle", "timeout/error path"]),
    (r"\b(?:socket|sockets|network|networking|tcp|udp)\b", ["client/server roles", "message format", "timeouts", "error handling", "safe local simulation"]),
    (r"\b(?:docker|dockerfile|container|containers|containerization)\b", ["Dockerfile/config", "build/run lifecycle", "ports/volumes only when needed", "validation"]),
    (r"\b(?:kubernetes|k8s|kubectl)\b", ["manifest objects", "labels/selectors", "service exposure", "readiness/health checks", "safe validation"]),
    (r"\b(?:cloud|deploy|deployment|deployments|pipeline|pipelines|ci cd|continuous integration|continuous deployment)\b", ["deployment steps", "configuration", "failure/rollback path", "verification evidence"]),
    (r"\bmachine learning\b|\bclassification\b|\bregression model\b|\btrain(?:ing)? (?:a )?model\b|\bmodel evaluation\b|\bpredict(?:ion|ive)?\b", ["data split", "baseline", "preprocessing", "training/evaluation", "appropriate metric"]),
    (r"\b(?:pandas|dataframe|dataframes|data science)\b", ["dataframe/table", "cleaning", "filter/group/aggregate", "sanity checks"]),
    (r"\b(?:numpy|ndarray|arrays?)\b", ["array", "vectorized operation when appropriate", "shape/dtype check"]),
    (r"\b(?:llm|llms|large language model|language model|prompt engineering|system prompt|user prompt)\b", ["clear input contract", "prompt/instruction", "structured output", "evaluation cases", "failure/guardrail cases"]),
    (r"\b(?:rag|retrieval|retriever|embedding|embeddings|vector database|vector store)\b", ["document chunks/data", "embeddings/index when relevant", "retrieval step", "generation/consumer step", "separate component evaluation"]),
    (r"\b(?:agent|agents|agentic|mcp|tool use)\b", ["tool/schema contract", "argument validation", "decision loop", "stop condition", "failure/approval path"]),
    (r"\b(?:security|secure|authentication|authorization|permission|permissions|threat|threats)\b", ["threat/requirement definition", "input validation", "least privilege", "safe failure", "tests"]),
    (r"\b(?:resume|interview|company|stakeholder|stakeholders|influence|influencing|negotiation|negotiate)\b", ["clear goal", "evidence/examples", "structured reasoning", "trade-off", "final checklist"]),
]


def inferred_tools(blob: str, course: dict[str, Any], lesson: dict[str, Any] | None = None) -> list[str]:
    low = normalized(blob)
    out: list[str] = []
    # The related lesson is the most reliable source of intent, so keep its
    # actual concepts ahead of keyword heuristics. This prevents words such as
    # SQL "ORDER BY" or web "full stack" from being mistaken for unrelated
    # inventory/stack data-structure guidance.
    if lesson:
        out.extend(str(x) for x in (lesson.get("concepts") or [])[:5])
    for pat, tools in TOOL_RULES:
        if re.search(pat, low, re.I):
            out.extend(tools)
    if lesson is None:
        semantic_lesson = related_lesson(course, 0, 1, blob, allow_index_fallback=False)
        if semantic_lesson:
            out.extend(str(x) for x in (semantic_lesson.get("concepts") or [])[:5])
    if not out:
        # Use concepts from the course as the safest non-solution scaffolding.
        for l in (course.get("lessons") or [])[:3]:
            out.extend(str(x) for x in (l.get("concepts") or [])[:2])
    return uniq(out, 7)


def course_guide(course: dict[str, Any]) -> dict[str, Any]:
    concepts: list[str] = []
    for lesson in course.get("lessons") or []:
        concepts.extend(str(x) for x in (lesson.get("concepts") or []))
    focus = uniq(concepts, 8)
    lang = language_for(course)
    visible_focus = behavior_focus([lang] + focus[:7], 6)
    title = str(course.get("title") or "this course")
    requirements = [
        f"By the end of {title}, you must be able to use the course concepts in your own work rather than only recognize completed examples.",
        "You must be able to explain the main course ideas as behaviors and decisions, then apply them to a new problem without being told the exact syntax or implementation pattern.",
        "For each lesson, you must be able to state what the lesson is teaching and demonstrate the idea on a small new case.",
        "For each example, you must be able to predict or determine its result, explain the important lines or commands, and reproduce the same idea with different values or data.",
        "For each exercise, your submission must satisfy the behavior or answer requested by the exercise and you must be able to explain why it is correct.",
        "For each project or capstone, the finished submission must satisfy every stated requirement and demonstrate the required normal and relevant edge/failure behavior.",
        "For each knowledge check, you must be able to justify the selected answer using a course rule or concept instead of guessing.",
    ]
    return {
        "title": "Course requirements — what you must be able to do",
        "intro": f"Treat {title} like exam preparation: the requirements below describe what you should be able to demonstrate. They do not give you solution code.",
        "plainEnglishTitle": "In plain English",
        "plainEnglish": [
            f"This course is training you to use {title} ideas on new problems, not just recognize code or answers you have already seen.",
            "You should finish able to read a requirement, describe the behavior it needs in ordinary language, and then choose the code or method yourself.",
        ],
        "focus": visible_focus,
        "tools": uniq([lang] + focus[:5], 6),
        "requirements": requirements,
        "steps": requirements,
        "checkpoint": "You are ready to finish the course when you can meet these requirements with unfamiliar inputs or a new problem, not only repeat a memorized example.",
    }


def lesson_guide(course: dict[str, Any], lesson: dict[str, Any]) -> dict[str, Any]:
    objectives = [str(x) for x in (lesson.get("objectives") or [])]
    concepts = [str(x) for x in (lesson.get("concepts") or [])]
    exs = lesson.get("examples") or lesson.get("example") or []
    if not isinstance(exs, list):
        exs = [exs]
    code_blob = "\n".join(str(x) for x in exs[:2])
    imports, feats = code_features(code_blob, course)
    tools = uniq(([f"import {x}" for x in imports] + feats + concepts + [language_for(course, code_blob)]), 8)
    visible_focus = behavior_focus(tools, 6)
    lesson_title = str(lesson.get("title") or "this lesson")
    requirements: list[str] = []
    for item in visible_focus[:4]:
        requirements.append("You must be able to demonstrate this behavior: " + item + ".")
    requirements.extend([
        "Given a small example from this lesson, you must be able to determine its output, result, state change, or effect before relying on the provided explanation.",
        "You must be able to explain the important actions in the lesson examples in ordinary language instead of repeating variable names or code keywords.",
        "You must be able to create or complete one new small case that uses the same lesson idea with different values, data, or conditions.",
        "You must be able to identify at least one mistake, invalid case, limitation, or edge case that is relevant to this lesson.",
    ])
    requirements = uniq(requirements, 9)
    return {
        "title": "Lesson requirements — what you must be able to do",
        "intro": "Meet the requirements below for this lesson. Use the examples as evidence and practice, not as code to memorize or wording to copy.",
        "plainEnglishTitle": "In plain English",
        "plainEnglish": [
            ("This lesson mainly trains you in these behaviors: " + "; ".join(visible_focus[:3]) + ".") if visible_focus else "This lesson trains you to recognize a behavior or decision and explain what should happen next.",
            "After studying it, you should be able to describe the required behavior in ordinary language first, then decide how to express it in code yourself.",
        ],
        "focus": visible_focus,
        "tools": tools,
        "requirements": requirements,
        "steps": requirements,
        "checkpoint": "You are ready to move on when you can satisfy the requirements using a fresh small example without copying the lesson example.",
    }


def example_guide(course: dict[str, Any], lesson: dict[str, Any], code: str, index: int) -> dict[str, Any]:
    imports, feats = code_features(code, course)
    concepts = [str(x) for x in (lesson.get("concepts") or [])]
    tools = uniq(([f"import {x}" for x in imports] + feats), 8)
    if not tools:
        tools = uniq(concepts + [language_for(course, code)], 8)
    visible_focus = behavior_focus(tools, 6)
    requirements = [
        "Before checking the result, you must determine or predict what this example will output, return, change, create, query, or otherwise do.",
        "You must identify the important behavior in the example — what repeats, what is checked, what changes, what may be skipped or stopped, and what result is produced — without simply repeating the code words.",
        "You must be able to explain how the input, variables, data, state, or query result changes from the beginning of the example to the end.",
        "Change at least one meaningful value, condition, input, collection, query condition, or configuration value and determine the new expected result before running or checking it.",
        "Create a separate small example that demonstrates the same concept with different values or data; do not copy the original example line for line.",
    ]
    return {
        "title": f"Example {index + 1} requirements — what you must do",
        "intro": "Treat this example like an exam trace-and-apply question. The goal is to prove that you understand what the example does and can transfer the idea to a new case.",
        "plainEnglishTitle": "What this code means in plain English",
        "plainEnglish": [
            "Your job is to translate the example into ordinary behavior: how many times something happens, what condition changes the path, what gets skipped or stopped, and what result is eventually shown or returned.",
            "Do not use the variable names or exact code keywords as the explanation; describe what they mean in the program instead.",
        ],
        "focus": visible_focus,
        "tools": tools,
        "requirements": requirements,
        "steps": requirements,
        "checkpoint": "You understand the example when you can predict it, explain it, change it, and recreate the same idea with different data.",
    }


def _match_tokens(value: str) -> set[str]:
    stop = {
        "the", "and", "for", "with", "from", "that", "this", "your", "into", "using",
        "use", "write", "given", "return", "build", "create", "make", "show", "explain",
        "what", "when", "where", "which", "why", "how", "then", "than", "only", "first",
        "task", "code", "example", "exercise", "project", "lesson", "apply", "small", "simple",
        "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
        "each", "its", "their", "them", "does", "will", "can",
    }
    out: set[str] = set()
    for w in normalized(value).split():
        if len(w) < 3 or w in stop:
            continue
        # Light singularization improves matching such as "hash map" ↔ "hash maps"
        # without attempting full linguistic stemming.
        if len(w) > 4 and w.endswith("s") and not w.endswith("ss"):
            w = w[:-1]
        out.add(w)
    return out


def related_lesson(course: dict[str, Any], i: int, total: int, probe: str = "", allow_index_fallback: bool = False) -> dict[str, Any] | None:
    lessons = course.get("lessons") or []
    if not lessons:
        return None
    pnorm = normalized(probe)
    ptok = _match_tokens(probe)
    best: dict[str, Any] | None = None
    best_score = 0
    if pnorm and ptok:
        for lesson in lessons:
            title = str(lesson.get("title") or "")
            concepts = [str(x) for x in (lesson.get("concepts") or [])]
            objectives = [str(x) for x in (lesson.get("objectives") or [])]
            score = 0
            # Exact concept/title phrases are much stronger than generic token overlap.
            low_information_phrases = {"return", "function", "functions", "input", "output", "value", "values", "string", "strings", "number", "numbers", "data", "code", "with", "as", "self"}
            for phrase, weight in [(title, 7), *[(c, 8) for c in concepts], *[(o, 4) for o in objectives]]:
                pn = normalized(phrase)
                # Match complete normalized phrases, never character substrings.
                # This avoids false matches such as complexity "O(n)" inside
                # the words "two numbers" while still allowing exact "dict".
                if pn and pn not in low_information_phrases and re.search(r"(?:^| )" + re.escape(pn) + r"(?: |$)", pnorm):
                    score += weight
            title_tokens = _match_tokens(title)
            concept_tokens = _match_tokens(" ".join(concepts))
            objective_tokens = _match_tokens(" ".join(objectives))
            score += 4 * len(ptok & title_tokens)
            score += 5 * len(ptok & concept_tokens)
            score += 2 * len(ptok & objective_tokens)
            if score > best_score:
                best_score, best = score, lesson
    if best is not None and best_score >= 4:
        return best
    if allow_index_fallback:
        if total <= 1:
            return lessons[0]
        idx = min(len(lessons) - 1, int(i * len(lessons) / total))
        return lessons[idx]
    return None


def exercise_guide(course: dict[str, Any], ex: dict[str, Any], i: int, total: int) -> dict[str, Any]:
    title = str(ex.get("title") or f"Exercise {i+1}")
    prompt = str(ex.get("prompt") or ex.get("description") or "Complete the task using the course concepts.")
    probe = " ".join([title, prompt, str(ex.get("hint", ""))])
    lesson = related_lesson(course, i, total, probe, allow_index_fallback=False)
    blob = " ".join([probe, text((lesson or {}).get("concepts", []))])
    tools = inferred_tools(blob, course, lesson)
    visible_focus = behavior_focus(tools, 6)
    reasoning = bool(re.search(r"explain|identify|decide|compare|describe|why|diagnos|reason|design|sketch|list .*steps|write out", prompt, re.I)) or language_for(course) == "written reasoning / planning"
    requirements: list[str] = []
    if prompt:
        requirements.append(behavioralize_sentence(_exam_sentence(prompt)))
    if reasoning:
        requirements.extend([
            "Your response must directly answer the question or decision requested by the exercise rather than only define the topic.",
            "Choose the course idea that matches the required behavior, but decide the exact syntax, command, query form, or implementation yourself.",
            "Your explanation must connect the course concept to the specific facts, inputs, constraints, or scenario in the exercise.",
            "Your answer must include enough reasoning, evidence, or a small example to show why the conclusion is correct.",
            "If a reasonable counterexample, trade-off, invalid case, or edge case applies, your answer must address it.",
        ])
    else:
        requirements.extend([
            "The program, function, query, command, configuration, or other submission must produce the behavior or result requested by the exercise for a normal valid case.",
            "Choose an implementation that produces the requested behavior; the guidance should not tell you the exact code construct to use unless the original exercise explicitly requires one.",
            "The required input and output/result relationship described by the exercise must be preserved; do not add behavior that changes the requested result.",
            "At least one relevant boundary, empty, duplicate, invalid, missing-data, or failure case must be checked when that type of case can occur.",
            "You must be able to explain why your submission satisfies the exercise without relying on the provided hint or a copied solution.",
        ])
    requirements = uniq(requirements, 8)
    return {
        "title": "Exercise question — what your answer must do",
        "intro": "Treat this as an exam-style task. The requirements describe the expected result; you decide how to write the answer or code.",
        "plainEnglishTitle": "In plain English",
        "plainEnglish": [
            "Read the exercise as a behavior or result to produce. Describe that behavior in ordinary language before deciding how to implement it.",
            "The guidance should help you understand the target result without naming the exact loop, condition, variable, function shape, query clause, command, or other code construct to copy.",
        ],
        "focus": visible_focus,
        "tools": tools,
        "requirements": requirements,
        "steps": requirements,
        "checkpoint": "You are finished when the requested behavior can be demonstrated and you can explain why your own answer is correct.",
    }


def project_specific_requirements(title: str, desc: str) -> tuple[list[str], list[str]]:
    """Return required constructs + exam-style behavioral requirements.

    These are deliberately specifications, not implementation steps. They tell the
    learner what the finished program must do (the same style as a programming
    exam prompt) while leaving the implementation to the learner.
    """
    blob = normalized(title + " " + desc)
    if re.search(r"expense|spending|budget", blob):
        return (
            ["list of dictionaries", "while loop", "functions", "json", "datetime.date", "try / except"],
            [
                "The program must keep a collection of expenses. Every expense must store an amount, a category, a description, and a date.",
                "When the program starts, it must load previously saved expenses from a JSON file. If no usable file exists yet, it must start with an empty expense list instead of crashing.",
                "The user must be able to repeatedly choose what to do from a menu until they choose Exit.",
                "The menu must let the user add a new expense by entering an amount, category, and description. The program must attach the current date to the new expense.",
                "The amount must be numeric and greater than 0. Invalid input must be rejected and the user must be asked again rather than ending the program.",
                "The user must be able to view all recorded expenses with the date, category, amount, and description shown clearly.",
                "The user must be able to view the total amount spent across all expenses.",
                "The user must be able to view totals grouped by category and search for expenses belonging to one category without case sensitivity causing false mismatches.",
                "After an expense is added, the updated data must be saved so that closing and reopening the program does not erase it.",
                "The program must exit cleanly when the user chooses the Exit option.",
            ],
        )
    if re.search(r"number.?guess|guessing", blob):
        return (["random", "while loop", "input validation", "if / elif / else", "attempt counter"], [
            "The program must generate one secret number inside the stated range before the guessing begins.",
            "The user must repeatedly enter guesses until the correct number is guessed or the task's stopping rule is reached.",
            "After each valid guess, the program must tell the user whether the guess is too high, too low, or correct.",
            "Non-numeric or out-of-range input must be handled without crashing the program.",
            "The program must keep track of the number of valid attempts and display it when the game ends.",
        ])
    if re.search(r"markdown", blob):
        return (["string processing", "line-by-line loop", "helper functions", "conditionals", "regular expressions only if useful"], [
            "The program must accept Markdown text or a Markdown file as input and produce HTML as output.",
            "It must support the Markdown features explicitly required by the project, and unsupported plain text must remain readable instead of being corrupted.",
            "Each supported Markdown pattern must be converted to the corresponding valid HTML structure.",
            "Mixed input containing more than one supported Markdown feature must be converted correctly.",
            "The finished program must demonstrate at least one normal example, one mixed-format example, and one input that should remain unchanged.",
        ])
    if re.search(r"\b(?:deck|playing card|shuffle card|deal card)\b", blob):
        return (["Card class", "Deck class", "list/collection", "random.shuffle", "methods", "string representation"], [
            "Create a Card type that stores a card's rank and suit and can be displayed in a readable form.",
            "Create a Deck type that contains a complete collection of Card objects.",
            "The deck must support shuffling and dealing cards through methods of the Deck type.",
            "Dealing a card must remove that card from the remaining deck so the same physical card is not dealt twice.",
            "The program must demonstrate the initial deck size, shuffled/dealt behavior, remaining-card count, and what happens when no cards remain.",
        ])
    if re.search(r"\b(?:inventory|stock|warehouse|order processing|order system|purchase order)\b", blob):
        return (["product/inventory data model", "collections", "functions or methods", "validation", "tests"], [
            "The system must store products with the identifying information and quantity required by the project.",
            "The user or calling code must be able to add products and inspect the current inventory.",
            "An order or stock-removal action must reduce the correct product quantity only when enough stock is available.",
            "Unknown products, non-positive quantities, and insufficient stock must be rejected without leaving the inventory in an incorrect partial state.",
            "The finished project must demonstrate at least one successful stock change and the required failure cases.",
        ])
    if re.search(r"text adventure|adventure", blob):
        return (["Room/Player/Item classes", "composition", "map/dictionary of exits", "while-loop command loop", "state"], [
            "The program must create a small playable world made of rooms connected by valid exits.",
            "A player must have a current location and, if required by the project, an inventory of items.",
            "The user must repeatedly enter commands until the game ends or the user chooses to quit.",
            "The supported commands must change or display game state correctly, such as moving, looking, or taking an item when those actions are part of the project.",
            "Invalid commands and impossible moves must produce a clear message without corrupting the game state.",
            "The project must include at least one complete path that can be played from the starting state to the intended ending state.",
        ])
    return ([], [])


def _exam_sentence(value: str) -> str:
    value = re.sub(r"\s+", " ", str(value or "")).strip()
    if not value:
        return ""
    if value[-1] not in ".!?":
        value += "."
    return value


def _project_intro(course: dict[str, Any], title: str, desc: str) -> str:
    lang = language_for(course, desc)
    if lang == "written reasoning / planning":
        return f'Complete the project “{title}” so that it satisfies every requirement below. The requirements define what the finished submission must contain; you decide how to produce it.'
    if lang.startswith("commands/configuration"):
        return f'Complete the practical project “{title}” so that the final environment/configuration satisfies every requirement below. The requirements describe the required result, not the commands to copy.'
    if lang == "SQL":
        return f'Complete the SQL project “{title}” so that the schema/queries satisfy every requirement below. Decide how to write the SQL yourself.'
    if lang == "HTML/CSS/JavaScript":
        return f'Build “{title}” so that the finished web application satisfies every requirement below. The requirements describe the behavior the user should see; you decide how to implement it.'
    return f'Write a {lang} program/project called “{title}” that satisfies every requirement below. Treat this like an exam question: the required behavior is specified, but the solution code is yours to write.'


def _generic_project_requirements(course: dict[str, Any], title: str, desc: str, req: list[str], tools: list[str]) -> list[str]:
    lang = language_for(course, desc)
    out: list[str] = []
    if desc:
        out.append(behavioralize_sentence(_exam_sentence(desc)))
    out.extend(behavioralize_sentence(_exam_sentence(x)) for x in req if _exam_sentence(x))

    # Add outcome-oriented requirements, not implementation order.
    if lang == "written reasoning / planning":
        out.extend([
            "The submission must make the goal or decision being addressed explicit.",
            "Important choices must be justified with evidence, examples, constraints, or trade-offs rather than only stated.",
            "The final submission must be organized clearly enough that another person can verify every requirement.",
        ])
    elif lang.startswith("commands/configuration"):
        out.extend([
            "The final environment or configuration must be verifiable with real output/status evidence rather than assumed to work.",
            "A normal success case and at least one relevant failure or recovery case must be demonstrated or documented.",
            "The submission must make clear what target/resource was changed and what final state proves the project works.",
        ])
    elif lang == "SQL":
        out.extend([
            "The schema/query result must be demonstrably correct using representative data.",
            "The project must show the requested result set or database state, not only the SQL text.",
            "At least one relevant edge case such as missing rows, duplicate values, NULLs, or empty results must be considered when it applies to the task.",
        ])
    elif lang == "HTML/CSS/JavaScript":
        out.extend([
            "The required behavior must be reachable through the browser interface and must visibly update or respond as described by the task.",
            "The interface must handle the main empty/invalid/error state that is relevant to this project instead of silently failing.",
            "The finished project must be demonstrated in the browser with the required interactions working from start to finish.",
        ])
    else:
        out.extend([
            "The finished program must produce the result/output described by the task for a normal valid case.",
            "Input or data that can reasonably be invalid for this task must be handled without an unexplained crash or corrupted state.",
            "The project must demonstrate at least one normal case and at least one relevant edge or failure case.",
        ])

    return uniq(out, 12)


def project_guide(course: dict[str, Any], proj: dict[str, Any], i: int) -> dict[str, Any]:
    title = str(proj.get("title") or proj.get("name") or f"Project {i+1}")
    desc = str(proj.get("description") or proj.get("desc") or proj.get("prompt") or "")
    req = [str(x) for x in (proj.get("requirements") or proj.get("deliverables") or [])]
    special_tools, special_requirements = project_specific_requirements(title, desc)
    tools = uniq(special_tools + inferred_tools(title + " " + desc + " " + " ".join(req), course), 8)
    visible_focus = behavior_focus(tools, 6)
    requirements = special_requirements or _generic_project_requirements(course, title, desc, req, tools)
    # Preserve explicit source requirements even for a custom project template.
    if special_requirements and req:
        requirements = uniq(requirements + [behavioralize_sentence(_exam_sentence(x)) for x in req], 14)
    return {
        "title": "Project question — what your finished work must do",
        "intro": _project_intro(course, title, desc),
        "plainEnglishTitle": "In plain English",
        "plainEnglish": [
            f"Your job is to build a finished “{title}” that a user or reviewer can actually test against the behaviors listed below.",
            "The brief tells you what the finished work must do from the user or system point of view. You decide the exact code structure, names, syntax, files, queries, commands, and implementation order yourself.",
        ],
        "focus": visible_focus,
        "tools": tools,
        "requirements": requirements,
        # Keep steps as a compatibility mirror for older clients/tests. The UI for
        # projects intentionally renders these as unnumbered requirements.
        "steps": requirements,
        "checkpoint": "You are finished when every requirement can be demonstrated or checked and you can explain the code/design you wrote to meet it.",
    }

def quiz_guide(course: dict[str, Any], q: dict[str, Any], i: int, total: int) -> dict[str, Any]:
    lesson = related_lesson(course, i, total, text(q), allow_index_fallback=True)
    concepts = [str(x) for x in ((lesson or {}).get("concepts") or [])]
    tools = uniq(concepts + [language_for(course)], 6)
    visible_focus = behavior_focus(tools, 5)
    requirements = [
        "Determine which answer correctly responds to the knowledge-check question using the course material rather than familiarity or guessing.",
        "Base your decision on the behavior, rule, or reasoning taught in the related lesson rather than matching an answer to familiar code words.",
        "You must be able to state the rule, definition, behavior, or reasoning that makes your selected answer correct.",
        "You must be able to explain why at least one competing option does not fit the question or scenario.",
    ]
    return {
        "title": "Knowledge-check requirements — what you must determine",
        "intro": "Treat the question like a short exam item. The goal is not only to select an option but to know why it is correct.",
        "plainEnglishTitle": "In plain English",
        "plainEnglish": [
            "Decide which answer best matches the behavior or rule taught in the related lesson, not which option merely contains familiar syntax words.",
            "You should be able to explain the reason for your choice in ordinary language before you reveal the answer.",
        ],
        "focus": visible_focus,
        "tools": tools,
        "requirements": requirements,
        "steps": requirements,
        "checkpoint": "You are ready to check the answer when you can justify your choice without seeing the answer key.",
    }


def build() -> dict[str, Any]:
    output: dict[str, Any] = {
        "schemaVersion": 2,
        "purpose": "Exam-style requirement briefs for every course learning item; no finished solutions or answer keys are stored here.",
        "courses": {},
    }
    for path in sorted(COURSE_DIR.glob("*.json")):
        course = json.loads(path.read_text(encoding="utf-8"))
        cid = str(course.get("id") or path.stem)
        lessons = course.get("lessons") or []
        exercises = course.get("exercises") or []
        projects = course.get("projects") or []
        quiz = course.get("quiz") or []
        c_out: dict[str, Any] = {
            "id": cid,
            "title": course.get("title", cid),
            "course": course_guide(course),
            "lessons": {},
            "exercises": [],
            "projects": [],
            "quiz": [],
        }
        for li, lesson in enumerate(lessons):
            lid = str(lesson.get("id") or f"lesson-{li}")
            exs = lesson.get("examples") or lesson.get("example") or []
            if not isinstance(exs, list):
                exs = [exs]
            c_out["lessons"][lid] = {
                "title": lesson.get("title", f"Lesson {li+1}"),
                "practice": lesson_guide(course, lesson),
                "examples": [example_guide(course, lesson, str(code), ei) for ei, code in enumerate(exs)],
            }
        for i, ex in enumerate(exercises):
            c_out["exercises"].append({
                "id": ex.get("id") or f"exercise-{i}",
                "title": ex.get("title", f"Exercise {i+1}"),
                "practice": exercise_guide(course, ex, i, len(exercises)),
            })
        for i, proj in enumerate(projects):
            c_out["projects"].append({
                "id": proj.get("id") or f"project-{i}",
                "title": proj.get("title") or proj.get("name") or f"Project {i+1}",
                "practice": project_guide(course, proj, i),
            })
        if course.get("capstone"):
            cap = course["capstone"]
            c_out["projects"].append({
                "id": cap.get("id") or "capstone",
                "title": cap.get("title") or "Capstone",
                "practice": project_guide(course, cap, len(projects)),
                "capstone": True,
            })
        for i, q in enumerate(quiz):
            c_out["quiz"].append({
                "id": q.get("id") or f"quiz-{i}",
                "practice": quiz_guide(course, q, i, len(quiz)),
            })
        output["courses"][cid] = c_out
    return output


if __name__ == "__main__":
    data = build()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for old_file in OUT_DIR.glob("*.json"):
        old_file.unlink()
    index = {"schemaVersion": 2, "courses": []}
    total_bytes = 0
    for cid, course_data in data["courses"].items():
        out_file = OUT_DIR / f"{cid}.json"
        payload = {"schemaVersion": 2, "purpose": data["purpose"], **course_data}
        out_file.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        total_bytes += out_file.stat().st_size
        index["courses"].append({
            "id": cid,
            "title": course_data["title"],
            "file": f"practice-guidance/{cid}.json",
            "counts": {
                "lessons": len(course_data["lessons"]),
                "examples": sum(len(l["examples"]) for l in course_data["lessons"].values()),
                "exercises": len(course_data["exercises"]),
                "projects": len(course_data["projects"]),
                "quiz": len(course_data["quiz"]),
            },
        })
    INDEX_OUT.write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    total_bytes += INDEX_OUT.stat().st_size
    course_count = len(data["courses"])
    lesson_count = sum(len(c["lessons"]) for c in data["courses"].values())
    example_count = sum(sum(len(l["examples"]) for l in c["lessons"].values()) for c in data["courses"].values())
    exercise_count = sum(len(c["exercises"]) for c in data["courses"].values())
    project_count = sum(len(c["projects"]) for c in data["courses"].values())
    quiz_count = sum(len(c["quiz"]) for c in data["courses"].values())
    print(json.dumps({
        "courses": course_count,
        "lessons": lesson_count,
        "examples": example_count,
        "exercises": exercise_count,
        "projects_including_capstones": project_count,
        "knowledge_checks": quiz_count,
        "bytes": total_bytes,
    }, indent=2))
