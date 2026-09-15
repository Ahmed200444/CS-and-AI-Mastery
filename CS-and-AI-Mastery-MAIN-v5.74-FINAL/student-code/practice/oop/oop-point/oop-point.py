import math


class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def dist_from_origin(self):
        return math.hypot(self.x, self.y)


def make_dist(x, y):
    return Point(x, y).dist_from_origin()
