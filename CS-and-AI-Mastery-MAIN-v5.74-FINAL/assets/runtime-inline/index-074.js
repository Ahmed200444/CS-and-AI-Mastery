
// ============ SQL Code Review (Phase 3C.2) — regex/text-heuristic based ============
// Real SQLite has no accessible query-plan API from sql.js, so this analyzes the raw
// SQL text directly. Confidence is calibrated accordingly: literal, unambiguous token
// matches (SELECT *, = NULL) are "confirmed"; structural pattern matches needing some
// judgment are "likely"/"possible" -- never overclaiming certainty a text scan can't have.
function reviewSqlCode(sql){
  var findings = [];
  var good = [];
  var clean = sql.replace(/--[^\n]*/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' '); // strip comments for matching
  var upper = clean.toUpperCase();

  // ---- SELECT * ----
  if(/SELECT\s+\*/i.test(clean)){
    findings.push({check:'select-star', confidence:'confirmed',
      issue:"Uses SELECT * instead of naming columns.",
      why:"Selecting all columns pulls more data than you likely need and breaks silently if the table's columns ever change.",
      suggestion:"List only the columns you actually need, e.g. 'SELECT name, email FROM ...'."});
  } else {
    good.push("Selects specific columns instead of SELECT * — good habit.");
  }

  // ---- NULL comparison mistakes: = NULL / <> NULL / != NULL ----
  if(/[=<>!]=?\s*NULL\b/i.test(clean) && !/IS\s+(NOT\s+)?NULL/i.test(clean.match(/[=<>!]=?\s*NULL\b/i)[0]+clean)){
    if(/(?:=|<>|!=)\s*NULL\b/i.test(clean)){
      findings.push({check:'null-comparison', confidence:'confirmed',
        issue:"Compares a column to NULL using = or != instead of IS NULL / IS NOT NULL.",
        why:"In SQL, NULL isn't equal to anything, including itself — '= NULL' never matches any row, even ones that are actually NULL.",
        suggestion:"Use 'column IS NULL' or 'column IS NOT NULL' instead of '= NULL' / '!= NULL'."});
    }
  }

  // ---- HAVING without any aggregate function (likely should be WHERE) ----
  var havingMatch = clean.match(/HAVING\s+([\s\S]*?)(?:ORDER\s+BY|LIMIT|;|$)/i);
  if(havingMatch){
    var havingBody = havingMatch[1];
    var hasAggregate = /\b(COUNT|SUM|AVG|MIN|MAX)\s*\(/i.test(havingBody);
    if(!hasAggregate){
      findings.push({check:'where-vs-having', confidence:'likely',
        issue:"HAVING is used, but its condition doesn't reference an aggregate function (COUNT/SUM/AVG/MIN/MAX).",
        why:"HAVING filters groups AFTER aggregation and typically runs later than WHERE; if the condition isn't about an aggregate, it usually belongs in WHERE, which filters rows earlier and is often more efficient.",
        suggestion:"If this condition doesn't need an aggregate, move it to a WHERE clause instead."});
    }
  }
  // ---- aggregate function used in WHERE (usually an error / always should be HAVING) ----
  var whereMatch = clean.match(/WHERE\s+([\s\S]*?)(?:GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|;|$)/i);
  if(whereMatch && /\b(COUNT|SUM|AVG|MIN|MAX)\s*\(/i.test(whereMatch[1])){
    findings.push({check:'where-vs-having', confidence:'likely',
      issue:"An aggregate function (COUNT/SUM/AVG/MIN/MAX) appears inside WHERE.",
      why:"Aggregate functions summarize GROUPS of rows, which don't exist yet at the point WHERE filters — most databases reject this outright, and where they don't, the result is rarely what's intended.",
      suggestion:"Move the aggregate condition into a HAVING clause, which runs after grouping."});
  }

  // ---- comma-join with no WHERE joining the tables (cartesian product risk) ----
  var fromMatch = clean.match(/FROM\s+([\s\S]*?)(?:WHERE|GROUP\s+BY|ORDER\s+BY|LIMIT|;|$)/i);
  if(fromMatch && /,/.test(fromMatch[1]) && !/JOIN/i.test(fromMatch[1])){
    if(!whereMatch || !whereMatch[1].trim()){
      findings.push({check:'cartesian-product', confidence:'likely',
        issue:"Multiple tables listed in FROM with commas, and no WHERE clause connecting them.",
        why:"Without a condition linking the tables, this produces a cartesian product — every row from one table paired with every row from the other, which grows very large very fast and is rarely what's intended.",
        suggestion:"Add an explicit JOIN ... ON condition, or a WHERE clause equating the tables' related columns."});
    }
  }

  // ---- JOIN with no visible ON clause before the next JOIN/WHERE/GROUP/ORDER/end ----
  var joinPattern = /\bJOIN\s+[\w.]+(?:\s+(?:AS\s+)?\w+)?\s*(?=(JOIN|WHERE|GROUP\s+BY|ORDER\s+BY|LIMIT|;|$))/ig;
  var jm;
  while((jm = joinPattern.exec(clean)) !== null){
    var afterJoin = clean.slice(jm.index, jm.index + jm[0].length + 20);
    if(!/\bON\b/i.test(jm[0]) && !/\bUSING\b/i.test(jm[0])){
      findings.push({check:'missing-join-condition', confidence:'likely',
        issue:"A JOIN doesn't appear to have a visible ON (or USING) condition right after it.",
        why:"A JOIN with no condition matches every row on one side with every row on the other (a cartesian product) rather than the related rows you likely want.",
        suggestion:"Add 'ON left.col = right.col' (or 'USING(col)') immediately after the JOIN."});
      break; // one mention is enough to act on
    }
  }

  // ---- mixed aggregate + non-aggregate column in SELECT without GROUP BY ----
  var selectMatch = clean.match(/SELECT\s+([\s\S]*?)\s+FROM/i);
  if(selectMatch){
    var selectList = selectMatch[1];
    var hasAgg = /\b(COUNT|SUM|AVG|MIN|MAX)\s*\(/i.test(selectList);
    var hasPlainCol = /(?:^|,)\s*[\w.]+\s*(?:,|$)/.test(selectList.replace(/\b(COUNT|SUM|AVG|MIN|MAX)\s*\([^)]*\)/ig,''));
    var hasGroupBy = /GROUP\s+BY/i.test(clean);
    if(hasAgg && hasPlainCol && !hasGroupBy && !/^\s*\*\s*$/.test(selectList)){
      findings.push({check:'aggregation-grouping', confidence:'likely',
        issue:"SELECT mixes an aggregate function (like COUNT/SUM) with a plain column, but there's no GROUP BY.",
        why:"Without GROUP BY, it's ambiguous which row's value the plain column should show alongside the aggregate — SQLite will pick one arbitrarily rather than erroring, which can silently give a misleading result.",
        suggestion:"Add 'GROUP BY <the plain column(s)>' so each aggregate is computed per group, matching the non-aggregated column."});
    }
  }

  // ---- unnecessary IN (subquery) that could be a JOIN ----
  if(/\bIN\s*\(\s*SELECT\b/i.test(clean)){
    findings.push({check:'subquery-style', confidence:'possible',
      issue:"Uses 'WHERE ... IN (SELECT ...)' — this often works, but can sometimes be a JOIN instead.",
      why:"This isn't wrong, but a JOIN can sometimes be more efficient and lets you also select columns from the other table if you need them.",
      suggestion:"If you need columns from the subquery's table too, consider rewriting as a JOIN instead of IN (SELECT ...)."});
  }

  // ---- duplicate-row risk: joining before aggregating without DISTINCT ----
  var joinCount = (clean.match(/\bJOIN\b/ig)||[]).length;
  if(joinCount >= 1 && /\b(SUM|COUNT)\s*\(/i.test(clean) && !/COUNT\s*\(\s*DISTINCT/i.test(clean) && !/GROUP\s+BY/i.test(clean)===false && joinCount>=2){
    findings.push({check:'duplicate-rows', confidence:'possible',
      issue:"Joining multiple tables and aggregating (SUM/COUNT) in the same query.",
      why:"If a join multiplies rows (e.g. a one-to-many relationship), a SUM or COUNT computed afterward can be inflated by the duplication, not the real underlying total.",
      suggestion:"Double-check whether the join is multiplying rows; consider COUNT(DISTINCT ...) or aggregating in a subquery before joining."});
  }

  // ---- readability: multi-table query with no aliases ----
  if(joinCount >= 1 && !/\bJOIN\s+[\w.]+\s+(?:AS\s+)?[a-zA-Z_][a-zA-Z0-9_]{0,3}\b/i.test(clean)){
    findings.push({check:'readability', confidence:'possible',
      issue:"Multiple tables are joined without short aliases.",
      why:"Without aliases, repeating full table names for every column reference gets verbose and harder to scan quickly.",
      suggestion:"Give each table a short alias, e.g. 'FROM orders o JOIN customers c ON o.customer_id = c.id'."});
  } else if(joinCount >= 1){
    good.push("Uses table aliases in a multi-table query — easier to read.");
  }

  if(!findings.length){
    good.push("No structural issues found by this pattern-based scan. This checks common patterns, not full correctness — verify against the expected result too.");
  }

  return { findings: findings, good: good };
}

var PY_REVIEW_HARNESS = `
import ast, json

_findings = []
_good = []

def _add(check, confidence, issue, why, suggestion, snippet=None, line=None):
    f = {"check": check, "confidence": confidence, "issue": issue, "why": why, "suggestion": suggestion}
    if snippet: f["snippet"] = snippet
    if line: f["line"] = line
    _findings.append(f)

def _good_note(text):
    _good.append(text)

_src = _SRC
_result = {"findings": [], "good": [], "parse_ok": True}

try:
    tree = ast.parse(_src)
except SyntaxError as e:
    _result["parse_ok"] = False
    _result["findings"] = [{
        "check": "syntax", "confidence": "confirmed",
        "issue": "Syntax error: " + str(e.msg),
        "why": "Python's own parser rejected this code at line " + str(e.lineno) + " — it can't run as written.",
        "suggestion": "Fix the syntax at line " + str(e.lineno) + " (look for a missing colon, unmatched bracket, or bad indentation nearby)."
    }]
    _result["good"] = []
else:
    functions = [n for n in ast.walk(tree) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]

    # ---- bare / broad except ----
    for n in ast.walk(tree):
        if isinstance(n, ast.ExceptHandler):
            if n.type is None:
                _add("broad-except", "confirmed",
                     "Bare 'except:' catches everything, including KeyboardInterrupt and real bugs.",
                     "A bare except silently swallows ALL errors -- including typos and logic bugs you'd want to see, not just the one you're expecting.",
                     "Catch a specific exception type instead, e.g. 'except ValueError:' or 'except (KeyError, IndexError):'.",
                     line=n.lineno)
            elif isinstance(n.type, ast.Name) and n.type.id in ("Exception", "BaseException"):
                _add("broad-except", "confirmed",
                     "'except " + n.type.id + ":' is very broad.",
                     "Catching the base Exception class hides which specific failure you actually expected, making bugs harder to find later.",
                     "Narrow it to the specific exception(s) this code can actually raise.",
                     line=n.lineno)

    # ---- mutable default arguments ----
    for fn in functions:
        for default in fn.args.defaults:
            if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                _add("mutable-default", "confirmed",
                     "Function '" + fn.name + "' uses a mutable default argument.",
                     "Default argument values are created ONCE, when the function is defined -- every call that doesn't pass this argument shares and mutates the SAME list/dict, which usually isn't what you want.",
                     "Use None as the default and create the real list/dict inside the function body: 'def " + fn.name + "(x=None): x = x or []'.",
                     line=fn.lineno)

    # ---- ambiguous single-letter names (PEP8 E741: l, O, I) ----
    for n in ast.walk(tree):
        if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Store) and n.id in ("l", "O", "I"):
            _add("naming", "confirmed",
                 "Variable name '" + n.id + "' is hard to distinguish from 1 or 0 in many fonts.",
                 "This is a well-known Python style pitfall (PEP 8 explicitly calls out l/O/I) -- easy to misread, especially in code review.",
                 "Rename to something descriptive, even short (e.g. 'lst', 'obj', 'idx').",
                 line=n.lineno)
            break  # one mention is enough, don't spam per-occurrence

    # ---- range(len(x)) instead of enumerate ----
    # Only flagged for NON-nested loops: nested index loops (matrix math, cross-referencing
    # multiple arrays by the same index) very often genuinely need the index itself, not just
    # element access -- flagging those would be a false positive on legitimate code.
    def _is_nested_for(node, root):
        for outer in ast.walk(root):
            if isinstance(outer, ast.For) and outer is not node:
                for inner in ast.walk(outer):
                    if inner is node:
                        return True
        return False
    for n in ast.walk(tree):
        if isinstance(n, ast.For):
            it = n.iter
            if (isinstance(it, ast.Call) and isinstance(it.func, ast.Name) and it.func.id == "range"
                    and len(it.args) == 1 and isinstance(it.args[0], ast.Call)
                    and isinstance(it.args[0].func, ast.Name) and it.args[0].func.id == "len"
                    and not _is_nested_for(n, tree)):
                _add("loop-style", "possible",
                     "A 'for ... in range(len(...))' loop can sometimes be simpler.",
                     "This pattern re-indexes into the sequence manually; if you don't need the index for anything else, 'enumerate()' or iterating directly is often clearer.",
                     "If you need the index: 'for i, item in enumerate(seq):'. If you don't need it at all: 'for item in seq:'. (Skip this if you genuinely need index-based math across multiple sequences.)",
                     line=n.lineno)

    # ---- mutating a list while iterating over the SAME list object ----
    for n in ast.walk(tree):
        if isinstance(n, ast.For) and isinstance(n.iter, ast.Name):
            target_name = n.iter.id
            for inner in ast.walk(n):
                if isinstance(inner, ast.Call) and isinstance(inner.func, ast.Attribute):
                    if (isinstance(inner.func.value, ast.Name) and inner.func.value.id == target_name
                            and inner.func.attr in ("append", "remove", "pop", "insert", "clear")):
                        _add("mutation", "likely",
                             "Modifying '" + target_name + "' (via ." + inner.func.attr + "()) while iterating over it.",
                             "Changing a list's length while a for-loop is iterating over that SAME list can skip elements or raise unexpected errors -- Python doesn't reliably protect against this.",
                             "Iterate over a copy instead: 'for x in " + target_name + "[:]:' or build a new list instead of mutating in place.",
                             line=inner.lineno)

    # ---- unused variables (assigned but never read), per function scope ----
    for fn in functions:
        assigned = {}
        used = set()
        for n in ast.walk(fn):
            if isinstance(n, ast.Name):
                if isinstance(n.ctx, ast.Store) and not n.id.startswith("_"):
                    assigned.setdefault(n.id, n.lineno)
                elif isinstance(n.ctx, ast.Load):
                    used.add(n.id)
        for name, lineno in assigned.items():
            if name not in used and name not in (fn.args.__dict__.get("vararg", None) or ()):
                _add("unused-variable", "likely",
                     "'" + name + "' is assigned in '" + fn.name + "' but never used afterward.",
                     "An assigned-but-unused variable is often leftover debugging code or a sign the logic doesn't do what was intended.",
                     "Remove it if it's dead code, or use it if it was meant to feed into the result.",
                     line=lineno)

    # ---- direct indexing without an emptiness/length check (possible missing edge case) ----
    for fn in functions:
        has_length_check = False
        for n in ast.walk(fn):
            if isinstance(n, ast.If):
                cond_dump = ast.dump(n.test)
                if "len" in cond_dump or isinstance(n.test, (ast.Name, ast.UnaryOp)):
                    has_length_check = True
        if not has_length_check:
            for n in ast.walk(fn):
                if isinstance(n, ast.Subscript) and isinstance(n.slice, ast.Constant) and isinstance(n.slice.value, int):
                    if n.slice.value in (0, -1):
                        _add("edge-case", "possible",
                             "'" + fn.name + "' indexes directly (e.g. [0] or [-1]) with no visible check for an empty input.",
                             "If this function ever receives an empty list/string, this specific line would raise an IndexError.",
                             "Consider whether an empty input is possible here, and if so, handle it explicitly (e.g. 'if not seq: return ...').",
                             line=n.lineno)
                        break

    # ---- repeated code: near-duplicate statement sequences (3+ lines) ----
    def _stmt_key(s):
        try:
            return ast.dump(s, annotate_fields=False)
        except Exception:
            return None
    for fn in functions:
        stmts = fn.body
        seen = {}
        for i in range(len(stmts) - 2):
            window = tuple(_stmt_key(s) for s in stmts[i:i+3])
            if None in window:
                continue
            if window in seen:
                _add("duplication", "possible",
                     "A 3+ line block in '" + fn.name + "' looks nearly identical to another block earlier in the same function.",
                     "Repeated logic means any future fix has to be made in multiple places, and it's easy to update one copy and forget the other.",
                     "Consider extracting the repeated lines into a small helper function.",
                     line=getattr(stmts[i], "lineno", None))
                break
            seen[window] = i

    # ---- complexity observation (nesting depth) ----
    def _max_depth(node, depth=0):
        m = depth
        for child in ast.iter_child_nodes(node):
            if isinstance(child, (ast.For, ast.While, ast.If)):
                m = max(m, _max_depth(child, depth+1))
            else:
                m = max(m, _max_depth(child, depth))
        return m
    for fn in functions:
        d = _max_depth(fn)
        if d >= 3:
            _add("complexity", "possible",
                 "'" + fn.name + "' nests loops/conditionals " + str(d) + " levels deep.",
                 "Deep nesting makes code harder to trace mentally and is a common source of subtle bugs.",
                 "Consider extracting an inner block into its own helper function, or using early 'return'/'continue' to flatten the structure.",
                 line=fn.lineno)
        elif d <= 1 and len(functions) <= 2:
            _good_note("Clean, shallow control flow in '" + fn.name + "' -- easy to follow.")

    # ---- positive observations (only genuine ones, not filler) ----
    if functions and not any(f["check"] == "broad-except" for f in _findings):
        has_except = any(isinstance(n, ast.ExceptHandler) for n in ast.walk(tree))
        if has_except:
            _good_note("Exception handling targets specific error types rather than catching everything.")
    if not any(f["check"] == "mutable-default" for f in _findings) and any(fn.args.defaults for fn in functions):
        _good_note("Default arguments look safe (no mutable literals used as defaults).")
    if not any(f["check"] in ("unused-variable",) for f in _findings) and functions:
        _good_note("No unused variables detected -- every assigned name is actually used.")
    if not _findings:
        _good_note("No structural issues found by static analysis. This checks patterns, not full correctness -- run the real tests too.")

    _result["findings"] = _findings
    _result["good"] = _good

_RESULT_REVIEW = json.dumps(_result)
`;

(function(){
  var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); };
  var CONF_LABEL = { confirmed: 'Confirmed', likely: 'Likely', possible: 'Possible' };

  function renderReview(containerId, findings, good, contextLine){
    var el = document.getElementById(containerId);
    if(!el) return;
    var html = '<div class="cr-panel">';
    html += '<div class="cr-header">Code review <span class="cr-sub">(pattern-based, local, not AI-graded)</span></div>';
    if(contextLine) html += '<div class="cr-context">'+esc(contextLine)+'</div>';

    html += '<div class="cr-section"><div class="cr-section-h">What looks good</div>';
    if(good.length){
      html += '<ul class="cr-good-list">'+good.map(function(g){return '<li>'+esc(g)+'</li>';}).join('')+'</ul>';
    } else {
      html += '<p class="cr-empty">Nothing specific to highlight yet.</p>';
    }
    html += '</div>';

    if(findings.length){
      html += '<div class="cr-section"><div class="cr-section-h">Possible issues ('+findings.length+')</div>';
      findings.forEach(function(f){
        html += '<div class="cr-finding">'
          + '<div class="cr-finding-top"><span class="cr-conf cr-conf-'+f.confidence+'">'+CONF_LABEL[f.confidence]+'</span>'
          + '<span class="cr-issue">'+esc(f.issue)+'</span></div>'
          + '<div class="cr-why"><b>Why it matters:</b> '+esc(f.why)+'</div>'
          + '<div class="cr-suggest"><b>Suggested next step:</b> '+esc(f.suggestion)+'</div>'
          + '</div>';
      });
      html += '</div>';
    }
    html += '</div>';
    el.innerHTML = html;
  }

  window.cxReviewPython = async function(editId, outId, courseId, exIndex){
    var code = document.getElementById(editId).value;
    if(!code || !code.trim()){ return; }
    var btn = document.getElementById('crbtn_'+outId);
    if(btn){ if(btn.disabled) return; btn.disabled = true; }
    var el = document.getElementById(outId);
    if(el) el.innerHTML = '<div class="cr-panel"><span class="spinner"></span> Reviewing…</div>';
    try{
      var py = await getPy();
      py.globals.set('_SRC', code);
      py.runPython(PY_REVIEW_HARNESS);
      var result = JSON.parse(py.globals.get('_RESULT_REVIEW'));
      var ctxLine = null;
      if(courseId && window.getLessonContext){
        var ctx = window.getLessonContext(courseId, null, exIndex);
        if(ctx && ctx.currentExercise) ctxLine = 'Reviewing your solution for "'+ctx.currentExercise.title+'"'+(ctx.lesson?' ('+ctx.lesson.title+')':'')+'.';
      }
      renderReview(outId, result.findings, result.good, ctxLine);
    }catch(e){
      if(el) el.innerHTML = '<div class="cr-panel"><p class="cr-empty">Review couldn\'t run: '+esc(String(e))+'</p></div>';
    }
    finally{ if(btn) btn.disabled = false; }
  };

  window.cxReviewSql = function(editId, outId, courseId, exIndex){
    var sql = document.getElementById(editId).value;
    if(!sql || !sql.trim()){ return; }
    var result = window.reviewSqlCode(sql);
    var ctxLine = null;
    if(courseId && window.getLessonContext){
      var ctx = window.getLessonContext(courseId, null, exIndex);
      if(ctx && ctx.currentExercise) ctxLine = 'Reviewing your query for "'+ctx.currentExercise.title+'"'+(ctx.lesson?' ('+ctx.lesson.title+')':'')+'.';
    }
    renderReview(outId, result.findings, result.good, ctxLine);
  };
})();
