def solution(numbers: list[int]) -> bool:
    """Return True when values strictly fall to one interior minimum, then strictly rise."""
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


if __name__ == "__main__":
    print(solution([9, 7, 4, 2, 5, 8]))
