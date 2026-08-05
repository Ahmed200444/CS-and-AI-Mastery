def solution(numbers):
    if len(numbers) < 3:
        return False

    lowest = numbers.index(min(numbers))

    if lowest == 0 or lowest == len(numbers) - 1:
        return False

    for i in range(lowest):
        if numbers[i] <= numbers[i + 1]:
            return False

    for i in range(lowest, len(numbers) - 1):
        if numbers[i] >= numbers[i + 1]:
            return False

    return True


    
    