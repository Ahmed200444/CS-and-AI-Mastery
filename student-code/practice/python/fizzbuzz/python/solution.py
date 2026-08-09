def fizzbuzz(n: int) -> list[int | str]:
    """Return the FizzBuzz sequence from 1 through n."""
    result: list[int | str] = []

    for number in range(1, n + 1):
        if number % 15 == 0:
            result.append("FizzBuzz")
        elif number % 3 == 0:
            result.append("Fizz")
        elif number % 5 == 0:
            result.append("Buzz")
        else:
            result.append(number)

    return result


if __name__ == "__main__":
    print(fizzbuzz(15))
