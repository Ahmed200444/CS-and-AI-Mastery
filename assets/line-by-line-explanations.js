(function(){
'use strict';

var VERSION='20260919-v575-inline-comments';
var updateTimers=new WeakMap(),editorSeq=0;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function text(v){return String(v==null?'':v);}
function clean(v){return text(v).replace(/\s+/g,' ').trim();}
function unique(xs){var seen={};return xs.filter(function(x){x=clean(x);if(!x||seen[x])return false;seen[x]=1;return true;});}
function indentation(line){var m=text(line).match(/^[\t ]*/);return m?m[0].replace(/\t/g,'    ').length:0;}

function inferLanguage(code,label,node){
 var c=text(code),l=(text(label)+' '+text(node&&node.getAttribute&&node.getAttribute('data-language'))+' '+text(node&&node.getAttribute&&node.getAttribute('data-lang'))).toLowerCase();
 if(/c\+\+|\bcpp\b/.test(l)||/#include\s*[<"]|\bstd::|\bcout\s*<<|\bcin\s*>>|\bvector\s*</.test(c)||/(^|\n)\s*(?:template\s*<|namespace\s+\w+|enum\s+class\s+|public\s*:|private\s*:|protected\s*:|#pragma\s+once)/m.test(c)||/(^|\n)\s*(?:long\s+long|unsigned\s+\w+|int|double|float|bool|char|void|std::string)\s+[A-Za-z_]\w*\s*\([^)]*\)\s*[;{]/m.test(c))return'cpp';
 if(/\bjava\b/.test(l)||/\bpublic\s+static\s+void\s+main\s*\(|\bSystem\.out\.println\s*\(/.test(c))return'java';
 if(/python/.test(l)||/(^|\n)\s*(async\s+def\s+|def\s+|class\s+\w+.*:|from\s+\S+\s+import\s+|import\s+|for\s+.+\s+in\s+.+:|while\s+.+:|if\s+.+:|elif\s+.+:|else\s*:|try\s*:|except\b.*:|finally\s*:|with\s+|print\s*\()/m.test(c)||/\b(len|range|enumerate|zip|divmod|input|dict|list|set|tuple)\s*\(/.test(c)||/\b(cursor\.execute|\.objects\.(?:get|filter|create)|f["']SELECT|execute\("SELECT)/.test(c))return'python';
 if(/typescript|\bts\b/.test(l)||/\binterface\s+\w+|:\s*(string|number|boolean|unknown|any)\b/.test(c))return'typescript';
 if(/javascript|\bjs\b/.test(l)||/\b(console\.log|const\s+|let\s+|function\s+|=>|document\.|addEventListener\s*\(|useState\s*\()/.test(c))return'javascript';
 if(/http|api|rest/.test(l)||/(^|\n)\s*(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+\/\S*/m.test(c)||/(^|\n)\s*HTTP\/\d(?:\.\d)?\s+\d{3}\b/m.test(c)||/(^|\n)\s*[1-5]\d{2}\s+(OK|Created|No Content|Bad Request|Unauthorized|Forbidden|Not Found|Conflict|Too Many Requests|Internal Server Error)\b/m.test(c))return'http';
 if(/shell|bash|terminal|command|git|linux/.test(l)||/(^|\n)\s*(git\s+|ls\b|cd\s+|pwd\b|mkdir\b|chmod\b|grep\b|find\b|docker\s+|kubectl\s+|helm\s+|man\s+|df\s+|wc\s+|npm\s+|npx\s+|pip\s+|python\s+|curl\s+|ssh\s+|ps\s+|kill\s+|tail\s+|cat\s+|echo\s+)/m.test(c))return'shell';
 // Raw SQL must begin with SQL keywords, not merely mention words like "select" in a comment.
 if(/sql/.test(l)||/(^|\n)\s*(SELECT\b|INSERT\s+INTO\b|UPDATE\s+\w+\b|DELETE\s+FROM\b|CREATE\s+(?:TABLE|INDEX)\b|ALTER\s+TABLE\b|DROP\s+TABLE\b|WITH\s+\w+\s+AS\b|BEGIN\s+TRANSACTION\b|COMMIT\b|EXPLAIN\s+SELECT\b)/im.test(c))return'sql';
 if(/dockerfile/.test(l)||/^\s*FROM\s+\S+/m.test(c)&&(c.match(/^\s*(FROM|WORKDIR|COPY|RUN|CMD|ENTRYPOINT|EXPOSE|ENV|ARG)\b/gm)||[]).length>=2)return'dockerfile';
 if(/html/.test(l)||/<\/?[a-z][^>]*>/i.test(c))return'html';
 if(/(^|\n)\s*[A-Za-z_]\w*(?:\[[^\n\]]+\]|\.[A-Za-z_]\w*)*\s*=\s*[^;\n]+/m.test(c)||/(^|\n)\s*[A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)+\s*=\s*[^;\n]+/m.test(c)||/\b(?:fit|predict|transform|append|extend|items|get|split|deepcopy|copy|describe|value_counts|corr)\s*\(/.test(c)||/\b(?:transforms|torch|nn|F|np|pd)\.[A-Za-z_]\w*/.test(c))return'python';
 if(/json/.test(l)||(/[{}]/.test(c)&&(c.match(/"[^"\n]+"\s*:/g)||[]).length>=1&&!/=\s*\{/.test(c)))return'json';
 var yamlMatches=c.match(/^\s*(?:-\s+)?[A-Za-z_][\w.-]*:\s*.*$/gm)||[];
 if(/ya?ml/.test(l)||yamlMatches.length>=3||(yamlMatches.length>=2&&!/[{};]/.test(c)))return'yaml';
 if(/css/.test(l)||/(^|\n)\s*(?:[.#][A-Za-z_-][\w-]*|[A-Za-z][\w-]*(?:\s+[A-Za-z][\w-]*)*)[^=\n]*\{[^\n]*\}/m.test(c)||/(^|\n)\s*(?:[.#][A-Za-z_-][\w-]*|[A-Za-z][\w-]*(?:\s+[A-Za-z][\w-]*)*)[^=\n]*\{\s*$/m.test(c)||/@media\s*\(/.test(c))return'css';
 return'text';
}
function generalSyntax(line,lang){
 var s=text(line),t=s.trim(),out=[];
 if(!t)return['A blank line is not executed; it visually separates logical sections of the example.'];
 if(indentation(s)>0&&lang==='python')out.push('Leading spaces are significant in Python: this line belongs to the indented block opened above it.');
 if(/(^|[^=!<>])=([^=]|$)/.test(t)&&!/[<>:]=>/.test(t)&&lang!=='sql'&&lang!=='html'&&lang!=='css'&&lang!=='yaml')out.push('`=` is assignment: the value/expression on the right is stored in the name or target on the left.');
 if(/==/.test(t))out.push('`==` compares two values for equality and produces `True`/`False` (or the language equivalent).');
 if(/!=/.test(t))out.push('`!=` means “not equal to”.');
 if(/>=/.test(t))out.push('`>=` means “greater than or equal to”.');
 if(/<=/.test(t))out.push('`<=` means “less than or equal to”.');
 if(/(?<![<>])>(?!=)/.test(t)&&lang!=='html')out.push('`>` compares whether the left value is greater than the right value.');
 if(/(?<![<>])<(?!=)/.test(t)&&lang!=='html'&&!/^#include/.test(t))out.push('`<` compares whether the left value is less than the right value.');
 if(/\+=/.test(t))out.push('`+=` updates the existing value by adding the right-hand value and storing the result back.');
 if(/-=/.test(t))out.push('`-=` subtracts the right-hand value from the current value and stores the result back.');
 if(/\*=/.test(t))out.push('`*=` multiplies the current value by the right-hand value and stores the result back.');
 if(/\/\//.test(t)&&lang==='python')out.push('`//` is floor division in Python: it divides and rounds down to an integer-like result.');
 if(/\*\*/.test(t))out.push('`**` is exponentiation in Python: `a ** b` means “a raised to the power b”.');
 if(/%/.test(t)&&!/^%/.test(t))out.push('`%` is commonly the remainder/modulo operator, useful for divisibility and cycles.');
 if(/\([^)]*\)/.test(t))out.push('Parentheses `(...)` group an expression or hold the arguments passed to a function/method call.');
 if(/\[[^\]]*\]/.test(t))out.push('Square brackets `[...]` can create a list or access an item, dictionary key, or slice, depending on context.');
 if(/\{[^}]*\}/.test(t)&&lang!=='css')out.push('Curly braces `{...}` create/group a mapping/object/set or delimit a code block, depending on the language.');
 if(/["'][^"']*["']/.test(t))out.push('Quotation marks create a string literal: text data written directly in the source code.');
 if(/\w+\.\w+/.test(t)&&lang!=='sql')out.push('The dot `.` accesses an attribute/property or method that belongs to the value/module/object on its left.');
 if(/,/.test(t))out.push('A comma separates items, arguments, variables, columns, or values in the same construct.');
 if(/:\s*$/.test(t)&&lang==='python')out.push('The colon `:` opens an indented Python block such as a function, loop, condition, class, or exception handler.');
 if(/;\s*$/.test(t)&&(lang==='javascript'||lang==='typescript'||lang==='cpp'||lang==='java'))out.push('The semicolon `;` marks the end of this statement in this language.');
 if(/=>/.test(t))out.push('`=>` is JavaScript/TypeScript arrow-function syntax: parameters are on the left and the function body/result is on the right.');
 if(/::/.test(t))out.push('`::` is C++ scope-resolution syntax, used to access a name inside a namespace or type.');
 if(/\|/.test(t)&&lang==='shell')out.push('The pipe `|` sends the output of the command on the left into the command on the right.');
 if(/&&/.test(t)&&lang==='shell')out.push('`&&` runs the next shell command only if the command before it succeeds.');
 if(/>>?/.test(t)&&lang==='shell')out.push('`>` redirects output to a file; `>>` appends instead of replacing the file.');
 return unique(out);
}

function pythonPurpose(t){
 if(/^#/.test(t))return'This is a comment. Python ignores it when executing the program; it exists to explain the code to a reader.';
 if(/^from\s+\S+\s+import\s+/.test(t))return'This imports selected names from a Python module so later lines can use them directly.';
 if(/^import\s+/.test(t))return'This imports one or more Python modules so the program can use functionality defined in them.';
 if(/^if\s+__name__\s*==\s*["']__main__["']\s*:/.test(t))return'This checks whether the file is being run directly. If it is, Python sets `__name__` to `"__main__"`, so the indented startup code runs; importing the file from another module will not trigger that startup block.';
 if(/^async\s+def\s+/.test(t))return'This defines an asynchronous function. Calling it creates work that can be awaited without blocking other asynchronous tasks.';
 if(/^def\s+/.test(t))return'This defines a reusable function and names the parameters that receive input values when the function is called.';
 if(/^class\s+/.test(t))return'This defines a class: a custom type that can bundle state (attributes) and behavior (methods).';
 if(/^@/.test(t))return'This is a decorator. It modifies or wraps the function/class defined immediately below it.';
 if(/^for\s+.+\s+in\s+/.test(t))return'This starts a `for` loop. Python takes each value from the iterable after `in`, assigns it to the loop variable, and runs the indented body.';
 if(/^while\s+/.test(t))return'This starts a `while` loop. Python checks the condition before each iteration and repeats the indented body while the condition remains true.';
 if(/^if\s+/.test(t))return'This evaluates a condition. The indented block beneath it runs only when the condition is true.';
 if(/^elif\s+/.test(t))return'This checks an additional condition only if the preceding `if`/`elif` condition was false.';
 if(/^else\s*:/.test(t))return'This is the fallback branch. Its indented block runs when the earlier conditions in the same chain were false.';
 if(/^try\s*:/.test(t))return'This starts a protected block. Python attempts the indented statements and can transfer control to an `except` block if an exception occurs.';
 if(/^except\b/.test(t))return'This catches the specified exception type (or any exception if no type is given) so the program can handle the failure instead of crashing immediately.';
 if(/^finally\s*:/.test(t))return'This block runs whether the `try` block succeeds or fails, which is useful for cleanup.';
 if(/^with\s+/.test(t))return'This opens a context-managed resource and guarantees its cleanup when the indented block finishes.';
 if(/^return\b/.test(t))return'This stops the current function call and sends the following value/expression back to the caller.';
 if(/^yield\b/.test(t))return'This produces one value from a generator and pauses the function so it can resume later.';
 if(/^raise\b/.test(t))return'This deliberately raises an exception to signal an invalid state or failed requirement.';
 if(/^assert\b/.test(t))return'This checks an assumption during execution and raises `AssertionError` if the condition is false.';
 if(/^print\s*\(/.test(t))return'This calls Python’s `print` function to display the supplied value(s) in the example output.';
 if(/^await\b/.test(t))return'This awaits an asynchronous operation. The current async function pauses here until that awaitable completes, then continues with its result.';
 if(/^break\b/.test(t))return'This immediately exits the nearest enclosing loop and continues execution after that loop.';
 if(/^continue\b/.test(t))return'This skips the rest of the current loop iteration and starts the next iteration.';
 if(/^pass\b/.test(t))return'`pass` deliberately does nothing. It is a placeholder that satisfies Python’s requirement that an indented block contain at least one statement.';
 if(/^del\s+/.test(t))return'This deletes the named reference/item binding. It removes that name or collection entry; the underlying object is freed only when nothing references it anymore.';
 if(/^global\s+/.test(t))return'This tells Python that assignments to the listed name(s) inside this function should affect the module-level variables rather than create local variables.';
 if(/^(?:[rubfRUBF]{0,2})(?:"""|'''').*(?:"""|'''')$/.test(t))return'This is a string literal used as a docstring in this position, documenting the function/class for readers and tools such as `help()`.';
 if(/^[A-Za-z_]\w*\s*:\s*[A-Za-z_][\w.\[\], |]*$/.test(t))return'This is a type annotation: the name on the left is documented/declared as having the type written after the colon.';
 if(/^[\]})]+[,;]?$/.test(t))return'This line closes one or more collection/function-call/grouping delimiters that were opened on earlier lines, completing that multi-line expression.';
 if(/^[^#]+?\s*(?:\/\/=|\+=|-=|\*=|%=)\s*/.test(t))return'This is an augmented assignment: Python computes the operation using the current target value and writes the result back to that same target.';
 if(/^[^#]+?\s*=(?!=)/.test(t))return'This evaluates the expression on the right and assigns/unpacks the resulting value(s) into the target name(s), attributes, or indexed positions on the left.';
 if(/^\w[\w.\[\]"']*\s*\+=/.test(t))return'This updates an existing target by adding a value to it and storing the new result back in the same target.';
 if(/^\w[\w.\[\]"']*\s*=/.test(t))return'This assigns the result on the right-hand side to the target on the left so later lines can use that stored value.';
 if(/^\w+\s*,\s*\w+\s*=/.test(t))return'This uses multiple assignment/unpacking: values on the right are distributed into the names on the left in one statement.';
 if(/\.append\s*\(/.test(t))return'This calls a list’s `append` method to add one item to the end of that list.';
 if(/\.extend\s*\(/.test(t))return'This calls `extend` to add every item from another iterable to the list.';
 if(/\.items\s*\(\)/.test(t))return'This asks a dictionary for `(key, value)` pairs, usually so a loop can process both parts.';
 if(/\.get\s*\(/.test(t))return'This uses dictionary `get` to read a key safely and optionally provide a default when the key is missing.';
 if(/\blambda\b/.test(t))return'This creates a small anonymous function with `lambda`, useful when a short function is needed inline.';
 if(/^\w+\s*=\s*\[.*\bfor\b.*\]/.test(t))return'This is a list comprehension: it builds a new list by looping through values and optionally filtering or transforming them in one expression.';
 if(/^\w+\s*=\s*\{.*\bfor\b.*\}/.test(t))return'This is a dictionary/set comprehension: it constructs a new collection from an iteration in one expression.';
 if(/^\w[\w.]*\s*\(/.test(t))return'This calls a function or method. Python evaluates the arguments inside the parentheses and passes them to that callable.';
 return'This Python statement performs the next transformation, check, or function/method call needed by the example.';
}

function jsPurpose(t){
 if(/^\/\//.test(t))return'This is a JavaScript/TypeScript comment and is ignored during execution.';
 if(/^import\s+/.test(t))return'This imports code from another module so this file can use its exported values.';
 if(/^export\s+/.test(t))return'This exports a value from the current module so another module can import it.';
 if(/^(const|let|var)\s+/.test(t))return'This declares a variable. `const` prevents reassignment, `let` allows reassignment, and `var` is the older function-scoped form.';
 if(/^async\s+function\s+|^function\s+/.test(t))return'This defines a reusable function; `async` additionally makes it return a Promise and allows `await` inside.';
 if(/=>/.test(t)&&/^(const|let|var)\s+/.test(t))return'This stores an arrow function in a variable, creating concise reusable behavior.';
 if(/^class\s+/.test(t))return'This defines a class that can create objects with shared methods and structured state.';
 if(/^if\s*\(/.test(t))return'This evaluates the condition inside parentheses and runs the following block only when it is truthy.';
 if(/^else\s+if\s*\(/.test(t))return'This checks another condition only when the earlier condition was not satisfied.';
 if(/^else\b/.test(t))return'This is the fallback branch when the earlier conditions were not satisfied.';
 if(/^for\s*\(/.test(t)||/^for\s+/.test(t))return'This starts a loop that repeatedly executes the following block while iterating or while its loop condition remains valid.';
 if(/^while\s*\(/.test(t))return'This repeats the following block while the condition inside the parentheses is truthy.';
 if(/^return\b/.test(t))return'This ends the current function call and sends a value back to the caller.';
 if(/^await\b/.test(t)||/=\s*await\b/.test(t))return'This pauses the current async function until the Promise settles, then uses its resolved value.';
 if(/console\.log\s*\(/.test(t))return'This writes the supplied value(s) to the JavaScript output console.';
 if(/addEventListener\s*\(/.test(t))return'This registers an event handler so a function runs when the specified browser event occurs.';
 if(/fetch\s*\(/.test(t))return'This starts an HTTP request with `fetch`, which returns a Promise representing the eventual response.';
 if(/\.map\s*\(/.test(t))return'This uses `map` to transform every item into a corresponding item in a new array.';
 if(/\.filter\s*\(/.test(t))return'This uses `filter` to keep only array items whose callback returns a truthy value.';
 if(/\.reduce\s*\(/.test(t))return'This uses `reduce` to combine an array into one accumulated result.';
 return'This JavaScript/TypeScript statement performs the next declaration, calculation, call, or browser operation in the example.';
}

function sqlPurpose(t){
 var u=t.toUpperCase();
 if(/^--/.test(t))return'This is a SQL comment and is ignored by the database engine.';
 if(/^WITH\b/.test(u))return'`WITH` starts a common table expression (CTE), giving a temporary result set a name so the main query can use it clearly.';
 if(/^SELECT\b/.test(u))return'`SELECT` defines the columns, expressions, or aggregate values that the query should return.';
 if(/^FROM\b/.test(u))return'`FROM` identifies the table or prior result set that supplies the starting rows.';
 if(/^(INNER\s+|LEFT\s+|RIGHT\s+|FULL\s+)?JOIN\b/.test(u))return'This `JOIN` brings related rows from another table into the query result.';
 if(/^ON\b/.test(u))return'`ON` gives the join condition that tells SQL which rows from the two sources match.';
 if(/^WHERE\b/.test(u))return'`WHERE` filters individual rows before grouping/aggregation, keeping only rows whose condition is true.';
 if(/^GROUP\s+BY\b/.test(u))return'`GROUP BY` combines rows that share the same grouping values so aggregates such as `COUNT` or `SUM` can be computed per group.';
 if(/^HAVING\b/.test(u))return'`HAVING` filters groups after aggregation, unlike `WHERE`, which filters rows before grouping.';
 if(/^ORDER\s+BY\b/.test(u))return'`ORDER BY` sorts the final result rows using the listed column/expression and direction.';
 if(/^LIMIT\b|^FETCH\b/.test(u))return'This restricts how many rows are returned by the query.';
 if(/^INSERT\s+INTO\b/.test(u))return'`INSERT INTO` specifies the table that will receive new row data.';
 if(/^VALUES\b/.test(u))return'`VALUES` supplies the literal row values that the `INSERT` statement will add.';
 if(/^UPDATE\b/.test(u))return'`UPDATE` identifies the existing table whose rows will be modified.';
 if(/^SET\b/.test(u))return'`SET` specifies the new column values for rows selected by the update.';
 if(/^DELETE\s+FROM\b/.test(u))return'`DELETE FROM` identifies rows to remove from the specified table; a `WHERE` clause should normally limit which rows are deleted.';
 if(/^CREATE\s+TABLE\b/.test(u))return'`CREATE TABLE` defines a new database table and begins its column/schema definition.';
 if(/^ALTER\s+TABLE\b/.test(u))return'`ALTER TABLE` changes the structure of an existing table.';
 if(/^DROP\s+TABLE\b/.test(u))return'`DROP TABLE` removes the table definition and its stored data.';
 if(/^CASE\b|^WHEN\b|^ELSE\b|^END\b/.test(u))return'This line is part of a SQL `CASE` expression, which chooses a result based on conditions.';
 if(/\bOVER\s*\(/.test(u)||/^PARTITION\s+BY\b/.test(u))return'This is window-function syntax: it defines which rows belong to the calculation window without collapsing them into one grouped row.';
 return'This SQL line supplies another clause, expression, column, condition, or value that contributes to the current statement.';
}

function htmlPurpose(t){
 if(/^<!--/.test(t))return'This is an HTML comment; browsers do not render it as page content.';
 if(/^<\//.test(t)){var m=t.match(/^<\/([\w-]+)/);return'This closing tag ends the `'+(m?m[1]:'element')+'` element that was opened earlier.';}
 if(/^</.test(t)){var m2=t.match(/^<([\w-]+)/),tag=m2?m2[1]:'element';return'This opens/creates a `'+tag+'` HTML element in the document structure.';}
 return'This line is text/content that will be placed inside the surrounding HTML element.';
}
function cssPurpose(t){
 if(/^\/\*/.test(t))return'This is a CSS comment and does not change the page styling.';
 if(/^@media\b/.test(t))return'This starts a media query: the nested CSS rules apply only when the stated device/viewport condition is true.';
 if(/\{\s*$/.test(t))return'This is a CSS selector/rule header. It chooses which element(s) the declarations inside the braces will style.';
 if(/^}/.test(t))return'This closing brace ends the current CSS rule or media-query block.';
 if(/^[\w-]+\s*:/.test(t))return'This is a CSS property declaration: the property before `:` is assigned the value written after it.';
 return'This CSS line contributes to a selector, declaration, or responsive styling rule.';
}
function shellPurpose(t){
 if(/^#/.test(t))return'This is a shell comment and is not executed.';
 var first=(t.match(/^([^\s|&;]+)/)||[])[1]||'';
 if(first==='git'){
  if(/^git\s+status\b/.test(t))return'This asks Git to show the working-tree/branch status, including changed, staged, and untracked files.';
  if(/^git\s+add\b/.test(t))return'This stages the specified file(s), adding their current changes to the next commit snapshot.';
  if(/^git\s+commit\b/.test(t))return'This creates a Git commit from the staged snapshot; `-m` supplies the commit message directly on the command line.';
  if(/^git\s+(switch|checkout)\b/.test(t))return'This changes the currently checked-out branch; `-c`/`-b` creates a new branch before switching to it.';
  if(/^git\s+merge\b/.test(t))return'This merges the named branch/commit into the currently checked-out branch.';
  if(/^git\s+log\b/.test(t))return'This displays commit history; flags control how compactly and graphically the history is shown.';
  if(/^git\s+diff\b/.test(t))return'This displays line-by-line changes between Git states; `--staged` compares staged changes with the last commit.';
  if(/^git\s+revert\b/.test(t))return'This creates a new commit that reverses the changes introduced by the specified earlier commit.';
  return'This runs a Git command to inspect or change repository history, branches, or tracked content.';
 }
 var map={pwd:'This prints the full path of the current working directory.',ls:'This lists directory contents.',cd:'This changes the current working directory.',mkdir:'This creates a new directory.',grep:'This searches input/files for text that matches the supplied pattern.',find:'This recursively searches for filesystem entries that match the supplied conditions.',chmod:'This changes file permission bits.',curl:'This sends an HTTP request or transfers data from/to a URL.',ssh:'This starts a secure remote shell connection.',ps:'This lists running processes.',kill:'This sends a signal to a process, commonly to stop it.',tail:'This displays the end of a file; `-f` keeps following new lines as they are added.',cat:'This prints/concatenates file contents.',docker:'This invokes Docker to build, run, inspect, or manage containers/images.',kubectl:'This invokes Kubernetes CLI operations against the current cluster.',npm:'This runs a Node.js package-manager command.',npx:'This runs a package executable, downloading/resolving it when needed.',pip:'This runs Python’s package installer.',python:'This starts Python or runs the specified Python file/module.'};
 return map[first]||'This runs the `'+first+'` command with the following arguments/options.';
}
function cppPurpose(t,lang){
 if(/^\/\//.test(t))return'This is a comment and is ignored by the compiler.';
 if(/^#include\b/.test(t))return'This preprocessor directive includes declarations from a header so the program can use those library features.';
 if(/^using\s+namespace\b/.test(t))return'This makes names from the specified C++ namespace available without writing the namespace prefix each time.';
 if(/\bmain\s*\(/.test(t))return'This defines the program entry point. Execution of a normal C++/Java console program begins here.';
 if(/^class\s+|^struct\s+/.test(t))return'This defines a custom type that groups related fields/state and functions/methods.';
 if(/^for\s*\(/.test(t)||/^for\s*\(/.test(t))return'This starts a loop; the header controls initialization/iteration and the following block contains the repeated work.';
 if(/^while\s*\(/.test(t))return'This repeats the following block while its condition remains true.';
 if(/^if\s*\(/.test(t))return'This checks a condition and runs the following block only when the condition evaluates to true.';
 if(/^else\b/.test(t))return'This is the fallback branch when the earlier condition was false.';
 if(/^return\b/.test(t))return'This ends the current function/method and sends a value back to its caller.';
 if(/\bcout\s*<</.test(t))return'This writes values to standard output using C++ stream insertion (`<<`).';
 if(/\bcin\s*>>/.test(t))return'This reads values from standard input using C++ stream extraction (`>>`).';
 if(/System\.out\.println\s*\(/.test(t))return'This calls Java’s standard output method to print a line.';
 return'This '+(lang==='java'?'Java':'C++')+' statement declares data, computes a value, calls behavior, or controls program flow.';
}
function dockerPurpose(t){var k=(t.match(/^([A-Z]+)/)||[])[1]||'';var m={FROM:'`FROM` chooses the base image that this container image starts from.',WORKDIR:'`WORKDIR` sets the default working directory for following build steps and for the container.',COPY:'`COPY` copies files/directories from the build context into the image filesystem.',RUN:'`RUN` executes a command while building the image and stores the resulting filesystem changes in an image layer.',CMD:'`CMD` supplies the default command/arguments used when a container starts.',ENTRYPOINT:'`ENTRYPOINT` defines the executable that the container runs as its main process.',EXPOSE:'`EXPOSE` documents which network port the application inside the container is expected to listen on.',ENV:'`ENV` defines an environment variable inside the image/container.',ARG:'`ARG` declares a build-time variable available while creating the image.'};return m[k]||'This Dockerfile instruction contributes to how the container image is built or started.';}
function dataPurpose(t,lang){
 if(lang==='json'){
  if(/^\{|^\}/.test(t))return'This brace opens/closes a JSON object: a collection of named key/value pairs.';
  if(/^\[|^\]/.test(t))return'This bracket opens/closes a JSON array: an ordered list of values.';
  if(/^"[^"\n]+"\s*:/.test(t))return'This defines a JSON key/value entry. The quoted text before `:` is the key and the value after `:` is its data.';
  return'This JSON line contributes a value or structural delimiter to the data document.';
 }
 if(lang==='yaml'){
  if(/^\s*-\s+/.test(t))return'The leading `-` creates one item in a YAML sequence/list.';
  if(/^[\w.-]+\s*:/.test(t))return'The key before `:` names a YAML field; the value after it (or the following indented block) belongs to that key.';
  return'This YAML line contributes to the nested configuration structure; indentation determines which parent key it belongs to.';
 }
 return'This line is reference/configuration text. Read it as part of the surrounding example rather than executable source code.';
}

function purposeFor(line,lang){var t=text(line).trim();if(!t)return'A blank line separates logical sections and makes the example easier to read; it does not execute.';
 if(lang==='python')return pythonPurpose(t);
 if(lang==='javascript'||lang==='typescript')return jsPurpose(t);
 if(lang==='sql')return sqlPurpose(t);
 if(lang==='html')return htmlPurpose(t);
 if(lang==='css')return cssPurpose(t);
 if(lang==='shell')return shellPurpose(t);
 if(lang==='cpp'||lang==='java')return cppPurpose(t,lang);
 if(lang==='dockerfile')return dockerPurpose(t);
 if(lang==='json'||lang==='yaml'||lang==='text')return dataPurpose(t,lang);
 return'This line contributes the next operation or piece of structure in the example.';
}

function stripInlineComment(raw,lang){
 var s=text(raw),quote='',escNext=false;
 for(var i=0;i<s.length;i++){
  var ch=s[i],next=s[i+1]||'';
  if(escNext){escNext=false;continue;}
  if(quote){if(ch==='\\'){escNext=true;continue;}if(ch===quote)quote='';continue;}
  if(ch==='"'||ch==="'"){quote=ch;continue;}
  if(lang==='python'&&ch==='#')return s.slice(0,i).trimEnd();
  if((lang==='javascript'||lang==='typescript'||lang==='cpp'||lang==='java')&&ch==='/'&&next==='/')return s.slice(0,i).trimEnd();
 }
 return s;
}
function displayLiteral(v){var x=clean(v).replace(/;$/,'');if(/^['"].*['"]$/.test(x))return'`'+x.slice(1,-1)+'`';return'`'+shortCode(x)+'`';}
function splitSimpleComma(v){
 var s=text(v),parts=[],cur='',quote='',depth=0,escNext=false;
 for(var i=0;i<s.length;i++){
  var ch=s[i];
  if(escNext){cur+=ch;escNext=false;continue;}
  if(quote){cur+=ch;if(ch==='\\')escNext=true;else if(ch===quote)quote='';continue;}
  if(ch==='"'||ch==="'"){quote=ch;cur+=ch;continue;}
  if(ch==='('||ch==='['||ch==='{')depth++;
  if(ch===')'||ch===']'||ch==='}')depth=Math.max(0,depth-1);
  if(ch===','&&depth===0){parts.push(cur.trim());cur='';continue;}
  cur+=ch;
 }
 if(cur.trim()||parts.length)parts.push(cur.trim());
 return parts;
}
function splitSimpleStatements(v){
 var s=text(v),parts=[],cur='',quote='',depth=0,escNext=false;
 for(var i=0;i<s.length;i++){var ch=s[i];if(escNext){cur+=ch;escNext=false;continue;}if(quote){cur+=ch;if(ch==='\\')escNext=true;else if(ch===quote)quote='';continue;}if(ch==='"'||ch==="'"){quote=ch;cur+=ch;continue;}if(ch==='('||ch==='['||ch==='{')depth++;if(ch===')'||ch===']'||ch==='}')depth=Math.max(0,depth-1);if(ch===';'&&depth===0){if(cur.trim())parts.push(cur.trim());cur='';continue;}cur+=ch;}if(cur.trim())parts.push(cur.trim());return parts;
}
function makeContext(lang){return{lang:lang,types:Object.create(null),dictKeys:Object.create(null),values:Object.create(null),blocks:[],functionName:''};}
function setType(ctx,name,type){if(ctx&&name)ctx.types[name]=type;}
function rememberValue(ctx,name,value){if(ctx&&name)ctx.values[name]=clean(value);}
function rememberDictKey(ctx,name,key){if(!ctx||!name)return;if(!ctx.dictKeys[name])ctx.dictKeys[name]=Object.create(null);ctx.dictKeys[name][key]=true;setType(ctx,name,'dict');}
function dictionaryHasKey(ctx,name,key){return !!(ctx&&ctx.dictKeys[name]&&Object.prototype.hasOwnProperty.call(ctx.dictKeys[name],key));}
function moduleExplanation(name){
 var map={copy:'copying objects, including deep copies',io:'input/output (I/O), including memory text streams such as StringIO',sys:'Python runtime streams/settings such as sys.stdin and sys.stdout',keyword:'checking Python reserved words',math:'math functions and constants',random:'random choices and numbers',json:'reading and writing JSON data',os:'operating-system and file-path tools',re:'regular-expression pattern matching',datetime:'dates and times',collections:'specialized collection helpers',pathlib:'object-oriented file paths'};
 return map[name]||('tools provided by the `'+name+'` module');
}
function explainCondition(expr){
 var e=clean(expr).replace(/:$/,'');var m,parts;
 if((m=e.match(/^([A-Za-z_]\w*)\s*<\s*([A-Za-z_]\w*)\[1\]\s+and\s+\1\s*\+\s*([A-Za-z_]\w*)\s*>\s*\2\[0\]$/)))return'the proposed interval from `'+m[1]+'` to `'+m[1]+' + '+m[3]+'` overlaps this existing interval';
 parts=e.split(/\s+and\s+/);if(parts.length>1)return parts.map(explainCondition).join(' and ');
 parts=e.split(/\s+or\s+/);if(parts.length>1)return parts.map(explainCondition).join(' or ');
 if((m=e.match(/^str\((.+)\)\.count\((.+)\)\s*>=\s*(\d+)$/)))return displayLiteral(m[2])+' appears at least '+m[3]+' times after '+displayLiteral(m[1])+' is converted to text';
 if((m=e.match(/^(.+?)\s*%\s*(.+?)\s*==\s*0$/)))return displayLiteral(m[1])+' is divisible by '+displayLiteral(m[2])+' (remainder `0`)';
 if((m=e.match(/^(.+?)\s*>=\s*(.+)$/)))return displayLiteral(m[1])+' is at least '+displayLiteral(m[2]);
 if((m=e.match(/^(.+?)\s*<=\s*(.+)$/)))return displayLiteral(m[1])+' is at most '+displayLiteral(m[2]);
 if((m=e.match(/^(.+?)\s*==\s*(.+)$/)))return displayLiteral(m[1])+' equals '+displayLiteral(m[2]);
 if((m=e.match(/^(.+?)\s*!=\s*(.+)$/)))return displayLiteral(m[1])+' does not equal '+displayLiteral(m[2]);
 if((m=e.match(/^(.+?)\s*>\s*(.+)$/)))return displayLiteral(m[1])+' is greater than '+displayLiteral(m[2]);
 if((m=e.match(/^(.+?)\s*<\s*(.+)$/)))return displayLiteral(m[1])+' is less than '+displayLiteral(m[2]);
 if((m=e.match(/^(.+?)\s+in\s+(.+)$/)))return displayLiteral(m[1])+' exists in '+displayLiteral(m[2]);
 return displayLiteral(e)+' is true';
}
function pythonExpressionMeaning(expr){
 var e=clean(expr),m;
 if((m=e.match(/^(.+?)\.strip\(\)\.lower\(\)$/)))return'`.strip()` removes whitespace from both ends of '+displayLiteral(m[1])+', then `.lower()` changes its letters to lowercase.';
 if((m=e.match(/^(.+?)\.strip\(\)$/)))return'`.strip()` removes whitespace from the beginning and end of '+displayLiteral(m[1])+'.';
 if((m=e.match(/^(.+?)\.lower\(\)$/)))return'`.lower()` changes the letters in '+displayLiteral(m[1])+' to lowercase.';
 if((m=e.match(/^(.+?)\.upper\(\)$/)))return'`.upper()` changes the letters in '+displayLiteral(m[1])+' to uppercase.';
 if((m=e.match(/^(.+?)\.endswith\((.+)\)$/)))return'`.endswith()` checks whether '+displayLiteral(m[1])+' finishes with '+displayLiteral(m[2])+' and produces `True` or `False`.';
 if((m=e.match(/^(.+?)\.startswith\((.+)\)$/)))return'`.startswith()` checks whether '+displayLiteral(m[1])+' begins with '+displayLiteral(m[2])+' and produces `True` or `False`.';
 if((m=e.match(/^(.+?)\.replace\((.+?),\s*(.+)\)$/)))return'`.replace()` creates new text from '+displayLiteral(m[1])+' by replacing '+displayLiteral(m[2])+' with '+displayLiteral(m[3])+'.';
 if((m=e.match(/^(.+?)\.count\((.+)\)$/)))return'`.count()` counts how many times '+displayLiteral(m[2])+' appears in '+displayLiteral(m[1])+'.';
 if((m=e.match(/^(.+?)\.split\(\s*\)$/)))return'`.split()` breaks '+displayLiteral(m[1])+' into a list of pieces using whitespace.';
 if((m=e.match(/^(.+?)\.split\((.+)\)$/)))return'`.split()` breaks '+displayLiteral(m[1])+' into pieces wherever '+displayLiteral(m[2])+' appears.';
 if((m=e.match(/^(.+?)\.join\((.+)\)$/)))return'`.join()` combines the strings from '+displayLiteral(m[2])+' into one string, placing '+displayLiteral(m[1])+' between them.';
 if((m=e.match(/^sorted\((.+)\)$/)))return'`sorted()` returns the items from '+displayLiteral(m[1])+' in sorted order.';
 if((m=e.match(/^set\((.+)\)$/)))return'`set()` keeps the unique values from '+displayLiteral(m[1])+'.';
 if((m=e.match(/^len\((.+)\)$/)))return'`len()` counts how many items or characters are in '+displayLiteral(m[1])+'.';
 if((m=e.match(/^(.+?)\.get\((.+?)(?:,\s*(.+))?\)$/)))return'`.get()` looks up '+displayLiteral(m[2])+' in '+displayLiteral(m[1])+(m[3]?' and uses '+displayLiteral(m[3])+' if the key is missing':'')+'.';
 if((m=e.match(/^(.+?)\.pop\(\s*\)$/)))return'`.pop()` removes and returns the last item from '+displayLiteral(m[1])+'.';
 if((m=e.match(/^(.+?)\.pop\((.+)\)$/)))return'`.pop()` removes and returns the item selected by '+displayLiteral(m[2])+' from '+displayLiteral(m[1])+'.';
 return'';
}
function pythonTeachingPurpose(raw,ctx){
 var original=clean(raw),t=clean(stripInlineComment(raw,'python')),m;
 if(!t){var comment=original.replace(/^#/,'').trim();return comment?'Comment for the reader: '+displayLiteral(comment)+'. Python ignores it.':'Blank line for spacing.';}
 if(/^#/.test(original)){var c=original.replace(/^#/,'').trim();return c?'Comment for the reader: '+displayLiteral(c)+'. Python ignores it.':'Comment for the reader; Python does not run it.';}
 if((m=t.match(/^import\s+(.+)$/))){var mods=splitSimpleComma(m[1]).map(function(x){return x.split(/\s+as\s+/)[0].trim();});if(mods.length===1)return'Loads `'+mods[0]+'` for '+moduleExplanation(mods[0])+'.';if(mods.length===2)return'Loads `'+mods[0]+'` for '+moduleExplanation(mods[0])+', and `'+mods[1]+'` for '+moduleExplanation(mods[1])+'.';return'Loads '+mods.map(function(x){return'`'+x+'`';}).join(', ')+' so their tools can be used later.';}
 if((m=t.match(/^from\s+(\S+)\s+import\s+(.+)$/))){var what=clean(m[2]);if(m[1]==='collections'&&/\bCounter\b/.test(what))return'Imports `Counter`, a helper that counts how often items appear.';if(m[1]==='io'&&/\bStringIO\b/.test(what))return'Imports `StringIO`, an in-memory text stream that behaves like a text file without creating a real file.';return'Imports '+displayLiteral(what)+' from `'+m[1]+'` so it can be used directly.';}
 if(/^if\s+__name__\s*==/.test(t))return'Runs the indented startup code only when this file is executed directly.';
 if((m=t.match(/^async\s+def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/)))return'Defines async function `'+m[1]+'('+clean(m[2])+')`. Its indented code runs when the function is awaited.';
 if((m=t.match(/^def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/))){if(ctx)ctx.functionName=m[1];return'Defines function `'+m[1]+'('+clean(m[2])+')`. Its indented code runs when you call it.';}
 if((m=t.match(/^class\s+([A-Za-z_]\w*)/)))return'Creates class `'+m[1]+'`, a blueprint for objects with related data and behavior.';
 if(/^@/.test(t))return'Applies this decorator to the function or class directly below it.';
 if(/^(?:[rubfRUBF]{0,2})(?:"""|''')[\s\S]*(?:"""|''')$/.test(t))return'This docstring explains what the surrounding function/class is meant to do. Python stores it as documentation.';
 if((m=t.match(/^([A-Za-z_]\w*)\s*:\s*([A-Za-z_][\w.\[\], |]*)$/)))return'Documents `'+m[1]+'` as type `'+clean(m[2])+'`; this helps readers and type-checking tools.';
 if((m=t.match(/^for\s+(.+?)\s+in\s+(.+?):\s*(.+)$/)))return'Takes each item from '+displayLiteral(m[2])+' one at a time, stores it in '+displayLiteral(m[1])+', then runs '+displayLiteral(m[3])+'.';
 if((m=t.match(/^for\s+([A-Za-z_]\w*)\s*,\s*([A-Za-z_]\w*)\s+in\s+enumerate\((.+)\):$/)))return'Loops through '+displayLiteral(m[3])+' while `'+m[1]+'` receives each index and `'+m[2]+'` receives its value.';
 if((m=t.match(/^for\s+(.+?)\s+in\s+(.+):$/)))return'Takes each item from '+displayLiteral(m[2])+' one at a time, stores it in '+displayLiteral(m[1])+', and runs the indented block.';
 if(/^while\s+True\s*:/.test(t))return'Starts a loop that repeats until a `break` statement stops it.';
 if((m=t.match(/^while\s+(.+):$/)))return'Repeats the indented block while '+explainCondition(m[1])+'.';
 if((m=t.match(/^if\s+(.+?):\s*(.+)$/))){var action=pythonTeachingPurpose(m[2],ctx).replace(/^./,function(x){return x.toLowerCase();});return'If '+explainCondition(m[1])+', then '+action;}
 if((m=t.match(/^if\s+(.+):$/)))return'Checks whether '+explainCondition(m[1])+'. If yes, the indented block runs.';
 if((m=t.match(/^elif\s+(.+?):\s*(.+)$/))){var action2=pythonTeachingPurpose(m[2],ctx).replace(/^./,function(x){return x.toLowerCase();});return'If earlier conditions failed and '+explainCondition(m[1])+', then '+action2;}
 if((m=t.match(/^elif\s+(.+):$/)))return'If earlier conditions failed, checks whether '+explainCondition(m[1])+'.';
 if((m=t.match(/^else\s*:\s*(.+)$/))){var action3=pythonTeachingPurpose(m[1],ctx).replace(/^./,function(x){return x.toLowerCase();});return'If the earlier conditions were false, '+action3;}
 if(/^else\s*:/.test(t))return'If no earlier `if`/`elif` condition matched, the indented code below runs.';
 if(/^try\s*:/.test(t))return'Runs the indented code and lets a following `except` handle errors that occur.';
 if((m=t.match(/^except\s*([^:]*)\s*:/)))return m[1]?'Catches `'+clean(m[1])+'` errors from the `try` block so the program can handle them.':'Catches an error from the `try` block so the program can handle it.';
 if(/^finally\s*:/.test(t))return'Always runs the indented cleanup code, whether the `try` succeeded or failed.';
 if(/^with\s+/.test(t))return'Uses the resource in this line and automatically cleans it up when the block ends.';
 if((m=t.match(/^return(?:\s+(.+))?$/))){if(!m[1])return'Ends the function and returns no value.';if(m[1]==='-1'&&ctx&&/(?:linear_search|binary_search)/.test(ctx.functionName||''))return'Returns `-1` to show that the target was not found.';var rm=pythonExpressionMeaning(m[1]);return rm?rm+' The function returns that result.':'Ends the function and sends '+displayLiteral(m[1])+' back to the caller.';}
 if(/^yield\b/.test(t))return'Produces one value from the generator, then pauses so it can continue later.';
 if(/^raise\b/.test(t))return'Raises an exception here to report an invalid or failed situation.';
 if((m=t.match(/^assert\s+(.+)$/)))return'Checks that '+explainCondition(m[1])+'. If not, Python raises `AssertionError`.';
 if(/^await\b/.test(t))return'Waits for this asynchronous operation to finish before continuing.';
 if(/^break\b/.test(t))return'Stops the nearest loop immediately and continues after the loop.';
 if(/^continue\b/.test(t))return'Skips the rest of this loop iteration and starts the next one.';
 if(/^pass\b/.test(t))return'Does nothing here; it is a placeholder for code you may add later.';
 if((m=t.match(/^del\s+(.+)$/)))return'Removes '+displayLiteral(m[1])+' from its current name or collection position.';
 if((m=t.match(/^global\s+(.+)$/)))return'Tells this function to use the module-level variable(s) '+displayLiteral(m[1])+' instead of creating locals.';

 // Search variables use purpose-first explanations.
 if(ctx&&/^(?:binary_search|first_at_least|lower_bound|upper_bound)$/.test(ctx.functionName||'')){
  if(/^low\s*=\s*0$/.test(t))return'Starts the search at the first index by setting `low` to `0`.';
  if(/^high\s*=\s*len\(.+\)\s*-\s*1$/.test(t))return'Sets `high` to the last valid index so the whole sorted collection starts inside the search range.';
  if(/^high\s*=\s*len\(.+\)$/.test(t))return'Sets `high` just past the last index for this half-open search range.';
  if(/^mid\s*=\s*\(low\s*\+\s*high\)\s*\/\/\s*2$/.test(t))return'Calculates the middle index of the current search range.';
  if(/^low\s*=\s*mid\s*\+\s*1$/.test(t))return'Moves `low` just right of `mid`, discarding the lower half that cannot contain the answer.';
  if(/^high\s*=\s*mid\s*-\s*1$/.test(t))return'Moves `high` just left of `mid`, discarding the upper half that cannot contain the target.';
  if(/^high\s*=\s*mid$/.test(t))return'Moves the upper boundary to `mid` because `mid` could still be the first valid position.';
 }
 // Explain common I/O/runtime helpers before generic assignment/call rules so beginners see what the unfamiliar name actually does.
 if((m=t.match(/^([A-Za-z_]\w*)\s*=\s*(?:io\.)?StringIO\((.*)\)$/)))return'Creates an in-memory text stream in `'+m[1]+'`. `StringIO` acts like a text file, but keeps the text in RAM.';
 if((m=t.match(/^([A-Za-z_]\w*)\s*=\s*sys\.stdout$/)))return'Saves Python’s current standard output stream in `'+m[1]+'`, usually so normal screen output can be restored later.';
 if((m=t.match(/^([A-Za-z_]\w*)\s*=\s*sys\.stdin$/)))return'Saves Python’s current standard input stream in `'+m[1]+'`, usually so keyboard/input behavior can be restored later.';
 if((m=t.match(/^sys\.stdout\s*=\s*(.+)$/)))return'Sets Python’s standard output destination to '+displayLiteral(m[1])+'. After this, `print()` writes there instead of the normal screen until restored.';
 if((m=t.match(/^sys\.stdin\s*=\s*(.+)$/)))return'Sets Python’s standard input source to '+displayLiteral(m[1])+'. After this, input reads from that stream until restored.';
 if((m=t.match(/^([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\.getvalue\(\)$/)))return'Copies all text captured in `'+m[2]+'` into `'+m[1]+'` as one string.';
 if((m=t.match(/^([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\.read\((.*)\)$/)))return'Reads text from `'+m[2]+'` at its current cursor and stores the result in `'+m[1]+'`.';
 if((m=t.match(/^([A-Za-z_]\w*)\.getvalue\(\)$/)))return'Reads all text currently captured inside the in-memory stream `'+m[1]+'` as one string.';
 if((m=t.match(/^([A-Za-z_]\w*)\.seek\((.+)\)$/)))return'Moves the read/write cursor of `'+m[1]+'` to position '+displayLiteral(m[2])+'. Position `0` means the beginning.';
 if((m=t.match(/^([A-Za-z_]\w*)\.write\((.+)\)$/)))return'Writes '+displayLiteral(m[2])+' into the stream/file-like object `'+m[1]+'` at its current cursor position.';
 if((m=t.match(/^([A-Za-z_]\w*)\.read\((.*)\)$/)))return'Reads text from `'+m[1]+'` starting at its current cursor position'+(clean(m[2])?' using the shown size/arguments':' until the end')+'.';
 if(/^exec\s*\(/.test(t))return'Runs Python code supplied as text. `exec` is useful for controlled examples/tools, but normal programs usually call functions directly.';
 if(/^compile\s*\(/.test(t))return'Converts source-code text into a Python code object so it can be executed or inspected.';

 // Compact one-line examples can contain multiple statements separated by semicolons.
 if(t.indexOf(';')>=0){var statements=splitSimpleStatements(t);if(statements.length>1){var targets=statements.map(function(part){var am=part.match(/^(.+?)\s*=\s*.+$/);return am?clean(am[1]):'';});if(targets.every(Boolean)){var shown=targets.map(displayLiteral);return'Updates '+(shown.length===2?shown.join(' and '):shown.slice(0,-1).join(', ')+', and '+shown[shown.length-1])+' in sequence for this step.';}var explanations=statements.slice(0,2).map(function(part){return pythonTeachingPurpose(part,ctx).replace(/[.]$/,'');});return explanations.join('; then ')+(statements.length>2?'; then continues the remaining statements in order':'')+'.';}}
 if((m=t.match(/^(.+?)\s*(\+=|-=|\*=|\/=|\/\/=|%=)\s*(.+)$/))){var opMap={'+=':'adds','-=':'subtracts','*=':'multiplies by','/=':'divides by','//=':'floor-divides by','%=':'takes the remainder with'};return'Updates '+displayLiteral(m[1])+': '+opMap[m[2]]+' '+displayLiteral(m[3])+' and saves the result back.';}
 // Dictionary/list updates come before normal assignment handling.
 if((m=t.match(/^([A-Za-z_]\w*)\[(['"])(.*?)\2\]\s*=\s*(.+)$/))){rememberDictKey(ctx,m[1],m[3]);return'Adds or updates key `'+m[3]+'` in `'+m[1]+'` with value '+displayLiteral(m[4])+'.';}
 if((m=t.match(/^([A-Za-z_]\w*)\[([^\]]+)\]\s*=\s*\1\.get\(\2\s*,\s*(.+?)\)\s*\+\s*1$/)))return'Reads the current count for '+displayLiteral(m[2])+' (using '+displayLiteral(m[3])+' if missing), adds 1, and saves it back.';
 if((m=t.match(/^(.+?)\s*=\s*(.+)$/))&&/[.\[]/.test(m[1])&&!/^(?:[A-Za-z_]\w*)$/.test(m[1])){var target=clean(m[1]),expr2=clean(m[2]);if(/^Node\s*\(/.test(expr2))return'Sets '+displayLiteral(target)+' to a newly created `Node` object from '+displayLiteral(expr2.replace(/^Node\(|\)$/g,''))+'.';if(/^None$/.test(expr2))return'Sets '+displayLiteral(target)+' to `None`, meaning it currently points to no object/value.';return'Sets '+displayLiteral(target)+' to the value/result of '+displayLiteral(expr2)+'.';}
 if((m=t.match(/^(.+?)\.append\((.*)\)$/)))return'Adds '+displayLiteral(m[2])+' to the end of '+displayLiteral(m[1])+'.';
 if((m=t.match(/^(.+?)\.extend\((.*)\)$/)))return'Adds every item from '+displayLiteral(m[2])+' to the end of '+displayLiteral(m[1])+'.';

 // Multiple assignment such as a, b = 6, 3.
 if((m=t.match(/^([A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)+)\s*=\s*(.+)$/))){var names=splitSimpleComma(m[1]),vals=splitSimpleComma(m[2]);if(names.length===vals.length){names.forEach(function(n,i){rememberValue(ctx,n,vals[i]);});return'Stores '+names.map(function(n,i){return displayLiteral(vals[i])+' in `'+n+'`';}).join(' and ')+'.';}}
 if((m=t.match(/^([A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)+)\s*=\s*([A-Za-z_][\w.]*)\((.*)\)$/))){var targets=splitSimpleComma(m[1]);return'Calls `'+m[2]+'(...)` and unpacks its returned values into '+targets.map(function(n){return'`'+n+'`';}).join(', ')+'.';}
 if((m=t.match(/^([A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)+)\s*=\s*([A-Za-z_]\w*)$/))){var targets2=splitSimpleComma(m[1]);return'Unpacks the values from `'+m[2]+'` into '+targets2.map(function(n){return'`'+n+'`';}).join(', ')+'.';}

 if((m=t.match(/^([A-Za-z_]\w*)\s*=\s*dict\(\s*\)$/))){setType(ctx,m[1],'dict');ctx.dictKeys[m[1]]=Object.create(null);return'Creates an empty dictionary in `'+m[1]+'`. Dictionaries store values by keys.';}
 if((m=t.match(/^([A-Za-z_]\w*)\s*=\s*\{\s*\}$/))){setType(ctx,m[1],'dict');ctx.dictKeys[m[1]]=Object.create(null);return'Creates an empty dictionary in `'+m[1]+'`. Dictionaries store key-value pairs.';}
 if((m=t.match(/^([A-Za-z_]\w*)\s*=\s*(?:list\(\s*\)|\[\s*\])$/))){setType(ctx,m[1],'list');return'Creates an empty list in `'+m[1]+'`. Lists keep items in order.';}
 if((m=t.match(/^([A-Za-z_]\w*)\s*=\s*set\(\s*\)$/))){setType(ctx,m[1],'set');return'Creates an empty set in `'+m[1]+'`. Sets keep unique values.';}
 if((m=t.match(/^([A-Za-z_]\w*)\s*=\s*tuple\(\s*\)$/))){setType(ctx,m[1],'tuple');return'Creates an empty tuple in `'+m[1]+'`. Tuples are ordered and cannot be changed in place.';}
 if((m=t.match(/^([A-Za-z_]\w*)\s*=\s*int\(\s*input\((.*)\)\s*\)$/)))return'Asks the user for input, converts the typed text to an integer, and stores it in `'+m[1]+'`.';
 if((m=t.match(/^([A-Za-z_]\w*)\s*=\s*float\(\s*input\((.*)\)\s*\)$/)))return'Asks the user for input, converts the typed text to a decimal number, and stores it in `'+m[1]+'`.';
 if((m=t.match(/^([A-Za-z_]\w*)\s*=\s*input\((.*)\)$/)))return'Asks the user for text and stores what they type in `'+m[1]+'`.';
 if((m=t.match(/^([A-Za-z_]\w*)\s*=\s*copy\.copy\((.+)\)$/)))return'Makes a shallow copy of '+displayLiteral(m[2])+' in `'+m[1]+'`. The outer object is new, but nested mutable objects are still shared.';
 if((m=t.match(/^([A-Za-z_]\w*)\s*=\s*copy\.deepcopy\((.+)\)$/)))return'Makes a deep copy of '+displayLiteral(m[2])+' in `'+m[1]+'`, including independent copies of nested mutable objects.';
 if((m=t.match(/^([A-Za-z_]\w*)\s*=\s*(.+?)\.copy\(\)$/))){setType(ctx,m[1],'copy');return'Makes a shallow copy of '+displayLiteral(m[2])+' in `'+m[1]+'`. Nested mutable objects are still shared.';}
 if((m=t.match(/^([A-Za-z_]\w*)\s*=\s*(.+?)\.split\(\s*\)$/)))return'Splits '+displayLiteral(m[2])+' at whitespace and stores the resulting list in `'+m[1]+'`.';
 if((m=t.match(/^([A-Za-z_]\w*)\s*=\s*Counter\((.+)\)$/))){setType(ctx,m[1],'counter');return'Counts how often each item appears in '+displayLiteral(m[2])+' and stores those counts in `'+m[1]+'`.';}
 if((m=t.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/))){var name=m[1],expr=clean(m[2]);rememberValue(ctx,name,expr);var exprMeaning=pythonExpressionMeaning(expr);if(exprMeaning)return exprMeaning+' The result is stored in `'+name+'`.';if(/^['"].*['"]$/.test(expr))return'Stores the text '+displayLiteral(expr)+' in `'+name+'` so later lines can use it.';if(/^-?\d+(?:\.\d+)?$/.test(expr))return'Stores the number '+displayLiteral(expr)+' in `'+name+'` for later calculations.';if(/^(True|False)$/.test(expr))return'Stores the Boolean value '+displayLiteral(expr)+' in `'+name+'`.';if(/^\[.*\]$/.test(expr)){setType(ctx,name,'list');return'Creates a list from '+displayLiteral(expr)+' and stores it in `'+name+'`.';}if(/^\{.*:.*\}$/.test(expr)){setType(ctx,name,'dict');return'Creates a dictionary from these key-value pairs and stores it in `'+name+'`.';}return'Calculates '+displayLiteral(expr)+' and stores the result in `'+name+'`.';}

 if((m=t.match(/^print\(\s*(['"])(.*?)\1\s+in\s+([A-Za-z_]\w*)\s*\)$/))){var key=m[2],box=m[3];if(ctx&&ctx.types[box]==='dict'){var has=dictionaryHasKey(ctx,box,key);return'Checks whether `'+key+'` is a key in `'+box+'`. It '+(has?'is, so this prints `True`.':'is not, so this prints `False` without an error.');}return'Checks whether `'+key+'` exists in `'+box+'` and prints `True` or `False`.';}
 if((m=t.match(/^print\(\s*type\((.+)\)\s*\)$/)))return'Prints the type of '+displayLiteral(m[1])+', showing what kind of value it currently stores.';
 if(/^print\(\s*sys\.version_info\.major\s*\)$/.test(t))return'Prints the major Python version number, such as `3` for Python 3.';
 if((m=t.match(/^print\(\s*keyword\.iskeyword\((.+)\)\s*\)$/)))return'Checks whether '+displayLiteral(m[1])+' is a reserved Python keyword and prints the Boolean result.';
 if((m=t.match(/^print\(\s*len\((.+)\)\s*\)\s*$/)))return'Counts how many items are in '+displayLiteral(m[1])+' and prints that number.';
 if((m=t.match(/^print\(\s*(.+?)\s*&\s*(.+?)\s*\)$/)))return'Bitwise AND compares '+displayLiteral(m[1])+' and '+displayLiteral(m[2])+' bit by bit; only positions with two `1`s stay `1`, then it prints the result.';
 if((m=t.match(/^print\(\s*(.+?)\s*\|\s*(.+?)\s*\)$/)))return'Bitwise OR compares '+displayLiteral(m[1])+' and '+displayLiteral(m[2])+'; a bit becomes `1` when either side has `1`, then it prints the result.';
 if((m=t.match(/^print\(\s*(.+?)\s*\^\s*(.+?)\s*\)$/)))return'Bitwise XOR compares '+displayLiteral(m[1])+' and '+displayLiteral(m[2])+'; a bit becomes `1` when the two bits differ, then it prints the result.';
 if((m=t.match(/^print\(\s*(.+?)\s*<<\s*(\d+)\s*\)$/)))return'Shifts the bits of '+displayLiteral(m[1])+' left by '+m[2]+' position(s), then prints the new number.';
 if((m=t.match(/^print\(\s*(.+?)\s*>>\s*(\d+)\s*\)$/)))return'Shifts the bits of '+displayLiteral(m[1])+' right by '+m[2]+' position(s), then prints the new number.';
 if((m=t.match(/^print\(\s*(.+)\s*\)$/))){var pm=pythonExpressionMeaning(m[1]);return pm?pm+' `print()` displays that result.':'Displays the current value or result of '+displayLiteral(m[1])+'.';}
 if(/^[\]\)}]+[,]?$/.test(t))return'Closes the collection or function call that was opened on earlier lines.';
 if((m=t.match(/^(['"])(.*?)\1\s*:\s*(.+?)[,]?$/)))return'Adds dictionary key `'+m[2]+'` with value '+displayLiteral(m[3].replace(/,$/,''))+'.';
 if((m=t.match(/^(.+?)\.describe\(\s*\)$/)))return'Summarizes '+displayLiteral(m[1])+' with statistics such as count, mean, spread, and range.';
 if((m=t.match(/^(.+?)\.value_counts\(\s*\)$/)))return'Counts how often each distinct value appears in '+displayLiteral(m[1])+'.';
 if((m=t.match(/^(.+?)\.corr\((.*)\)$/)))return'Calculates correlations between numeric columns/values in '+displayLiteral(m[1])+' to show how strongly they move together.';
 if((m=t.match(/^(.+?)\.shape\s*,\s*(.+?)\.dtypes\s*,\s*(.+?)\.describe\(\)$/)))return'Shows the data shape, each column type, and summary statistics for quick dataset inspection.';
 if(/^transforms\.Compose\(\[$/.test(t))return'Starts an image-transform pipeline; the indented transforms below will run in order.';
 var callCore=t.replace(/,$/,'');
 if((m=callCore.match(/^([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\s*\((.*)\)$/))){var fn=m[1],args=clean(m[2]);var common={'transforms.Resize':'Creates a resize transform so images are changed to the requested size.','transforms.ToTensor':'Creates a transform that converts image data into a tensor for model input.','transforms.Normalize':'Creates a normalization transform that rescales tensor channels using the given mean and standard deviation.','logging.info':'Writes an informational message to the application log.','logging.error':'Writes an error message to the application log.'};return common[fn]||( 'Calls `'+fn+'(...)` with '+(args?('the argument(s) '+displayLiteral(args)):'no arguments')+'.');}
 return'Executes this Python expression/statement as written; use the Syntax section to see how its operators and delimiters work.';
}
function cppTeachingPurpose(raw,lang,ctx){
 var t=clean(stripInlineComment(raw,lang)),original=clean(raw),m,isJava=lang==='java';
 if(!t)return original?'Comment for the reader; the compiler ignores it.':'Blank line for spacing.';
 if(/^\/\//.test(original)){var c=original.replace(/^\/\//,'').trim();return c?'Comment for the reader: '+displayLiteral(c)+'. The compiler ignores it.':'Comment for the reader; the compiler ignores it.';}
 if(!isJava&&(m=t.match(/^#include\s*([<"])([^>"]+)[>"]/))){var headers={iostream:'Provides `std::cout` and `std::cin` for console output/input.',vector:'Provides `std::vector`, a resizable array.',string:'Provides `std::string` for text.',memory:'Provides smart pointers such as `std::unique_ptr` and `std::shared_ptr`.',algorithm:'Provides algorithms such as `sort`, `find`, and `reverse`.',unordered_map:'Provides hash-table dictionaries through `std::unordered_map`.',map:'Provides ordered key-value storage through `std::map`.',queue:'Provides queue data structures.',stack:'Provides stack data structures.',set:'Provides ordered sets of unique values.'};return'Includes `'+m[2]+'`. '+(headers[m[2]]||'This makes declarations from that header available to the program.');}
 if(!isJava&&(m=t.match(/^using\s+namespace\s+([A-Za-z_]\w*)/)))return'Lets the code use names from `'+m[1]+'` without writing the namespace prefix each time.';
 if(/\bmain\s*\(/.test(t))return isJava?'Defines the program entry method. Execution starts here.':'Defines `main()`, the function where a C++ program starts running.';
 if((m=t.match(/^(?:class|struct)\s+([A-Za-z_]\w*)/)))return'Defines `'+m[1]+'`, a custom type that groups related data and behavior.';
 if((m=t.match(/^((?:[\w:<>]+\s+)*[\w:<>]+(?:\s*[*&])?)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*\{/))&&!/^(if|for|while|switch)$/.test(m[2]))return'Defines function `'+m[2]+'(...)`, which receives its parameters and returns a `'+clean(m[1])+'` value.';
 if((m=t.match(/^if\s*\((.+)\)\s*\{/)))return'Checks whether '+explainCondition(m[1])+'. If yes, the block runs.';
 if((m=t.match(/^else\s+if\s*\((.+)\)\s*(.+);$/)))return'If the earlier condition failed and '+explainCondition(m[1])+', executes '+displayLiteral(m[2])+'.';
 if((m=t.match(/^else\s+(.+);$/)))return'If the earlier condition failed, executes '+displayLiteral(m[1])+'.';
 if(/^else\b/.test(t))return'Runs the fallback block when the earlier condition is false.';
 if((m=t.match(/^while\s*\((.+)\)\s*\{/)))return'Repeats the block while '+explainCondition(m[1])+'.';
 if(/^for\s*\(/.test(t))return'Starts a loop; the header controls its starting value, condition, and update.';
 if((m=t.match(/^return\s+(.+?);?$/))){if(clean(m[1])==='0'&&ctx)return'Ends the function and returns `0`; from `main`, this usually means the program finished successfully.';return'Ends the function and sends '+displayLiteral(m[1])+' back to its caller.';}
 if((m=t.match(/^(?:std::)?cout\s*<<\s*(.+);$/)))return'Writes '+displayLiteral(m[1].replace(/\s*<<\s*(?:std::)?endl\s*$/,''))+' to the console.';
 if((m=t.match(/^(?:std::)?cin\s*>>\s*(.+);$/)))return'Reads user input from the console and stores it in '+displayLiteral(m[1])+'.';
 if(/^}\s*;?$/.test(t))return'Ends the current code block.';
 if((m=t.match(/^([\w:<>]+)\s*\*\s*([A-Za-z_]\w*)\s*=\s*&\s*([A-Za-z_]\w*)\s*;/)))return'Creates pointer `'+m[2]+'` and stores the memory address of `'+m[3]+'` in it.';
 if((m=t.match(/^([\w:<>]+)\s*&\s*([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\s*;/)))return'Creates reference `'+m[2]+'` as another name for `'+m[3]+'`; both refer to the same value.';
 if((m=t.match(/^(?:const\s+)?(?:std::)?vector<([^>]+)>\s+([A-Za-z_]\w*)\s*(?:=\s*)?(.+?);$/)))return'Creates vector `'+m[2]+'` that stores `'+clean(m[1])+'` values, initialized from '+displayLiteral(m[3])+'.';
 if((m=t.match(/^(?:const\s+)?(?:std::)?string\s+([A-Za-z_]\w*)\s*=\s*(.+?);$/)))return'Creates text variable `'+m[1]+'` with starting value '+displayLiteral(m[2])+'.';
 if((m=t.match(/^namespace\s+([A-Za-z_]\w*)\s*\{\s*(.+)\s*\}$/)))return'Creates namespace `'+m[1]+'` and places '+displayLiteral(m[2])+' inside it to avoid name collisions.';
 if((m=t.match(/^if\s*\((.+)\)\s*(.+);$/)))return'If '+explainCondition(m[1])+', then executes '+displayLiteral(m[2])+'.';
 if((m=t.match(/^else\s+if\s*\((.+)\)\s*(.+);$/)))return'If the earlier condition failed and '+explainCondition(m[1])+', executes '+displayLiteral(m[2])+'.';
 if((m=t.match(/^else\s+(.+);$/)))return'If the earlier condition failed, executes '+displayLiteral(m[1])+'.';
 if(/^continue\s*;?$/.test(t))return'Skips the rest of this loop iteration and starts the next one.';
 if(/^break\s*;?$/.test(t))return'Stops the nearest loop immediately.';
 if((m=t.match(/^(.+?)\s*(\+=|-=|\*=|\/=|%=)\s*(.+?);$/))){var cop={'+=':'adds','-=':'subtracts','*=':'multiplies by','/=':'divides by','%=':'takes the remainder with'};return'Updates '+displayLiteral(m[1])+': '+cop[m[2]]+' '+displayLiteral(m[3])+' and stores the result back.';}
 if((m=t.match(/^auto\s+([A-Za-z_]\w*)\s*=\s*(.+?);$/)))return'Creates `'+m[1]+'`; `auto` lets the compiler infer its type from '+displayLiteral(m[2])+'.';
 if((m=t.match(/^constexpr\s+([\w:<>]+)\s+([A-Za-z_]\w*)\s*=\s*(.+?);$/)))return'Creates compile-time constant `'+m[2]+'` of type `'+m[1]+'` with value '+displayLiteral(m[3])+'.';
 if((m=t.match(/^([\w:<>]+)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*;$/)))return'Declares function `'+m[2]+'(...)` returning `'+m[1]+'`; its implementation appears elsewhere.';
 if((m=t.match(/^(?:const\s+)?(int|double|float|bool|char|long|size_t)\s+([A-Za-z_]\w*)\s*=\s*(.+?);$/)))return'Creates `'+m[1]+'` variable `'+m[2]+'` with starting value '+displayLiteral(m[3])+'.';
 if((m=t.match(/^([A-Za-z_]\w*)\s*=\s*(.+?);$/)))return'Updates `'+m[1]+'` with the value/result of '+displayLiteral(m[2])+'.';
 if(/^#pragma\s+once$/.test(t))return'Tells the compiler to include this header file only once per translation unit.';
 if(t.indexOf(';')>=0&&!/[{}]/.test(t)){var cparts=splitSimpleStatements(t);if(cparts.length>1){var cp=cparts.map(function(part){return cppTeachingPurpose(part+';',lang,ctx).replace(/[.]$/,'');});return cp.join('; then ')+'.';}}
 if((m=t.match(/^enum\s+class\s+([A-Za-z_]\w*)\s*\{\s*(.+)\s*\}\s*;$/)))return'Defines scoped enum `'+m[1]+'` with the named choices '+displayLiteral(m[2])+'.';
 if(/^(public|private|protected)\s*:$/.test(t))return'Changes member access for the following class members to `'+t.replace(':','')+'`.';
 if((m=t.match(/^template\s*<\s*typename\s+([A-Za-z_]\w*)\s*>$/)))return'Declares template type parameter `'+m[1]+'`, letting the following code work with different types.';
 if((m=t.match(/^(?:const\s+)?([\w:<>]+)\s+([A-Za-z_]\w*)\s*;$/)))return'Declares variable/member `'+m[2]+'` of type `'+m[1]+'` without giving it a value here.';
 if((m=t.match(/^(?:const\s+)?([\w:<>]+)\s+([A-Za-z_]\w*)\s*,\s*([A-Za-z_]\w*)\s*;$/)))return'Declares `'+m[2]+'` and `'+m[3]+'` as variables of type `'+m[1]+'`.';
 if((m=t.match(/^([\w:<>]+)\s+([A-Za-z_]\w*)\[(\d+)\]\s*=\s*\{(.+)\}\s*;$/)))return'Creates fixed-size array `'+m[2]+'` with '+m[3]+' slots and initializes it with '+displayLiteral(m[4])+'.';
 if((m=t.match(/^([\w:<>]+)\s*\*\s*([A-Za-z_]\w*)\s*=\s*new\s+([\w:<>]+)\((.*)\)\s*;$/)))return'Allocates a new `'+m[3]+'` on the heap and stores its address in pointer `'+m[2]+'`.';
 if((m=t.match(/^delete\s+([A-Za-z_]\w*)\s*;$/)))return'Releases the heap memory owned by pointer `'+m[1]+'`; that pointer must not be used as if the object still exists.';
 if((m=t.match(/^(?:std::)?(stack|queue|unordered_map|map|set)<(.+)>\s+([A-Za-z_]\w*)\s*;$/)))return'Creates `'+m[3]+'` as a `'+m[1]+'` container for '+displayLiteral(m[2])+'.';
 if((m=t.match(/^(?:std::)?vector<([^>]+)>\s+([A-Za-z_]\w*)\s*;$/)))return'Creates empty vector `'+m[2]+'` that can grow while storing `'+clean(m[1])+'` values.';
 if((m=t.match(/^(.+?)->([A-Za-z_]\w*)\s*=\s*(.+?);$/)))return'Sets member `'+m[2]+'` through pointer '+displayLiteral(m[1])+' to '+displayLiteral(m[3])+'.';
 if((m=t.match(/^([A-Za-z_]\w*(?:\[[^\]]+\])+)\s*=\s*(.+?);$/)))return'Stores '+displayLiteral(m[2])+' into '+displayLiteral(m[1])+'.';
 if((m=t.match(/^([A-Za-z_]\w*)\s*<<\s*(.+?);$/)))return'Writes '+displayLiteral(m[2])+' into output stream `'+m[1]+'`.';
 if((m=t.match(/^explicit\s+([A-Za-z_]\w*)\(([^)]*)\)\s*:\s*(.+)\{\}$/)))return'Defines constructor `'+m[1]+'(...)`; the initializer list sets member state before the constructor body runs.';
 if((m=t.match(/^~([A-Za-z_]\w*)\(\)\s*=\s*default\s*;$/)))return'Uses the compiler-generated destructor for `'+m[1]+'`, which cleans up members automatically.';
 if((m=t.match(/^(?:static\s+)?(?:const\s+)?([\w:<>]+(?:\s*[&*])?)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(?:const\s*)?\{\s*return\s+(.+?);\s*\}$/)))return'Defines `'+m[2]+'(...)` to return '+displayLiteral(m[4])+' when called.';
 if((m=t.match(/^([\w:<>]+)\s+operator([+\-*\/])\(([^)]*)\)\s+const\s*\{\s*return\s+(.+?);\s*\}$/)))return'Overloads operator `'+m[2]+'` so objects of this type combine using '+displayLiteral(m[4])+'.';
 if((m=t.match(/^([A-Za-z_]\w*(?:::\w+|\.\w+)*)\s*\((.*)\)\s*;$/)))return'Calls `'+m[1]+'(...)`'+(clean(m[2])?' using '+displayLiteral(m[2]):' with no arguments')+'.';
 return'This '+(isJava?'Java':'C++')+' line uses the shown declaration, operator, or function call to define behavior or update program state.';
}
function jsTeachingPurpose(raw,lang,ctx){
 var t=clean(stripInlineComment(raw,lang)),original=clean(raw),m;
 if(!t)return original?'Comment for the reader; JavaScript ignores it.':'Blank line for spacing.';
 if(/^\/\//.test(original)){var c=original.replace(/^\/\//,'').trim();return c?'Comment for the reader: '+displayLiteral(c)+'. JavaScript ignores it.':'Comment for the reader; JavaScript ignores it.';}
 if(/^#/.test(original)){var pc=original.replace(/^#+\s*/,'');return pc?'Conceptual note: '+pc.replace(/[.;,]+$/,'')+'.':'Conceptual note for the reader.';}
 if((m=t.match(/^import\s+(.+)\s+from\s+(.+?);?$/)))return'Imports '+displayLiteral(m[1])+' from '+displayLiteral(m[2])+' so this file can use it.';
 if((m=t.match(/^const\s+\[([A-Za-z_$][\w$]*),\s*([A-Za-z_$][\w$]*)\]\s*=\s*useState\((.*)\)\s*;?$/)))return'Creates React state `'+m[1]+'` with starting value '+displayLiteral(m[3])+', plus `'+m[2]+'` to update it.';
 if((m=t.match(/^(const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(.+?);?$/))){var kind=m[1],name=m[2],expr=clean(m[3]);if(/^\[.*\]$/.test(expr))return'Creates `'+name+'` as an array containing '+displayLiteral(expr)+'.';if(/^\{.*\}$/.test(expr))return'Creates `'+name+'` as an object containing these named properties.';if(/^['"`]/.test(expr))return'Creates `'+name+'` and stores the text '+displayLiteral(expr)+' in it.';return'Creates `'+name+'` and stores the value/result of '+displayLiteral(expr)+' in it.';}
 if((m=t.match(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/)))return'Defines function `'+m[1]+'('+clean(m[2])+')`. Its body runs when the function is called.';
 if((m=t.match(/^if\s*\((.+)\)/)))return'Checks whether '+explainCondition(m[1])+'. If yes, the following block runs.';
 if(/^else\b/.test(t))return'Runs this fallback block when the earlier condition was false.';
 if(/^for\b/.test(t))return'Starts a loop that repeats the following block according to this loop header.';
 if((m=t.match(/^while\s*\((.+)\)/)))return'Repeats the following block while '+explainCondition(m[1])+'.';
 if((m=t.match(/^return(?:\s+(.+?))?;?$/)))return m[1]?'Ends the function and returns '+displayLiteral(m[1])+'.':'Ends the function without returning a value.';
 if((m=t.match(/^console\.log\(\s*(.+)\s*\)\s*;?$/))){if(/\.length$/.test(clean(m[1])))return'Prints how many items/characters are in '+displayLiteral(clean(m[1]).replace(/\.length$/,''))+'.';return'Prints the current value/result of '+displayLiteral(m[1])+' to the console.';}
 if((m=t.match(/^\{(.+?)\?(.+?):(.+)\}$/)))return'Uses a ternary choice: when '+displayLiteral(m[1])+' is truthy it shows/uses '+displayLiteral(m[2])+', otherwise '+displayLiteral(m[3])+'.';
 if((m=t.match(/^<\/([A-Za-z][\w-]*)>\s*;?$/)))return'Closes the JSX/HTML `<'+m[1]+'>` element opened earlier.';
 if(/^\}\)\s*;?$/.test(t))return'Closes the callback/function body and the surrounding function call.';
 if((m=t.match(/\.addEventListener\(\s*(['"])(.*?)\1/)))return'Listens for the `'+m[2]+'` event and runs the provided handler when that event happens.';
 if((m=t.match(/(?:document\.)?querySelector(All)?\((.+)\)/)))return m[1]?'Finds all page elements matching '+displayLiteral(m[2])+'.':'Finds the first page element matching '+displayLiteral(m[2])+'.';
 if(/^}\s*;?$/.test(t))return'Ends the current JavaScript/TypeScript block or object.';
 if((m=t.match(/^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*=\s*(.+?);?$/)))return'Updates `'+m[1]+'` with the value/result of '+displayLiteral(m[2])+'.';
 if((m=t.match(/^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\((.*)\)\s*;?$/)))return'Calls `'+m[1]+'(...)`'+(clean(m[2])?' with '+displayLiteral(m[2]):' with no arguments')+'.';
 return'Executes this JavaScript/TypeScript expression; the operators and properties on the line determine what value or side effect it produces.';
}
function httpTeachingPurpose(raw){
 var t=clean(raw),m;if(!t)return'Blank line for spacing.';if(/^#/.test(t))return'Comment/note for the reader; it is not part of the HTTP request.';
 if((m=t.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(\S+)(?:\s+#\s*(.*))?$/i))){var method=m[1].toUpperCase(),meaning={GET:'requests/reads',POST:'creates/submits',PUT:'replaces',PATCH:'partially updates',DELETE:'removes',HEAD:'requests headers for',OPTIONS:'asks which methods are supported by'};return'`'+method+'` '+meaning[method]+' the resource at `'+m[2]+'`.'+(m[3]?' The note says '+m[3].replace(/[.;,]+$/,'')+'.':'');}
 if((m=t.match(/^HTTP\/\d(?:\.\d)?\s+(\d{3})\s+(.+)$/)))return'The server responds with HTTP `'+m[1]+' '+m[2]+'`, describing the result of the request.';
 if((m=t.match(/^(\d{3})\s+(.+?)(?:\s+--\s*(.*))?$/)))return'HTTP status `'+m[1]+' '+m[2]+'` tells the client how the request ended.'+(m[3]?' Here it means '+m[3].replace(/[.;,]+$/,'')+'.':'');
 if((m=t.match(/^([A-Za-z][\w-]*)\s*:\s*(.+)$/)))return'Sets HTTP header `'+m[1]+'` to '+displayLiteral(m[2])+'.';
 return'Describes part of an HTTP request/response exchange.';
}
function sqlTeachingPurpose(raw){
 var t=clean(raw),m;if(!t)return'Blank line for spacing.';if(/^--/.test(t))return'Comment for the reader; the database ignores it.';
 if((m=t.match(/^SELECT\s+(.+)$/i)))return'Chooses '+displayLiteral(m[1])+' as the values/columns the query should return.';
 if((m=t.match(/^FROM\s+([\w."`\[\]-]+)/i)))return'Reads the starting rows from table/result '+displayLiteral(m[1])+'.';
 if(/^WHERE\b/i.test(t))return'Keeps only rows where the condition after `WHERE` is true.';
 if(/^(LEFT|RIGHT|INNER|FULL|CROSS)?\s*JOIN\b/i.test(t))return'Adds related rows from another table to the current result.';
 if(/^ON\b/i.test(t))return'Defines which rows from the joined tables count as a match.';
 if(/^GROUP\s+BY\b/i.test(t))return'Groups rows with the same values so aggregate functions can calculate per group.';
 if(/^HAVING\b/i.test(t))return'Filters groups after aggregation, similar to how `WHERE` filters individual rows.';
 if(/^ORDER\s+BY\b/i.test(t))return'Sorts the final rows using the listed column/expression and direction.';
 if(/^LIMIT\b|^FETCH\b/i.test(t))return'Limits how many rows the database returns.';
 if(/^INSERT\s+INTO\b/i.test(t))return'Starts adding a new row to the named table.';
 if(/^VALUES\b/i.test(t))return'Provides the values that will be inserted into the new row.';
 if(/^UPDATE\b/i.test(t))return'Chooses the table whose existing rows will be changed.';
 if(/^SET\b/i.test(t))return'Specifies the new values to write into the selected rows.';
 if(/^DELETE\s+FROM\b/i.test(t))return'Removes matching rows from the named table.';
 if(/^CREATE\s+TABLE\b/i.test(t))return'Creates a new table and begins defining its columns.';
 if((m=t.match(/^([A-Za-z_]\w*)\s+(INTEGER|INT|BIGINT|SERIAL|TEXT|VARCHAR(?:\([^)]*\))?|NUMERIC|DECIMAL|TIMESTAMP|BOOLEAN)(.*?)[,]?$/i))){var rules=clean(m[3]).replace(/,$/,'');return'Defines column `'+m[1]+'` with type `'+m[2]+'`'+(rules?' and rules `'+rules+'`':'')+'.';}
 if(/^\)\s*;?$/.test(t))return'Closes the table/subquery/function definition that started on earlier lines.';
 if((m=t.match(/^CREATE\s+INDEX\s+([A-Za-z_]\w*)\s+ON\s+([A-Za-z_]\w*)\(([^)]+)\)\s*;?$/i)))return'Creates index `'+m[1]+'` on `'+m[2]+'('+clean(m[3])+')` to speed matching/sorting patterns that use those columns.';
 if(/^BEGIN\s+(?:TRANSACTION|WORK)\s*;?$/i.test(t)||/^BEGIN\s*;?$/i.test(t))return'Starts a transaction so the following database changes can succeed or fail as one unit.';
 if(/^COMMIT\s*;?$/i.test(t))return'Saves all changes made in the current transaction permanently.';
 if(/^ROLLBACK\s*;?$/i.test(t))return'Cancels the current transaction and restores the database to its state before it began.';
 if(/^EXPLAIN\s+/i.test(t))return'Asks the database to show its query execution plan so you can inspect how it will run the query.';
 if(/^SUM\s*\(/i.test(t)||/^COUNT\s*\(/i.test(t)||/^AVG\s*\(/i.test(t))return'Calculates an aggregate value; any `OVER (...)` part makes it a window calculation without collapsing rows.';
 if(/^#|^--/.test(t))return'Comment/note for the reader; the database does not execute it.';
 if(/^[A-Z][A-Za-z ]{12,}[,.]/.test(t)&&!/[();=]/.test(t))return'This is a database-design note for the reader, not SQL the database should execute.';
 if(/^WITH\b/i.test(t))return'Creates a temporary named result (CTE) that the main query can use.';
 if(/candidate index|correct choice depends on real data|workload/i.test(t))return'Explains that this index may help, but real data and workload should confirm the choice.';
 if(/^[A-Z][A-Za-z0-9 ,.'`_()/-]{20,}$/.test(t)&&!/(SELECT|FROM|WHERE|JOIN|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\b/i.test(t))return'This is a plain-English database note explaining the design choice, not SQL to execute.';
 return'Uses this SQL expression as part of the current query; the surrounding clauses determine how it affects the result.';
}
function htmlTeachingPurpose(raw){
 var t=clean(raw),m;if(!t)return'Blank line for spacing.';if(/^<!--/.test(t))return'Comment for the reader; the browser does not display it.';
 if((m=t.match(/^<\/([\w-]+)>/)))return'Closes the `<'+m[1]+'>` element opened earlier.';
 if((m=t.match(/^<([\w-]+)([^>]*)>([^<]*)<\/\1>$/))){var tag=m[1],attrs=m[2],content=clean(m[3]),extra='';var id=(attrs.match(/\bid=["']([^"']+)/)||[])[1];if(id)extra=' The id `'+id+'` lets CSS or JavaScript target it.';return'Creates a `<'+tag+'>` element'+(content?' containing '+displayLiteral(content):'')+'.'+extra;}
 if((m=t.match(/^<([\w-]+)([^>]*)>/))){var tag2=m[1],attrs2=m[2],id2=(attrs2.match(/\bid=["']([^"']+)/)||[])[1];return'Opens a `<'+tag2+'>` element.'+(id2?' Its id `'+id2+'` lets CSS or JavaScript target it.':'');}
 return'Adds this text/content inside the surrounding HTML element.';
}
function cssTeachingPurpose(raw){
 var t=clean(raw),m;if(!t)return'Blank line for spacing.';if(/^\/\*/.test(t))return'Comment for the reader; it does not change the styling.';if(/^@media\b/.test(t))return'Starts a media query, so the nested styles apply only when its condition matches.';if(/^}/.test(t))return'Ends the current CSS rule/block.';
 if((m=t.match(/^(.+?)\s*\{\s*(.+)\s*\}\s*$/))){var selector=clean(m[1]),decls=m[2].split(';').map(clean).filter(Boolean),ideas=[];decls.slice(0,3).forEach(function(d){var dm=d.match(/^([\w-]+)\s*:\s*(.+)$/);if(!dm)return;var prop=dm[1],val=dm[2];if(prop==='display'&&val==='flex')ideas.push('uses flex layout');else if(prop==='display'&&val==='grid')ideas.push('uses grid layout');else if(prop==='gap')ideas.push('keeps '+val+' between items');else ideas.push('sets '+prop+' to '+val);});return'Styles elements matching `'+selector+'`'+(ideas.length?': '+ideas.join(' and '):' using the declarations inside')+'.';}
 if(/\{\s*$/.test(t))return'Starts a CSS rule; the declarations below style elements matching this selector.';
 if((m=t.match(/^([\w-]+)\s*:\s*(.+?);?$/))){var prop=m[1],val=clean(m[2]),map={display:'Changes how the element participates in layout.',gap:'Sets spacing between items inside a grid or flex container.',color:'Sets the text color.',background:'Sets the element background.',margin:'Sets space outside the element.',padding:'Sets space inside the element.',width:'Sets the element width.',height:'Sets the element height.','font-size':'Sets the text size.','grid-template-columns':'Defines the grid column sizes.','align-items':'Controls cross-axis alignment of items.','justify-content':'Controls main-axis distribution/alignment of items.'};return'Sets `'+prop+'` to '+displayLiteral(val)+'. '+(map[prop]||'This changes that visual/layout property.');}
 return'Uses this selector/declaration as part of the current CSS rule to control which elements are styled and how.';
}
function shellTeachingPurpose(raw){
 var t=clean(raw),m;if(!t)return'Blank line for spacing.';if(/^#/.test(t))return'Comment for the reader; the shell does not run it.';
 if(/^git\s+status\b/.test(t))return'Shows the current branch plus changed, staged, and untracked files.';
 if((m=t.match(/^git\s+add\s+(.+)$/)))return'Stages '+displayLiteral(m[1])+' so it will be included in the next commit.';
 if((m=t.match(/^git\s+commit\s+-m\s+(["'])(.*?)\1/)))return'Creates a commit from staged changes with message `'+m[2]+'`.';
 if(/^git\s+push\b/.test(t))return'Sends local commits to the configured remote Git repository.';
 if(/^git\s+pull\b/.test(t))return'Downloads remote changes and integrates them into the current branch.';
 if((m=t.match(/^cd\s+(.+)$/)))return'Changes the terminal’s current folder to '+displayLiteral(m[1])+'.';
 if((m=t.match(/^mkdir\s+(.+)$/)))return'Creates a new folder named '+displayLiteral(m[1])+'.';
 if(/^pwd\b/.test(t))return'Prints the full path of the current folder.';
 if(/^ls\b/.test(t))return'Lists files and folders in the requested location.';
 if((m=t.match(/^python\s+(.+)$/)))return'Runs the Python program/file '+displayLiteral(m[1])+'.';
 if((m=t.match(/^pip\s+install\s+(.+)$/)))return'Installs the Python package(s) '+displayLiteral(m[1])+' into the current environment.';
 if((m=t.match(/^helm\s+install\s+(\S+)\s+(\S+)(.*)$/)))return'Installs Helm release `'+m[1]+'` from chart `'+m[2]+'`'+(clean(m[3])?' using the shown override options':'')+'.';
 if((m=t.match(/^helm\s+upgrade\s+(\S+)\s+(\S+)(.*)$/)))return'Upgrades Helm release `'+m[1]+'` using chart `'+m[2]+'` and the shown settings.';
 if((m=t.match(/^helm\s+rollback\s+(\S+)\s+(\S+)/)))return'Rolls Helm release `'+m[1]+'` back to revision `'+m[2]+'`.';
 if((m=t.match(/^man\s+(\S+)/)))return'Opens the manual page for `'+m[1]+'`, showing its options and usage.';
 if(/^df\s+-h\b/.test(t))return'Shows disk-space usage in human-readable units such as MB and GB.';
 if((m=t.match(/^wc\s+-l\s+(.+)$/)))return'Counts how many lines are in '+displayLiteral(m[1])+'.';
 var command=(t.match(/^([^\s|&;]+)/)||[])[1]||'command';return'Runs the `'+command+'` command with the arguments/options shown on this line.';
}
function dataTeachingPurpose(raw,lang){
 var t=clean(raw),m;if(!t)return'Blank line for spacing.';
 if(lang==='json'){if(/^\{/.test(t))return'Opens a JSON object, which stores named key-value pairs.';if(/^}/.test(t))return'Closes the current JSON object.';if(/^\[/.test(t))return'Opens a JSON array, an ordered list of values.';if(/^\]/.test(t))return'Closes the current JSON array.';if((m=t.match(/^"([^"\n]+)"\s*:\s*(.+?)(?:,)?$/)))return'Sets JSON field `'+m[1]+'` to '+displayLiteral(m[2].replace(/,$/,''))+'.';return'Adds another value to the JSON data structure.';}
 if(lang==='yaml'){if(/^#/.test(t))return'Comment/note for the reader; YAML ignores it as configuration data.';if((m=t.match(/^-\s+(.+)$/)))return'Adds '+displayLiteral(m[1])+' as one item in this YAML list.';if((m=t.match(/^([\w.-]+)\s*:\s*(.*)$/)))return m[2]?'Sets YAML field `'+m[1]+'` to '+displayLiteral(m[2])+'.':'Starts YAML field `'+m[1]+'`; indented lines below belong to it.';return'Adds another value to this YAML configuration.';}
 if(lang==='dockerfile'){if(/^#/.test(t)){var dn=t.replace(/^#+\s*/,'');return dn?'Build note: '+dn.replace(/[.;,]+$/,'')+'.':'Comment for the reader; Docker ignores it.';}var dm;if((dm=t.match(/^FROM\s+(\S+)(?:\s+AS\s+(\S+))?/i)))return'Starts this image'+(dm[2]?' stage `'+dm[2]+'`':'')+' from base image `'+dm[1]+'`.';if((dm=t.match(/^RUN\s+(.+)$/i))){var cmd=dm[1];if(/^pip\s+install\s+-r\s+(.+)/i.test(cmd))return'Installs the Python dependencies listed in '+displayLiteral(cmd.replace(/^pip\s+install\s+-r\s+/i,''))+' while building the image.';if(/^npm\s+install\b/i.test(cmd))return'Installs the JavaScript dependencies needed by the project while building the image.';if(/^npm\s+run\s+build\b/i.test(cmd))return'Runs the project’s production build script inside the image build stage.';return'Runs '+displayLiteral(cmd)+' while building the image.';}if((dm=t.match(/^WORKDIR\s+(.+)$/i)))return'Sets '+displayLiteral(dm[1])+' as the working folder for later Dockerfile steps.';if((dm=t.match(/^COPY\s+(.+?)\s+(.+)$/i)))return'Copies '+displayLiteral(dm[1])+' from the project into '+displayLiteral(dm[2])+' in the image.';if((dm=t.match(/^EXPOSE\s+(\S+)/i)))return'Documents that the application is expected to listen on port `'+dm[1]+'`.';if(/^CMD\s+/i.test(t))return'Sets the default command that runs when a container starts from this image.';if(/^ENTRYPOINT\s+/i.test(t))return'Sets the main executable that starts when the container runs.';if(/^ENV\s+/i.test(t))return'Sets an environment variable available inside the image/container.';if(/^ARG\s+/i.test(t))return'Defines a value that can be supplied while building the image.';return'Describes another Docker image build/startup instruction.';}
 if(/^#/.test(t)){var note=t.replace(/^#+\s*/, '').replace(/^--\s*/, '');return note?'This note explains: '+note.replace(/[.;,]+$/,'')+'.':'This is a note for the reader.';}
 if(t.indexOf('->')>=0){var steps=t.split(/\s*->\s*/).filter(Boolean);return'Shows this flow: '+steps.map(function(x){return clean(x);}).join(' → ')+'.';}
 if(t.indexOf('→')>=0){var steps2=t.split(/\s*→\s*/).filter(Boolean);return'Shows this sequence: '+steps2.map(function(x){return clean(x);}).join(' → ')+'.';}
 if((m=t.match(/^([A-Za-z_][\w.-]*)\s*:\s*(.+)$/)))return'Labels `'+m[1]+'` with value/description '+displayLiteral(m[2])+'.';
 if(/^\{.*"[^"]+"\s*:/.test(t))return'Shows a JSON-style object containing named fields and their values.';
 if(/^--\s*/.test(t)){var dbnote=t.replace(/^--\s*/, '');return'Database note: '+dbnote.replace(/[.;,]+$/,'')+'.';}
 if(/^Traceback\b/.test(t))return'Starts a Python traceback, which shows where an exception happened.';
 if(/^File\s+["']/.test(t))return'Identifies the file, line number, and function involved in the traceback.';
 if(/^\.gitignore contents:/i.test(t))return'Introduces the patterns that Git should ignore instead of tracking.';
 if(/^node_modules\/$/.test(t))return'Tells Git to ignore the `node_modules/` dependency folder.';
 if(/^\*\.log$/.test(t))return'Tells Git to ignore files whose names end in `.log`.';
 if(/^\.env$/.test(t))return'Tells Git to ignore the `.env` file, which often contains local secrets/configuration.';
 if(/^Input\s*\(/i.test(t))return'Describes the input shape/dimensions that enter this model or processing step.';
 if((m=t.match(/^([A-Za-z_][\w.\[\]'"-]*)\s*=\s*(.+)$/)))return'Stores/calculates '+displayLiteral(m[2])+' as '+displayLiteral(m[1])+' for the next step.';
 if((m=t.match(/^([A-Za-z_][\w.]*)\.(fit|train)\((.*)\)$/)))return'Trains `'+m[1]+'` using '+displayLiteral(m[3])+'.';
 if((m=t.match(/^([A-Za-z_][\w.]*)\.predict\((.*)\)$/)))return'Uses `'+m[1]+'` to make predictions for '+displayLiteral(m[2])+'.';
 if((m=t.match(/^([A-Za-z_][\w.]*)\.transform\((.*)\)$/)))return'Uses `'+m[1]+'` to transform '+displayLiteral(m[2])+' into the next representation.';
 if((m=t.match(/^([A-Za-z_][\w.]*)\((.*)\)$/)))return'Calls `'+m[1]+'(...)`'+(clean(m[2])?' using '+displayLiteral(m[2]):' with no arguments')+'.';
 return'This is a plain-English reference step for understanding the concept; it is not code to execute.';
}
function teachingPurposeFor(line,lang,ctx){
 if(lang==='python')return pythonTeachingPurpose(line,ctx);
 if(lang==='cpp'||lang==='java')return cppTeachingPurpose(line,lang,ctx);
 if(lang==='javascript'||lang==='typescript')return jsTeachingPurpose(line,lang,ctx);
 if(lang==='http')return httpTeachingPurpose(line);
 if(lang==='sql')return sqlTeachingPurpose(line);
 if(lang==='html')return htmlTeachingPurpose(line);
 if(lang==='css')return cssTeachingPurpose(line);
 if(lang==='shell')return shellTeachingPurpose(line);
 if(lang==='dockerfile'||lang==='json'||lang==='yaml'||lang==='text')return dataTeachingPurpose(line,lang);
 return'Explains the next operation or piece of structure in this example.';
}
// Kept for compatibility with older tests/tools; the full explain() call supplies context.
function quickPurposeFor(line,lang){return teachingPurposeFor(line,lang,makeContext(lang));}

function shortCode(v){var x=clean(v).replace(/\s+#.*$/,'').replace(/;\s*$/,'');return x.length>34?x.slice(0,31)+'…':x;}
function importNames(v){var xs=String(v||'').split(',').map(function(x){return clean(x).replace(/\s+as\s+.+$/,'');}).filter(Boolean);if(xs.length===1)return'`'+xs[0]+'`';if(xs.length===2)return'`'+xs[0]+'` and `'+xs[1]+'`';return xs.slice(0,-1).map(function(x){return'`'+x+'`';}).join(', ')+', and `'+xs[xs.length-1]+'`';}

function syntaxFor(line,lang){
 var original=text(line).trim();
 if(lang==='python'&&/^#/.test(original))return['`#` starts a Python comment. Everything after it on that line is ignored when the program runs.'];
 if((lang==='javascript'||lang==='typescript'||lang==='cpp'||lang==='java')&&/^\/\//.test(original))return['`//` starts a single-line comment. The compiler/runtime ignores the rest of that line.'];
 if(lang==='sql'&&/^--/.test(original))return['`--` starts a SQL comment. The database ignores the rest of that line.'];
 var syntaxLine=stripInlineComment(line,lang),t=text(syntaxLine).trim(),out=generalSyntax(syntaxLine,lang);
 if(!t)return out;
 if(lang==='python'){
  if(/^from\s+/.test(t))out.push('`from X import Y` means “look inside module X and bring name Y into the current file”.');
  else if(/^import\s+/.test(t))out.push('The keyword `import` loads a module; commas can import multiple modules in one statement.');
  if(/^def\s+/.test(t)||/^async\s+def\s+/.test(t))out.push('`def` introduces a function name; names inside `(...)` are parameters; the trailing `:` opens the function body.');
  if(/^class\s+/.test(t))out.push('`class` introduces a type name; optional parentheses name base classes; the trailing `:` opens the class body.');
  if(/^for\s+/.test(t))out.push('`for target in iterable:` assigns each next iterable value to the target before running the indented body.');
  if(/^if\s+|^elif\s+|^while\s+/.test(t))out.push('The keyword is followed by a boolean expression; the trailing `:` opens the controlled indented block.');
  if(/^return\b/.test(t))out.push('`return` may be followed by any expression; that expression becomes the function call’s result.');
  if(/\bf["']/.test(t))out.push('The `f` prefix creates an f-string; expressions inside `{...}` are evaluated and inserted into the text.');
  if(/\[[^\]]*:[^\]]*\]/.test(t))out.push('Inside `[...]`, a colon creates slice syntax `start:stop:step`; omitted parts use defaults.');
  if(/\b(True|False|None)\b/.test(t))out.push('`True` and `False` are Boolean literals; `None` represents the absence of a value.');
  if(/\b(and|or|not)\b/.test(t))out.push('`and`, `or`, and `not` combine or invert Boolean conditions.');
  if(/\bis\b/.test(t))out.push('`is` checks object identity (whether two references point to the same object), not ordinary value equality.');
  if(/\bin\b/.test(t))out.push('`in` tests membership or introduces the iterable in a `for` loop, depending on context.');
 }
 if(lang==='javascript'||lang==='typescript'){
  if(/^(const|let|var)\b/.test(t))out.push('The declaration keyword is followed by the variable name, then usually `=` and the initial value.');
  if(/\$\{[^}]+\}/.test(t))out.push('Inside a template literal, `${...}` evaluates an expression and inserts its result into the string.');
  if(/\?\./.test(t))out.push('`?.` is optional chaining: property/method access stops safely and returns `undefined` if the left side is nullish.');
  if(/\?\?/.test(t))out.push('`??` is nullish coalescing: it uses the right value only when the left value is `null` or `undefined`.');
  if(/===/.test(t))out.push('`===` checks strict equality without implicit type conversion.');
 }
 if(lang==='sql'){
  if(/\bAS\b/i.test(t))out.push('`AS` gives a column, expression, table, or CTE an alias (temporary readable name).');
  if(/\bCOUNT\s*\(/i.test(t))out.push('`COUNT(...)` is an aggregate function that counts rows/non-null values depending on its argument.');
  if(/\b(SUM|AVG|MIN|MAX)\s*\(/i.test(t))out.push('This aggregate function summarizes multiple row values into one result for the current group/window.');
  if(/\bDESC\b/i.test(t))out.push('`DESC` requests descending sort order; `ASC` (the default) means ascending.');
  if(/\bDISTINCT\b/i.test(t))out.push('`DISTINCT` removes duplicate result combinations for the selected columns/expressions.');
  if(/;\s*$/.test(t))out.push('The semicolon `;` terminates the SQL statement.');
 }
 if(lang==='html'){
  var tag=t.match(/^<\/?([\w-]+)/);if(tag)out.push('Angle brackets `<...>` form an HTML tag; the tag name here is `'+tag[1]+'`.');
  if(/\bid=/.test(t))out.push('The `id` attribute gives this element a page-unique identifier for labels, links, CSS, or JavaScript lookup.');
  if(/\bclass=/.test(t))out.push('The `class` attribute assigns one or more reusable CSS/JavaScript class names.');
  if(/\baria-[\w-]+=|\brole=/.test(t))out.push('ARIA/role attributes provide accessibility semantics for assistive technologies when native HTML alone is not enough.');
  if(/\bdata-[\w-]+=/.test(t))out.push('A `data-*` attribute stores custom element metadata that JavaScript can read through `dataset`.');
 }
 if(lang==='css'){
  if(/^[\w-]+\s*:/.test(t))out.push('CSS declaration syntax is `property: value;`: the colon separates property from value and the semicolon ends the declaration.');
  if(/\.[A-Za-z_-][\w-]*/.test(t)&&/\{/.test(t))out.push('A selector beginning with `.` targets elements whose `class` attribute contains that class name.');
  if(/#[A-Za-z_-][\w-]*/.test(t)&&/\{/.test(t))out.push('A selector beginning with `#` targets the element with that `id`.');
 }
 if(lang==='shell'){
  var flags=t.match(/(?:^|\s)(-{1,2}[A-Za-z0-9][\w-]*)/g)||[];flags.forEach(function(f){out.push('`'+f.trim()+'` is a command-line option/flag that changes how the command behaves.');});
  if(/<[^>\n]+>/.test(t))out.push('Text inside `<...>` is a placeholder: replace it with the real value (for example a PID, commit SHA, or container name).');
 }
 if(lang==='cpp'||lang==='java'){
  if(/^#include/.test(t))out.push('`#include <...>` is handled by the C++ preprocessor before compilation; angle brackets request a system/library header.');
  if(/[{}]/.test(t))out.push('Curly braces delimit a code block such as a function, class, loop, or condition.');
  if(/\b(std::)?vector\s*</.test(t))out.push('`vector<T>` is a generic/template type; `T` inside angle brackets is the element type.');
 }
 if(lang==='json'){
  if(/"[^"\n]+"\s*:/.test(t))out.push('JSON requires object keys to be quoted strings, followed by a colon and then the value.');
  if(/,\s*$/.test(t))out.push('The trailing comma separates this JSON item from the next item at the same level.');
 }
 if(lang==='yaml'){
  if(/^\s+/.test(line))out.push('Indentation is structural in YAML: deeper indentation nests this value under the nearest less-indented parent key.');
  if(/:\s*/.test(t))out.push('The colon `:` separates a YAML key from its value or from an indented nested block.');
 }
 if(!out.length){var fallback={python:'This line follows Python statement/expression syntax; read keywords, names, operators, delimiters, and indentation from left to right.',javascript:'This line follows JavaScript statement/expression syntax; delimiters and operators determine how its parts are grouped.',typescript:'This line follows TypeScript/JavaScript syntax; type annotations, delimiters, and operators describe the value and operation.',http:'This line uses HTTP request/response notation: a method/status/header identifies what is being requested or returned.',sql:'This line follows SQL clause/expression syntax; keywords define the operation and identifiers/literals provide its data.',html:'This line follows HTML markup syntax; angle brackets define elements and attributes provide element metadata.',css:'This line follows CSS selector/declaration syntax; punctuation separates selectors, properties, values, and blocks.',shell:'This line follows command-line syntax: command first, then positional arguments, options/flags, and shell operators.',cpp:'This line follows C++ declaration/expression syntax; types, names, operators, delimiters, and braces define the statement.',java:'This line follows Java statement/expression syntax; types, names, operators, delimiters, and braces define the statement.',dockerfile:'This Dockerfile line uses an uppercase instruction keyword followed by the argument(s) for that build/runtime instruction.',json:'This line follows JSON data syntax using quoted keys/strings plus braces, brackets, colons, commas, or literal values.',yaml:'This line follows YAML key/value or sequence syntax; indentation determines nesting.',text:'This is reference text rather than executable syntax; punctuation is descriptive unless the lesson says otherwise.'};out.push(fallback[lang]||'This line uses the normal syntax of the example format to express its next operation or data item.');}
 return unique(out);
}

function lineRecord(line,index,lang,ctx){return{number:index+1,code:text(line),purpose:teachingPurposeFor(line,lang,ctx||makeContext(lang)),syntax:syntaxFor(line,lang),indent:indentation(line)};}
function explain(code,lang){var lines=text(code).split(/\r?\n/),ctx=makeContext(lang);return lines.map(function(line,i){return lineRecord(line,i,lang,ctx);});}

function recordHtml(r){
 var blank=!r.code.trim(),syntax=r.syntax.length?r.syntax:['This line uses the normal syntax of the example language or format.'];
 if(blank)return '<li class="csai-line-item is-blank" data-line-number="'+r.number+'"><div class="csai-line-code"><span class="csai-line-number">Line '+r.number+'</span><span class="csai-line-blank-note">Blank line for spacing.</span></div></li>';
 return '<li class="csai-line-item" data-line-number="'+r.number+'"><div class="csai-line-code"><span class="csai-line-number">Line '+r.number+'</span><code>'+esc(r.code)+'</code></div><p class="csai-line-purpose">'+esc(r.purpose)+'</p><details class="csai-line-syntax"><summary>Syntax</summary><ul>'+syntax.map(function(x){return'<li>'+esc(x)+'</li>';}).join('')+'</ul></details></li>';
}
function listHtml(code,lang){return explain(code,lang).map(recordHtml).join('');}
function inlineCommentFor(line,purpose,lang){
 var raw=text(line),note=clean(purpose);
 if(!raw.trim())return'';
 var suffix;
 if(lang==='python'||lang==='shell'||lang==='dockerfile'||lang==='yaml')suffix='# '+note;
 else if(lang==='sql')suffix='-- '+note;
 else if(lang==='html')suffix='<!-- '+note+' -->';
 else if(lang==='css')suffix='/* '+note+' */';
 else suffix='// '+note;
 return raw.replace(/\s+$/,'')+'  '+suffix;
}
function commentedCode(code,lang){return explain(code,lang).map(function(r){return inlineCommentFor(r.code,r.purpose,lang);}).join('\n');}
function commentedCodeHtml(code,lang){return '<section class="csai-commented-code" data-csai-commented-code><div class="csai-commented-code-title">Code with comments</div><p class="csai-commented-code-note">Learning view: each source line includes its explanation as a comment. Keep using the clean code above to run or edit.</p><pre><code>'+esc(commentedCode(code,lang))+'</code></pre></section>';}
function glossaryTerms(code,lang){var c=text(code),terms=[];function add(term,meaning){if(!terms.some(function(x){return x.term===term;}))terms.push({term:term,meaning:meaning});}
 if(lang==='python'){
  if(/\bimport\b|\bfrom\s+\S+\s+import\b/.test(c))add('import','Loads reusable code from a Python module so this program can use it.');
  if(/\bfrom\s+io\b|\bimport\s+io\b|\b(?:io\.)?StringIO\b|\bsys\.(?:stdin|stdout)\b/.test(c))add('I/O','Input/output streams are used explicitly in this code through the `io`/`sys` stream tools shown.');
  if(/\bimport\s+io\b|\bfrom\s+io\b|\bio\.StringIO\b/.test(c))add('io module','Python’s standard module for working with input/output streams, including in-memory streams.');
  if(/\bimport\s+sys\b|\bfrom\s+sys\b|\bsys\.[A-Za-z_]\w*/.test(c))add('sys module','Python’s standard module for runtime/system information and the specific `sys` feature used in this code.');
  if(/\b(?:io\.)?StringIO\b/.test(c))add('StringIO','A text stream stored in memory. It acts like a text file, but no disk file is created.');
  if(/\bsys\.stdout\b/.test(c))add('sys.stdout','Python’s standard output stream—the normal destination used by print().');
  if(/\bsys\.stdin\b/.test(c))add('sys.stdin','Python’s standard input stream—the normal source used by input().');
  if(/\bprint\s*\(/.test(c))add('print()','Displays a value or message so you can see the program result.');
  if(/\binput\s*\(/.test(c))add('input()','Pauses for user text and returns what the user typed as a string.');
  if(/\bexec\s*\(/.test(c))add('exec','Runs Python source code that is provided as text.');
  if(/\bcompile\s*\(/.test(c))add('compile','Turns Python source text into a code object that Python can execute.');
  if(/\bdef\s+[A-Za-z_]/.test(c))add('function','A reusable block of code, usually created with def and run by calling its name.');
  if(/\bclass\s+[A-Za-z_]/.test(c))add('class','A blueprint for creating objects that group related data and behavior.');
  if(/\bNone\b/.test(c))add('None','Python’s special value meaning “no value” or “nothing here yet.”');
  if(/\b(?:True|False)\b/.test(c))add('Boolean','A logical value that is either True or False.');
  if(/\blist\s*\(|\[[^\]\n]*,\s*[^\]\n]*\]|\[\s*\]/.test(c))add('list','An ordered, changeable collection of values.');
  if(/\bdict\s*\(|\{[^{}]*:[^{}]*\}/.test(c))add('dictionary','A collection of key-value pairs used to look up values by key.');
  if(/\bset\s*\(/.test(c))add('set','A collection that keeps unique values and supports fast membership checks.');
  if(/\btuple\s*\(|=\s*\([^()\n]+,\s*[^()\n]+\)/.test(c))add('tuple','An ordered collection whose items are normally treated as fixed.');
  if(/\brange\s*\(/.test(c))add('range','Produces a sequence of integer values, commonly used to control a loop.');
  if(/\benumerate\s*\(/.test(c))add('enumerate','Loops over items while also giving each item’s index.');
  if(/\bzip\s*\(/.test(c))add('zip','Pairs items from multiple iterables so they can be processed together.');
  if(/\blen\s*\(/.test(c))add('len','Returns how many items are in a collection or characters are in a string.');
  if(/\.append\s*\(/.test(c))add('append','Adds one item to the end of a list.');
  if(/\.strip\s*\(/.test(c))add('strip()','Removes whitespace from the beginning and end of a string.');
  if(/\.join\s*\(/.test(c))add('join()','Combines several strings into one string, using the string before `.join()` as the separator.');
  if(/\.split\s*\(/.test(c))add('split()','Breaks one string into a list of smaller strings.');
  if(/\.lower\s*\(/.test(c))add('lower()','Returns a lowercase version of the string.');
  if(/\.upper\s*\(/.test(c))add('upper()','Returns an uppercase version of the string.');
  if(/\.startswith\s*\(/.test(c))add('startswith()','Checks whether a string begins with the specified text.');
  if(/\.endswith\s*\(/.test(c))add('endswith()','Checks whether a string ends with the specified text.');
  if(/\.replace\s*\(/.test(c))add('replace()','Returns new text with the specified part replaced.');
  if(/\.count\s*\(/.test(c))add('count()','Counts how many times the specified value appears.');
  if(/\.get\s*\(/.test(c))add('get()','Looks up a dictionary key and can return a default value when the key is missing.');
  if(/\.pop\s*\(/.test(c))add('pop()','Removes an item from a collection and returns the removed value.');
  if(/\bsorted\s*\(/.test(c))add('sorted','Returns a new list containing the items in sorted order.');
  if(/\bmap\s*\(/.test(c))add('map','Applies a function to each item from an iterable.');
  if(/\bfilter\s*\(/.test(c))add('filter','Keeps only items for which a condition/function is true.');
  if(/\blambda\b/.test(c))add('lambda','A short anonymous function written inline.');
  if(/\btry\s*:|\bexcept\b/.test(c))add('try / except','Runs code that may fail and gives you a controlled way to handle an exception.');
  if(/\bwith\s+/.test(c))add('with','Uses a resource for a block and automatically performs its cleanup afterward.');
  if(/\byield\b/.test(c))add('yield','Produces one generator value and pauses the function so it can continue later.');
  if(/\basync\s+def\b|\bawait\b/.test(c))add('async / await','Syntax for asynchronous work; await waits for an operation without blocking the whole program.');
 }
 if(lang==='javascript'||lang==='typescript'){
  if(/\b(?:let|const|var)\b/.test(c))add('variable','A named place that stores a value; const prevents reassignment while let allows it.');
  if(/\bfunction\b|=>/.test(c))add('function','A reusable block of JavaScript code that can receive inputs and return a result.');
  if(/\bPromise\b|\bawait\b/.test(c))add('Promise / await','A Promise represents future asynchronous work; await waits for it inside an async function.');
  if(/\bfetch\s*\(/.test(c))add('fetch','The browser API used to make an HTTP request.');
  if(/addEventListener\s*\(/.test(c))add('event listener','A function registered to run when an event such as a click or input happens.');
  if(/document\.|querySelector/.test(c))add('DOM','The browser’s object model for reading and changing elements on a web page.');
 }
 if(lang==='cpp'){
  if(/\bstd::/.test(c))add('std::','The prefix for names from C++’s standard library namespace.');
  if(/\bvector\s*</.test(c))add('vector','A resizable C++ array that stores elements in order.');
  if(/\b(?:unordered_map|map)\s*</.test(c))add('map','A key-value container used to find values by key.');
  if(/\bconst\b/.test(c))add('const','Marks a value or reference as not changeable through that name.');
  if(/[A-Za-z_]\w*\s*\*/.test(c))add('pointer','A value that stores a memory address, usually the address of another object/value.');
 }
 if(lang==='sql'){
  if(/\bSELECT\b/i.test(c))add('SELECT','Chooses the columns or calculated values a query should return.');
  if(/\bWHERE\b/i.test(c))add('WHERE','Filters rows before they are returned or grouped.');
  if(/\bJOIN\b/i.test(c))add('JOIN','Combines related rows from two data sources using a matching condition.');
  if(/\bGROUP\s+BY\b/i.test(c))add('GROUP BY','Collects rows into groups so aggregate calculations can be performed per group.');
  if(/\bHAVING\b/i.test(c))add('HAVING','Filters groups after GROUP BY and aggregate calculations.');
  if(/\bORDER\s+BY\b/i.test(c))add('ORDER BY','Sorts the rows in the query result.');
  if(/\bNULL\b/i.test(c))add('NULL','A database marker meaning a value is missing or unknown.');
 }
 if(lang==='html'){
  if(/<[^>]+>/.test(c))add('HTML element','A piece of page structure written with a tag, such as <p> or <button>.');
  if(/\bclass=/.test(c))add('class attribute','A reusable label used mainly by CSS and JavaScript to find/style elements.');
  if(/\bid=/.test(c))add('id attribute','A page-wide identifier intended to uniquely name one element.');
 }
 if(lang==='css'){
  if(/display\s*:\s*flex/i.test(c))add('Flexbox','A one-dimensional CSS layout system for arranging items in a row or column.');
  if(/display\s*:\s*grid/i.test(c))add('Grid','A CSS layout system for arranging content in rows and columns.');
  if(/@media/i.test(c))add('media query','A CSS rule that applies styles only when a condition such as screen width matches.');
 }
 return terms.slice(0,16);}
function syntaxUsedEntries(code,lang){
 var c=text(code),entries=[];
 function add(name,syntax,what,used,why){if(entries.some(function(x){return x.name===name;}))return;entries.push({name:name,syntax:syntax,what:what,used:used,why:why});}
 if(lang==='python'){
  var m;
  if((m=c.match(/\[[^\n\]]*\bfor\b[^\n\]]*\bin\b[^\n\]]*\]/)))add('List comprehension','[expression for item in iterable]','Builds a new list by evaluating an expression for each item, optionally with a filter.','This example uses '+m[0].trim()+'.','It is used here because the same transformation must be applied to several values and all results are needed as one list.');
  if((m=c.match(/\([^()\n]*\bfor\b[^()\n]*\bin\b[^()\n]*\)/)))add('Generator expression','(expression for item in iterable)','Produces values one at a time instead of creating the whole result list immediately.','This example uses '+m[0].trim()+'.','It is used here when the values can be consumed one by one, avoiding an unnecessary full intermediate list.');
  if(/\byield\b/.test(c))add('Generator function','def name(...): ... yield value','A function containing `yield` produces one value, pauses, and continues later when the next value is requested.','This example uses `yield` inside a function.','It is used here so the function can produce a sequence lazily instead of building every result before returning.');
  if(/(^|\n)\s*for\s+.+\s+in\s+.+:/m.test(c))add('for loop','for item in iterable:','Repeats the indented block once for each item in an iterable.','This example loops through the shown collection or range.','It is used here because the same work needs to happen for each item.');
  if(/(^|\n)\s*while\s+.+:/m.test(c))add('while loop','while condition:','Repeats the indented block while its condition stays true.','This example keeps repeating until the shown condition becomes false.','It is used here because the number of repetitions depends on a changing condition rather than a fixed collection.');
  if(/(^|\n)\s*(?:async\s+)?def\s+\w+\s*\(/m.test(c))add('Function definition','def name(parameters):','Creates a reusable block of code that can receive inputs and return a result.','This example defines and later uses a function.','It is used here to give a repeated piece of behavior a name and make it reusable/testable.');
  if(/(^|\n)\s*(?:if|elif)\s+.+:/m.test(c))add('Conditional','if condition:','Runs a block only when its condition is true; `elif`/`else` handle other cases.','This example checks the shown condition before choosing what code runs.','It is used here because the program needs different behavior for different values or states.');
  if(/\.join\s*\(/.test(c))add('`join()`','"separator".join(iterable)','Combines multiple strings into one string, placing the separator between them.','This example calls `.join(...)` on the separator shown in the code.','It is used here because several string values need to become one formatted string.');
  if(/\.strip\s*\(/.test(c))add('`strip()`','text.strip()','Removes whitespace from the beginning and end of a string.','This example calls `.strip()` on a string before using it further.','It is used here to clean surrounding spaces so later comparisons, parsing, or output use the intended text.');
  if(/\bset\s*\(/.test(c))add('`set()`','set(iterable)','Creates a set, which keeps unique values and supports membership checks.','This example converts the shown iterable with `set(...)`.','It is used here when duplicates should be removed or membership should be checked efficiently.');
  if(/\blen\s*\(/.test(c))add('`len()`','len(value)','Returns how many items are in a collection or characters are in a string.','This example calls `len(...)` on the shown value.','It is used here because the program needs the size/count rather than the individual items themselves.');
  if(/\.append\s*\(/.test(c))add('`append()`','list.append(value)','Adds one value to the end of an existing list.','This example calls `.append(...)` on a list.','It is used here because the result list is being built one item at a time.');
  if(/\.get\s*\(/.test(c))add('Dictionary `get()`','dictionary.get(key, default)','Reads a dictionary value safely and can return a default when the key is missing.','This example calls `.get(...)` on a dictionary.','It is used here to read a key without needing a separate existence check or risking a missing-key error.');
  if(/\benumerate\s*\(/.test(c))add('`enumerate()`','for index, value in enumerate(iterable):','Produces both the index and value while looping over an iterable.','This example wraps an iterable with `enumerate(...)`.','It is used here because the code needs each item together with its position.');
  if(/\brange\s*\(/.test(c))add('`range()`','range(start, stop, step)','Produces a sequence of integer values for looping.','This example uses `range(...)` to control loop values.','It is used here because the loop needs a predictable sequence of integer positions or counts.');
  if(/\bsorted\s*\(/.test(c))add('`sorted()`','sorted(iterable)','Returns a new list containing the iterable items in sorted order.','This example passes the shown values to `sorted(...)`.','It is used here because the result needs a predictable order without changing the original collection in place.');
  if(/\/\//.test(c))add('Floor division `//`','a // b','Divides and rounds the result down to the next lower integer.','This example uses `//` in its numeric calculation.','It is used here because the calculation needs a whole-number group/index rather than a decimal quotient.');
  if(/(^|[^%])%([^=]|$)/.test(c))add('Modulo `%`','a % b','Returns the remainder after division.','This example uses `%` in its numeric calculation.','It is used here to wrap or map a value into a limited repeating range, or to test divisibility.');
  if(/\bis\b/.test(c))add('Identity operator `is`','a is b','Checks whether two names refer to the exact same object, not merely equal values.','This example compares two references with `is`.','It is used here because the example cares about object identity rather than value equality.');
  if(/\[[^\]\n]*:[^\]\n]*\]/.test(c))add('Slicing','sequence[start:stop:step]','Selects a portion of a sequence without manually looping through every selected position.','This example uses slice notation inside square brackets.','It is used here because only a specific range or pattern of sequence items is needed.');
  if(/\bf["'][^\n]*\{[^}]+\}/.test(c))add('f-string','f"text {expression}"','Builds a string and inserts evaluated Python expressions inside `{...}`.','This example uses an f-string to place values into text.','It is used here to create readable output without manually concatenating and converting each value.');
  if(/(^|\n)\s*(?:from\s+\S+\s+import|import\s+)/m.test(c))add('Import','import module  /  from module import name','Makes code from another Python module available in the current file.','This example imports the module or names shown at the top of the code.','It is used here because the example needs functionality that is not defined locally.');
  if(entries.length<2&&/(^|\n)\s*[A-Za-z_]\w*\s*=\s*[^=]/m.test(c))add('Assignment','name = value','Stores or binds the value on the right to the name on the left.','This example assigns values to variables before using them.','It is used here to keep intermediate data/results available for later lines.');
  if(entries.length<2&&/\bprint\s*\(/.test(c))add('`print()`','print(value1, value2, ...)','Displays the supplied values in the program output.','This example calls `print(...)` to show its result.','It is used here so you can observe and verify what the program calculated.');
 }
 if(lang==='javascript'||lang==='typescript'){
  if(/\b(?:const|let)\s+\w+/.test(c))add('Variable declaration','const name = value  /  let name = value','Declares a JavaScript/TypeScript variable. `const` prevents reassignment; `let` allows it.','This example declares values with `const` or `let`.','It is used here to name data that later expressions or functions need.');
  if(/=>/.test(c))add('Arrow function','(parameters) => expression','Defines a compact function expression.','This example uses `=>` to define callback or reusable behavior.','It is used here because another operation needs a function to run for each value/event.');
  if(/\.(map|filter|reduce)\s*\(/.test(c)){var mm=c.match(/\.(map|filter|reduce)\s*\(/),method=mm&&mm[1]||'map';var what={map:'creates a new array by transforming each item',filter:'creates a new array containing only items that pass a test',reduce:'combines many items into one accumulated result'}[method];add('Array `'+method+'()`','array.'+method+'(callback)',what.charAt(0).toUpperCase()+what.slice(1)+'.','This example calls `.'+method+'(...)` on an array.','It is used here because the code needs to '+what+'.');}
  if(/\basync\b|\bawait\b/.test(c))add('`async` / `await`','async function name(){ const result = await operation(); }','Writes asynchronous code in a readable step-by-step style.','This example waits for an asynchronous operation with `await`.','It is used here because the result arrives later, such as from a request or other asynchronous task.');
  if(/\bfetch\s*\(/.test(c))add('`fetch()`','fetch(url, options)','Starts an HTTP request from JavaScript.','This example calls `fetch(...)` with the shown URL/options.','It is used here because the program needs data or an action from another web endpoint.');
  if(/addEventListener\s*\(/.test(c))add('Event listener','element.addEventListener("event", handler)','Runs a handler when a browser event happens.','This example registers a handler for the shown event.','It is used here because the code should react to user/browser activity instead of running only once at page load.');
  if(entries.length<2&&/\bconsole\.log\s*\(/.test(c))add('`console.log()`','console.log(value)','Writes a value to the browser/developer console.','This example logs its result.','It is used here so the result can be inspected while learning or debugging.');
 }
 if(lang==='sql'){
  if(/\bSELECT\b/i.test(c))add('`SELECT`','SELECT columns FROM table','Chooses which columns or expressions a query returns.','This query uses `SELECT` for the values shown after it.','It is used here because those are the fields/calculations the question wants in the result.');
  if(/\bWHERE\b/i.test(c))add('`WHERE`','SELECT ... FROM ... WHERE condition','Filters individual rows before they are returned or grouped.','This query uses `WHERE` with the shown condition.','It is used here because only rows meeting that condition should participate.');
  if(/\bJOIN\b/i.test(c))add('`JOIN`','FROM left JOIN right ON matching_condition','Combines related rows from two tables/data sources.','This query joins the shown sources using its `ON` condition.','It is used here because the requested result needs columns/data that live in separate related sources.');
  if(/\bGROUP\s+BY\b/i.test(c))add('`GROUP BY`','GROUP BY column1, column2','Collects rows into groups so aggregates can be calculated for each group.','This query groups rows by the shown column(s).','It is used here because the result needs one summary per group rather than one row per original record.');
  if(/\b(?:COUNT|SUM|AVG|MIN|MAX)\s*\(/i.test(c))add('Aggregate function','COUNT(...), SUM(...), AVG(...), ...','Combines values from multiple rows into a summary value.','This query uses the aggregate function shown in `SELECT`.','It is used here because the question asks for a count, total, average, minimum, or maximum across multiple rows.');
  if(/\bOVER\s*\(/i.test(c))add('Window function','function(...) OVER (PARTITION BY ... ORDER BY ...)','Calculates across related rows while keeping the original rows in the result.','This query uses `OVER(...)` to define the calculation window.','It is used here because the calculation needs group/ordering context without collapsing rows like `GROUP BY` would.');
  if(/\bWITH\s+\w+\s+AS\s*\(/i.test(c))add('CTE (`WITH`)','WITH name AS (query) SELECT ...','Names a temporary query result that a following query can read.','This query defines a CTE with `WITH ... AS (...)`.','It is used here to separate a multi-stage query into clearer reusable steps.');
  if(/\bORDER\s+BY\b/i.test(c))add('`ORDER BY`','ORDER BY column ASC|DESC','Sorts the final result rows.','This query orders by the shown column/expression.','It is used here because the output needs a predictable ranking or order.');
 }
 if(lang==='cpp'||lang==='java'){
  if(lang==='cpp'&&/\b(?:std::)?vector\s*</.test(c))add('`vector`','vector<Type> name;','Creates a resizable ordered C++ sequence.','This example declares a vector with the shown element type.','It is used here because the number of elements can vary while indexed/ordered access is still useful.');
  if(/\bfor\s*\(/.test(c)||/\bfor\s*\([^;:]+:[^)]+\)/.test(c))add('`for` loop','for (initialization; condition; update) { ... }','Repeats a block using the loop rule in the header.','This example uses a `for` loop to process repeated values/steps.','It is used here because the same operation must run multiple times.');
  if(/\bif\s*\(/.test(c))add('Conditional','if (condition) { ... }','Runs code only when its condition is true.','This example checks the shown condition before choosing behavior.','It is used here because different input/state cases require different actions.');
  if(lang==='cpp'&&/\b(?:unordered_map|map)\s*</.test(c))add('Map container','unordered_map<Key, Value> / map<Key, Value>','Stores values by keys.','This example declares a map-like container with key and value types.','It is used here because values need to be found or updated by key rather than by numeric position.');
  if(lang==='cpp'&&/\bcout\s*<</.test(c))add('Stream output','cout << value;','Sends values to standard output using the stream insertion operator `<<`.','This example writes its result with `cout`.','It is used here so you can see and verify the program result.');
  if(/\bclass\s+\w+/.test(c))add('Class','class Name { ... };','Defines a custom type that groups related state and behavior.','This example defines the shown class.','It is used here because the example models data and operations that belong together.');
 }
 if(lang==='shell'){
  if(/\|/.test(c))add('Pipe `|`','command1 | command2','Sends the output of one command directly into the next command.','This example connects commands with `|`.','It is used here because the next command should process the previous command’s output without an intermediate file.');
  if(/(?:^|\s)-{1,2}[A-Za-z0-9]/m.test(c))add('Command option / flag','command --option  /  command -x','Changes how a command behaves.','This example passes the shown flag(s) after a command.','They are used here to request the specific behavior/output needed by the task.');
  if(/>>?|<\s*\S+/.test(c))add('Redirection','command > file  /  command >> file','Sends command output to a file (or reads input from a file) instead of using the terminal normally.','This example uses a shell redirection operator.','It is used here because the command result/input needs to come from or go to a file.');
  var cm=(c.trim().match(/^([A-Za-z][\w.-]*)\b/m)||[])[1];if(cm)add('Command','command arguments options','Runs a command-line program followed by the values/options it needs.','This example invokes `'+cm+'` with the shown arguments.','It is used here because `'+cm+'` performs the operation being demonstrated.');
 }
 if(lang==='html'){
  if(/<\/?[A-Za-z][^>]*>/.test(c))add('HTML element','<tag>content</tag>','Creates a piece of document structure or content.','This example uses the shown HTML tags to build the page structure.','They are used here because each kind of content/control needs the appropriate semantic element.');
  if(/\b(?:class|id)=/.test(c))add('HTML attributes','<tag class="name" id="unique">','Adds metadata/configuration to an element.','This example gives elements `class` and/or `id` attributes.','They are used here so CSS, JavaScript, links, labels, or accessibility logic can identify the element.');
 }
 if(lang==='css'){
  if(/(^|\n)\s*[.#A-Za-z][^\n{]*\{/m.test(c))add('CSS selector','selector { property: value; }','Chooses which HTML elements a style rule applies to.','This example uses the selector written before `{`.','It is used here to target only the elements that should receive these styles.');
  if(/\b[\w-]+\s*:\s*[^;{}]+;?/.test(c))add('CSS declaration','property: value;','Assigns a style value to a CSS property.','This example contains the shown property/value declarations.','They are used here to control the visual/layout behavior of the selected elements.');
  if(/display\s*:\s*(?:flex|grid)/i.test(c))add('Layout mode','display: flex;  /  display: grid;','Turns an element into a Flexbox or Grid layout container.','This example sets `display` to the shown layout mode.','It is used here because the child elements need controlled alignment/rows/columns rather than normal document flow.');
 }
 if(lang==='dockerfile'){
  if(/^FROM\s+/m.test(c))add('`FROM`','FROM image:tag','Chooses the base image the new container image starts from.','This Dockerfile starts with the shown base image.','It is used here because every image needs a starting filesystem/runtime environment.');
  if(/^RUN\s+/m.test(c))add('`RUN`','RUN command','Executes a command while the image is being built.','This Dockerfile runs the shown build/install command.','It is used here because dependencies/filesystem setup must be baked into the image.');
  if(/^COPY\s+/m.test(c))add('`COPY`','COPY source destination','Copies files from the build context into the image.','This Dockerfile copies the shown source into the image path.','It is used here because the application/configuration files must exist inside the built image.');
  if(/^(?:CMD|ENTRYPOINT)\s+/m.test(c))add('Startup command','CMD [...]  /  ENTRYPOINT [...]','Defines what command runs when a container starts.','This Dockerfile supplies the shown startup command.','It is used here so the container automatically launches the intended application/process.');
 }
 if(lang==='json'){
  if(/\{/.test(c))add('JSON object','{"key": value}','Stores named key-value fields.','This example uses `{...}` with quoted keys.','It is used here because the data has named properties rather than only positional values.');
  if(/\[/.test(c))add('JSON array','[value1, value2, ...]','Stores an ordered list of JSON values.','This example uses `[...]` for multiple ordered values.','It is used here because several values belong together as a sequence.');
 }
 if(lang==='yaml'){
  if(/(^|\n)\s*[\w.-]+\s*:/m.test(c))add('YAML key/value','key: value','Defines a named configuration field; indentation can nest fields beneath a parent.','This example uses the shown `key: value` fields.','They are used here to describe configuration in a readable hierarchical format.');
  if(/(^|\n)\s*-\s+/.test(c))add('YAML sequence item','- value','Adds one item to a YAML list/sequence.','This example uses lines beginning with `-`.','It is used here because the configuration needs multiple ordered/repeated items under one field.');
 }
 return entries.slice(0,6);
}
function syntaxUsedHtml(code,lang){var entries=syntaxUsedEntries(code,lang);if(!entries.length)return'';return '<section class="csai-syntax-used"><b>Syntax used</b><p class="csai-syntax-used-intro">Only the important syntax that appears in this example.</p><div class="csai-syntax-used-list">'+entries.map(function(x){return'<article><strong>'+esc(x.name)+'</strong><p>'+esc(x.what)+'</p><p><b>Syntax:</b> <code>'+esc(x.syntax)+'</code></p><p><b>Used here:</b> '+esc(x.used)+'</p><p><b>Why here:</b> '+esc(x.why)+'</p></article>';}).join('')+'</div></section>';}
function glossaryHtml(code,lang){var terms=glossaryTerms(code,lang);if(!terms.length)return'';return '<div class="csai-term-glossary"><b>What the unfamiliar terms mean</b><dl>'+terms.map(function(x){return'<div><dt><code>'+esc(x.term)+'</code></dt><dd>'+esc(x.meaning)+'</dd></div>';}).join('')+'</dl></div>';}
function explanationHtml(code,lang){var lineCount=text(code).split(/\r?\n/).length;return '<details class="csai-line-explanation" data-csai-line-explanation><summary><span>Line-by-line explanation</span><span class="csai-line-count">'+lineCount+' lines</span></summary><div class="csai-line-lazy" data-csai-line-lazy>Open this section to build the explanation.</div><div data-csai-commented-code-host></div><div data-csai-syntax-used-host></div><div data-csai-term-host></div><ol data-csai-line-list></ol></details>';}


function addStyle(){if(document.getElementById('csai-line-by-line-style'))return;var s=document.createElement('style');s.id='csai-line-by-line-style';s.textContent='\
.csai-line-explanation{margin-top:14px;padding:12px 16px;border-top:1px solid var(--border);background:color-mix(in srgb,var(--panel) 96%,var(--bg));color:var(--text)}.csai-line-explanation>summary{display:flex;align-items:center;justify-content:space-between;gap:14px;cursor:pointer;font-weight:900;font-size:.96rem;list-style-position:inside}.csai-line-count{font-size:.72rem;font-weight:800;color:var(--muted);white-space:nowrap}.csai-line-explanation>ol{list-style:none;margin:10px 0 0;padding:0}.csai-line-lazy{margin:10px 0 0;color:var(--muted);font-size:.78rem}.csai-commented-code{margin:12px 0 4px;padding:12px;border:1px solid var(--border);border-radius:10px;background:var(--bg)}.csai-commented-code-title{font-weight:900}.csai-commented-code-note{margin:4px 0 9px;color:var(--muted);font-size:.76rem;line-height:1.45}.csai-commented-code pre{margin:0;padding:11px 12px;border:1px solid color-mix(in srgb,var(--border) 72%,transparent);border-radius:9px;background:color-mix(in srgb,var(--panel) 96%,var(--bg));overflow:auto}.csai-commented-code code{white-space:pre;font:650 12.5px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace}.csai-syntax-used{margin:12px 0 4px;padding:12px;border:1px solid var(--border);border-radius:10px;background:var(--bg)}.csai-syntax-used>b{display:block}.csai-syntax-used-intro{margin:3px 0 10px;color:var(--muted);font-size:.76rem}.csai-syntax-used-list{display:grid;gap:9px}.csai-syntax-used-list article{padding:9px 10px;border:1px solid color-mix(in srgb,var(--border) 72%,transparent);border-radius:9px;background:color-mix(in srgb,var(--panel) 96%,var(--bg))}.csai-syntax-used-list strong{display:block;margin-bottom:4px}.csai-syntax-used-list p{margin:3px 0;line-height:1.45;font-size:.82rem}.csai-syntax-used-list code{font-size:.78rem}.csai-term-glossary{margin:12px 0 4px;padding:12px;border:1px solid var(--border);border-radius:10px;background:var(--bg)}.csai-term-glossary>b{display:block;margin-bottom:8px}.csai-term-glossary dl{display:grid;gap:8px;margin:0}.csai-term-glossary dl>div{display:grid;grid-template-columns:minmax(90px,150px) 1fr;gap:10px;align-items:start}.csai-term-glossary dt,.csai-term-glossary dd{margin:0}.csai-term-glossary dd{color:var(--muted);line-height:1.5}@media(max-width:620px){.csai-term-glossary dl>div{grid-template-columns:1fr}}.csai-line-item{margin:0;padding:12px 0 14px;border-bottom:1px solid color-mix(in srgb,var(--border) 72%,transparent);line-height:1.5}.csai-line-item:last-child{border-bottom:0}.csai-line-item.is-blank{padding:8px 0;opacity:.72}.csai-line-code{display:flex;align-items:flex-start;gap:9px;flex-wrap:wrap;margin-bottom:5px}.csai-line-number{display:inline-flex;flex:0 0 auto;padding:3px 7px;border-radius:999px;background:var(--pill);color:var(--pilltext);font-size:.68rem;font-weight:900}.csai-line-code code{white-space:pre-wrap;overflow-wrap:anywhere;font:650 12.5px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace}.csai-line-blank-note{color:var(--muted);font-size:.75rem}.csai-line-purpose{max-width:820px;margin:0;color:var(--text);line-height:1.5;font-size:.92rem}.csai-line-syntax{max-width:820px;margin-top:6px;color:var(--muted)}.csai-line-syntax>summary{cursor:pointer;width:max-content;font-size:.78rem;font-weight:850;color:var(--muted)}.csai-line-syntax>ul{margin:7px 0 0;padding-left:20px}.csai-line-syntax li{margin:5px 0;line-height:1.55}.csai-example-explain[data-csai-replaced-by-line],.evergreen-explain[data-csai-replaced-by-line],.csai-study-explain[data-csai-generic-hidden="1"],.adaptive-explain[data-csai-generic-hidden="1"]{display:none!important}\
';document.head.appendChild(s);}

function codeFrom(node){if(!node)return'';return 'value' in node?text(node.value):text(node.textContent);}
function languageLabel(node,container){var label='';if(node&&node.getAttribute){label=text(node.getAttribute('data-language')||node.getAttribute('data-lang'));if(label)return label;}if(container){var n=container.querySelector('.lesson-run-lang,.csai-study-kind,.evergreen-example-head span,[data-lang-variant],[data-project-lang],[data-file-label],.cx-pm-field-label,.wd-file-name');label=n?text((n.value||n.textContent)||(n.getAttribute&&n.getAttribute('data-lang-variant'))):'';}return label;}
function isReference(node){return node&&node.getAttribute&&node.getAttribute('data-reference-only')==='true';}
function isWrittenResponse(node){if(!node||!node.matches)return false;if(node.matches('.oa-answer,[aria-label*="reasoning" i],[aria-label*="answer notes" i],[aria-label*="interview answer" i],[placeholder*="own words" i],[placeholder*="write your answer" i]'))return true;var task=node.closest('.oa-task');return !!(task&&node.matches('[data-editor]')&&!node.matches('.oa-editor')&&!task.querySelector('[data-run],[data-csai-oa-python-run]'));}
function isCodeWorkspace(node){if(!node||isWrittenResponse(node))return false;if(node.matches&&node.matches('pre.code,[data-csai-language-generated],.csai-language-code'))return true;if(!('value' in node))return false;if(node.matches('[data-project-editor],[data-dual-editor],.csai-code-editor,.csai-study-code,.evergreen-editor,.adaptive-code,.oa-editor,[data-evergreen-code]'))return true;if(node.matches('textarea[aria-label="Code editor" i],textarea[aria-label="SQL query editor" i],textarea[aria-label="HTML editor" i],textarea[aria-label="CSS editor" i],textarea[aria-label="JavaScript editor" i],textarea[aria-label="Git command" i]'))return true;if(node.matches('textarea.wd-edit,textarea.cx-pm-edit')){var a=text(node.getAttribute('aria-label')).toLowerCase();return /code editor|sql|html|css|javascript|git command|terminal/.test(a)||!!node.closest('[data-project-workspace],.project-card,.wd-project,.workspace');}if(node.matches('textarea.py[readonly]'))return true;if(node.matches('textarea.answer')){if(node.getAttribute('data-language'))return true;var v=codeFrom(node).trim();return !!v&&inferLanguage(v,'',node)!=='text';}if(node.matches('textarea.cx-projfb-edit')){var c=codeFrom(node).trim();return !!c&&inferLanguage(c,'',node)!=='text';}return false;}
function containerFor(node){return node.closest('.csai-study-example,.lesson-run-card,.evergreen-example,.csai-lang-variant,.csai-example-card,.adaptive-panel,.oa-work,.oa-task,.project-card,[data-project-workspace],.wd-project,.wd-card,.cx-pm-card,.workspace,.editor-shell,.item[data-exercise],.item')||node.parentElement;}
function editorId(node){if(!node)return'';if(!node.getAttribute('data-csai-line-editor-id'))node.setAttribute('data-csai-line-editor-id','line-editor-'+(++editorSeq));return node.getAttribute('data-csai-line-editor-id');}
function ownedBlocks(container,id){if(!container||!id)return[];return Array.from(container.querySelectorAll('[data-csai-line-explanation][data-csai-line-owner="'+id+'"]'));}
function suppressDuplicateExplanations(container){if(!container)return;container.querySelectorAll('.csai-example-explain').forEach(function(n){n.setAttribute('data-csai-replaced-by-line','1');});container.querySelectorAll('.evergreen-explain').forEach(function(n){n.setAttribute('data-csai-replaced-by-line','1');});container.querySelectorAll(':scope > .csai-study-explain,:scope > .adaptive-explain').forEach(function(n){n.setAttribute('data-csai-generic-hidden','1');});}
function insertBlock(node,container,html,id){suppressDuplicateExplanations(container);var wrap=document.createElement('div');wrap.innerHTML=html;var block=wrap.firstElementChild;block.setAttribute('data-csai-line-owner',id);var anchor=node.closest('.csai-editor-shell,.wd-editor-shell,.cx-pm-editor-shell')||node;anchor.insertAdjacentElement('afterend',block);return block;}
function dedupeOwned(container,id,keep){var blocks=ownedBlocks(container,id),chosen=keep&&keep.isConnected?keep:(blocks[0]||null);blocks.forEach(function(b){if(b!==chosen)b.remove();});return chosen;}
function renderLazyBlock(block){if(!block||block.dataset.csaiLineRendered==='1')return;var code=block.__csaiCode||'',lang=block.__csaiLang||inferLanguage(code,'',null),list=block.querySelector('[data-csai-line-list]'),host=block.querySelector('[data-csai-term-host]'),syntaxHost=block.querySelector('[data-csai-syntax-used-host]'),commentHost=block.querySelector('[data-csai-commented-code-host]'),lazy=block.querySelector('[data-csai-line-lazy]');if(commentHost)commentHost.innerHTML=commentedCodeHtml(code,lang);if(syntaxHost)syntaxHost.innerHTML=syntaxUsedHtml(code,lang);if(host)host.innerHTML=glossaryHtml(code,lang);if(list)list.innerHTML=listHtml(code,lang);if(lazy)lazy.remove();block.dataset.csaiLineRendered='1';}
function refreshNode(node){if(!node||!node.isConnected)return;var container=containerFor(node),existingId=node.getAttribute&&node.getAttribute('data-csai-line-editor-id');if(!container)return;if(!isCodeWorkspace(node)){if(existingId)ownedBlocks(container,existingId).forEach(function(b){b.remove();});if(node.removeAttribute){node.removeAttribute('data-csai-line-covered');node.removeAttribute('data-csai-line-language');}return;}var code=codeFrom(node),id=editorId(node);if(!code.trim()){ownedBlocks(container,id).forEach(function(b){b.remove();});return;}var lang=inferLanguage(code,languageLabel(node,container),node),current=ownedBlocks(container,id)[0],wasOpen=!!(current&&current.open),html=explanationHtml(code,lang);suppressDuplicateExplanations(container);var rendered;if(current){var wrap=document.createElement('div');wrap.innerHTML=html;rendered=wrap.firstElementChild;rendered.setAttribute('data-csai-line-owner',id);current.replaceWith(rendered);}else rendered=insertBlock(node,container,html,id);rendered.__csaiCode=code;rendered.__csaiLang=lang;if(wasOpen){rendered.open=true;renderLazyBlock(rendered);}dedupeOwned(container,id,rendered);node.setAttribute('data-csai-line-covered','1');node.setAttribute('data-csai-line-language',lang);container.setAttribute('data-csai-line-covered','1');}
function targetNodes(root){root=root||document;var selectors=[
 '.lesson .csai-study-example textarea.csai-study-code','.lesson .csai-study-example pre','.lesson .csai-study-example textarea','.lesson .lesson-run-card pre.code','.lesson .evergreen-example textarea.evergreen-editor','.lesson .csai-lang-variant [data-csai-language-generated]','.lesson .csai-lang-variant .csai-language-code','.lesson pre.code','.lesson .adaptive-panel textarea.adaptive-code',
 'textarea[data-project-editor]','textarea[data-dual-editor]','textarea.csai-code-editor','textarea[data-evergreen-code]','textarea.oa-editor[data-editor]','textarea[aria-label="Code editor" i]','textarea[aria-label="SQL query editor" i]','textarea[aria-label="HTML editor" i]','textarea[aria-label="CSS editor" i]','textarea[aria-label="JavaScript editor" i]','textarea[aria-label="Git command" i]','textarea.answer','textarea.py[readonly]','textarea.wd-edit','textarea.cx-pm-edit','textarea.cx-projfb-edit'
 ];var seen=new Set(),nodes=[];if(root.nodeType===1&&isCodeWorkspace(root))nodes.push(root);if(root.querySelectorAll)nodes=nodes.concat(Array.from(root.querySelectorAll(selectors.join(','))));return nodes.filter(function(n){if(seen.has(n)||!isCodeWorkspace(n))return false;seen.add(n);return true;});}
function enhance(root){addStyle();targetNodes(root).forEach(refreshNode);}
function schedule(node){if(!isCodeWorkspace(node)&&!(node&&node.getAttribute&&node.getAttribute('data-csai-line-editor-id')))return;clearTimeout(updateTimers.get(node));var t=setTimeout(function(){refreshNode(node);updateTimers.delete(node);},120);updateTimers.set(node,t);}

window.CSAILineExplainer={version:VERSION,inferLanguage:inferLanguage,explain:explain,listHtml:listHtml,commentedCode:commentedCode,commentedCodeHtml:commentedCodeHtml,explanationHtml:explanationHtml,quickPurpose:quickPurposeFor,glossaryTerms:glossaryTerms,glossaryHtml:glossaryHtml,syntaxUsedEntries:syntaxUsedEntries,syntaxUsedHtml:syntaxUsedHtml,refresh:refreshNode,enhance:enhance,isCodeWorkspace:isCodeWorkspace,targetNodes:targetNodes};

function initialEnhance(){addStyle();var lessons=Array.from(document.querySelectorAll('.lesson'));/* v5.60: scrolling past a closed lesson must not build explanation UI. */lessons.filter(function(x){return x.open;}).forEach(enhance);}
function boot(){initialEnhance();document.addEventListener('focusin',function(e){if(e.target&&isCodeWorkspace(e.target))refreshNode(e.target);},true);document.addEventListener('click',function(e){var n=e.target&&e.target.closest&&e.target.closest('pre.code,[data-csai-language-generated],.csai-language-code');if(n&&isCodeWorkspace(n))refreshNode(n);},true);document.addEventListener('toggle',function(e){if(e.target&&e.target.matches&&e.target.matches('.lesson')&&e.target.open)enhance(e.target);var block=e.target&&e.target.matches&&e.target.matches('[data-csai-line-explanation]')?e.target:null;if(block&&block.open)renderLazyBlock(block);},true);document.addEventListener('input',function(e){if(e.target&&(isCodeWorkspace(e.target)||(e.target.getAttribute&&e.target.getAttribute('data-csai-line-editor-id'))))schedule(e.target);},true);var pending=new Set(),flushTimer=0;new MutationObserver(function(records){records.forEach(function(r){Array.from(r.addedNodes||[]).forEach(function(n){if(n&&n.nodeType===1&&!n.matches('[data-csai-line-explanation],.csai-line-item,.csai-term-glossary'))pending.add(n);});});if(!pending.size)return;clearTimeout(flushTimer);flushTimer=setTimeout(function(){var batch=Array.from(pending);pending.clear();batch.forEach(function(n){enhance(n);});},40);}).observe(document.documentElement,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
