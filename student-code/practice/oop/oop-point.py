import math

class Point:
    def _init_(self,x,y):
       self.x=x
       self.y=y

    def dist_from_origin(self):
        return math.sqrt(self.x**2 + self.y**2)


def make_dist(x, y):
    return Point(x,y).dist_from_origin()