def total(nums):
    t = 0
    for n in nums:
        t = t + n
    return t

result = total([10, 20, 30])
print(result)