# Number-guessing game

> A CLI game that picks a random number and gives higher/lower hints until the user guesses it.

## Overview
A CLI game that picks a random number and gives higher/lower hints until the user guesses it. This project applies concepts from **Python** in a working implementation. Latest measured project checks: **10 / 14 passed**.

## Tech stack
- **Primary language:** Python
- **Detected dependencies/modules:** `random`
- **Learning context:** Python · CS & AI Mastery

## What this project demonstrates
- Complete the project implementation
- Validate the important behavior
- Handle realistic edge cases

## Implementation snapshot
- **Main file:** `number-guessing-game.py`
- **Non-empty code lines:** 26
- **Detected functions:** 2
- **Detected classes/components:** 0

## Architecture
The main implementation lives in `number-guessing-game.py`. Detected functions include `get_guess`, `play_game`. The README describes only evidence visible in the current project workspace.

## How to run
```bash
python number-guessing-game.py
```

## Assessment and validation
### Core implementation

**Status:** 2 / 3 passed

- ✅ Starter replaced
- ✅ Substantial implementation
- ❌ Run / check succeeds

### Feature coverage

**Status:** 2 / 3 passed

- ❌ Core still passes
- ✅ Requirement evidence
- ✅ Feature-sized implementation

### Edge cases & robustness

**Status:** 3 / 4 passed

- ✅ Edge/control logic
- ✅ Error/test evidence
- ❌ Run / check succeeds
- ✅ No TODO placeholders

### Portfolio readiness

**Status:** 3 / 4 passed

- ✅ Requirements represented
- ✅ Non-trivial implementation
- ✅ Robustness evidence
- ❌ Clean final run

## Latest result
Latest captured browser result:

```text
Run error
Welcome to the Number Guessing Game!
I picked a number between 1 and 100.
Enter a number between 1 and 100: 60
Too high!
Enter a number between 1 and 100: 61
Too high!
Enter a number between 1 and 100: 
Please enter a whole number.

Traceback (most recent call last):
  File "<exec>", line 15, in <module>
  File "<course-project>", line 40, in <module>
  File "<course-project>", line 26, in play_game
  File "<course-project>", line 7, in get_guess
  File "<exec>", line 10, in _browser_input
EOFError: Input cancelled
```

## Engineering decisions
- Explicit error handling is present so failing paths are handled instead of silently ignored.

## Next improvements
- Address the remaining assessment check: Run / check succeeds.
- Address the remaining assessment check: Core still passes.
- Address the remaining assessment check: Clean final run.
- Add a dedicated automated test suite for normal, boundary, and failure cases.

## Course context
Built as part of **Python** in **CS & AI Mastery**. The README is regenerated from the current project workspace, requirements, runtime output, and measured project checks whenever it is previewed or published.
