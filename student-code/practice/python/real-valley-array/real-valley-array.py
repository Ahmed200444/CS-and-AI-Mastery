def solution(numbers):
    if len(numbers) < 3:
        return False
    index = 1
    while index < len(numbers) and numbers[index] < numbers[index - 1]:
        index += 1
    if index == 1 or index == len(numbers):
        return False
    while index < len(numbers) and numbers[index] > numbers[index - 1]:
        index += 1
    return index == len(numbers)
