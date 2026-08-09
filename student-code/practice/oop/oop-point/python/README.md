# Point Distance — Python

**Course:** Object-Oriented Programming  
**Type:** Practice / Exercise  
**Language:** Python

## Task

Represent a point with `x` and `y` coordinates and calculate its Euclidean distance from the origin.

## Solution

`Point.__init__` stores the coordinates. `dist_from_origin()` uses `math.hypot(x, y)`, and `make_dist` creates a point and returns that distance.

## How to run

```bash
python solution.py
```

With `(3, 4)`, the printed distance is `5.0`.
