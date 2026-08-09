def two_sum(nums: list[int], target: int) -> list[int] | None:
    """Return indices of two values whose sum is target, or None if no pair exists."""
    seen: dict[int, int] = {}

    for index, number in enumerate(nums):
        complement = target - number
        if complement in seen:
            return [seen[complement], index]
        seen[number] = index

    return None


if __name__ == "__main__":
    print(two_sum([2, 7, 11, 15], 9))
