import random


def get_guess():
    while True:
        try:
            guess = int(input("Enter a number between 1 and 100: "))

            if 1 <= guess <= 100:
                return guess

            print("Please enter a number from 1 to 100.")

        except ValueError:
            print("Please enter a whole number.")


def play_game():
    secret_number = random.randint(1, 100)
    attempts = 0

    print("Welcome to the Number Guessing Game!")
    print("I picked a number between 1 and 100.")

    while True:
        guess = get_guess()
        attempts += 1

        if guess < secret_number:
            print("Too low!")
        elif guess > secret_number:
            print("Too high!")
        else:
            print(f"Correct! You guessed it in {attempts} attempts.")
            break


if __name__ == "__main__":
    play_game()
