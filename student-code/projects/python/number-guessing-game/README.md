# Number-guessing game

> A CLI game that picks a random number and gives higher/lower hints until the user guesses it.

## Overview
A CLI game that picks a random number and gives higher/lower hints until the user guesses it. This project applies concepts from **Python** in a working implementation.

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
- **Non-empty code lines:** 27
- **Detected functions:** 2
- **Detected classes/components:** 0

## Architecture
The main implementation lives in `number-guessing-game.py`. Detected functions include `get_guess`, `play_game`. The README describes only evidence visible in the current project workspace.

## How to run
```bash
python number-guessing-game.py
```

## Validation
Validate the project with automated tests, representative inputs, edge cases, and a clean local run before publishing.

## Runtime result
Example runtime output:

```text
Output
Welcome to the Number Guessing Game!
I picked a number between 1 and 100.
Enter a number between 1 and 100: 50
Too low!
Enter a number between 1 and 100: 65
Too low!
Enter a number between 1 and 100: 70
Too low!
Enter a number between 1 and 100: 80
Too high!
Enter a number between 1 and 100: 75
Too low!
Enter a number between 1 and 100: 77
Too low!
Enter a number between 1 and 100: 78
Too low!
Enter a number between 1 and 100: 79
```

## Engineering decisions
- Explicit error handling is present so failing paths are handled instead of silently ignored.

## Next improvements
- Add a dedicated automated test suite for normal, boundary, and failure cases.

## Course context
Built as part of **Python** in **CS & AI Mastery**. This README is generated from the current project code and requirements.
