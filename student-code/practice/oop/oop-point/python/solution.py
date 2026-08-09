import math


class Point:
    def __init__(self, x: float, y: float) -> None:
        self.x = x
        self.y = y

    def dist_from_origin(self) -> float:
        """Return the Euclidean distance from this point to (0, 0)."""
        return math.hypot(self.x, self.y)


def make_dist(x: float, y: float) -> float:
    return Point(x, y).dist_from_origin()


if __name__ == "__main__":
    print(make_dist(3, 4))
