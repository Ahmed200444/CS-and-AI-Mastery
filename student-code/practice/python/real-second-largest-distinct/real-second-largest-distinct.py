def solution(numbers):
    largest = None
    second_largest = None

    for number in numbers:
        if largest is None or number > largest:
            if number != largest:
                second_largest = largest
                largest = number
        elif number != largest and (second_largest is None or number > second_largest):
            second_largest = number

    return second_largest


if __name__ == "__main__":
    print(solution([10, 5, 8, 5, 8]))
