import json
from datetime import date

FILE_NAME = "expenses.json"


def load_expenses():
    """Load saved expenses from the JSON file."""
    try:
        with open(FILE_NAME, "r") as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def save_expenses(expenses):
    """Save all expenses to the JSON file."""
    with open(FILE_NAME, "w") as file:
        json.dump(expenses, file, indent=4)


def get_amount():
    """Ask for a valid positive expense amount."""
    while True:
        try:
            amount = float(input("Enter amount: "))

            if amount <= 0:
                print("Amount must be greater than 0.")
                continue

            return amount

        except ValueError:
            print("Invalid amount. Enter a number.")


def add_expense(expenses):
    print("\n--- Add Expense ---")

    amount = get_amount()
    category = input("Enter category: ").strip()
    description = input("Enter description: ").strip()

    if not category:
        category = "Other"

    expense = {
        "amount": amount,
        "category": category,
        "description": description,
        "date": str(date.today())
    }

    expenses.append(expense)
    save_expenses(expenses)

    print("Expense added successfully.")


def view_expenses(expenses):
    print("\n--- All Expenses ---")

    if not expenses:
        print("No expenses found.")
        return

    for number, expense in enumerate(expenses, start=1):
        print(
            f"{number}. "
            f"{expense['date']} | "
            f"{expense['category']} | "
            f"AED {expense['amount']:.2f} | "
            f"{expense['description']}"
        )


def show_total(expenses):
    total = sum(expense["amount"] for expense in expenses)

    print(f"\nTotal spending: AED {total:.2f}")


def show_category_totals(expenses):
    print("\n--- Spending by Category ---")

    if not expenses:
        print("No expenses found.")
        return

    totals = {}

    for expense in expenses:
        category = expense["category"]
        amount = expense["amount"]

        totals[category] = totals.get(category, 0) + amount

    for category, total in totals.items():
        print(f"{category}: AED {total:.2f}")


def filter_by_category(expenses):
    category = input("Enter category to search: ").strip().lower()

    matches = []

    for expense in expenses:
        if expense["category"].lower() == category:
            matches.append(expense)

    if not matches:
        print("No expenses found in that category.")
        return

    print(f"\n--- {category.title()} Expenses ---")

    for expense in matches:
        print(
            f"{expense['date']} | "
            f"AED {expense['amount']:.2f} | "
            f"{expense['description']}"
        )


def show_menu():
    print("\n==========================")
    print("      EXPENSE TRACKER")
    print("==========================")
    print("1. Add expense")
    print("2. View expenses")
    print("3. View total spending")
    print("4. View spending by category")
    print("5. Search by category")
    print("6. Exit")


def main():
    expenses = load_expenses()

    while True:
        show_menu()

        choice = input("Choose an option: ").strip()

        if choice == "1":
            add_expense(expenses)

        elif choice == "2":
            view_expenses(expenses)

        elif choice == "3":
            show_total(expenses)

        elif choice == "4":
            show_category_totals(expenses)

        elif choice == "5":
            filter_by_category(expenses)

        elif choice == "6":
            print("Expense tracker closed.")
            break

        else:
            print("Invalid option. Choose 1-6.")


main()
