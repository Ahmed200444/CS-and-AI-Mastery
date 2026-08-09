def solution(numbers):
    if len(numbers) < 3:
        return False

    i = 1

    while i < len(numbers) and numbers[i] < numbers[i - 1]:
        i += 1

    if i == 1 or i == len(numbers):
        return False

    while i < len(numbers) and numbers[i] > numbers[i - 1]:
        i += 1

    return i == len(numbers)
