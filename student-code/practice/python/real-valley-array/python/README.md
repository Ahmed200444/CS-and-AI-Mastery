# Valley Array — Python

**Course:** Python  
**Type:** Practice / Exercise  
**Language:** Python

## Task

Check whether an array strictly decreases to one interior minimum and then strictly increases. The minimum cannot be the first or last element.

## Solution

`solution.py` first walks down the decreasing side, verifies that a real valley exists, then walks up the increasing side. It succeeds only if the second walk reaches the end.

## Complexity

- Time: `O(n)`
- Extra space: `O(1)`

## How to run

```bash
python solution.py
```
