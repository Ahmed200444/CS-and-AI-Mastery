def solution(numbers: list[int]) -> int | None:
    """Return the second-largest distinct value, or None if it does not exist."""
    largest: int | None = None
    second: int | None = None

    for number in numbers:
        if largest is None or number > largest:
            if number != largest:
                second = largest
                largest = number
        elif number != largest and (second is None or number > second):
            second = number

    return second


if __name__ == "__main__":
    print(solution([10, 5, 8, 5, 8]))
