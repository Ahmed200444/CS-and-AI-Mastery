class BankAccount:
    def __init__(self, balance: float = 0) -> None:
        if balance < 0:
            raise ValueError("Starting balance cannot be negative.")
        self.balance = balance

    def deposit(self, amount: float) -> None:
        if amount < 0:
            raise ValueError("Deposit amount cannot be negative.")
        self.balance += amount

    def withdraw(self, amount: float) -> bool:
        if amount < 0:
            raise ValueError("Withdrawal amount cannot be negative.")
        if amount > self.balance:
            return False
        self.balance -= amount
        return True


def run_ops(ops: list[tuple[str, float]]) -> float:
    account = BankAccount()

    for operation, amount in ops:
        if operation == "deposit":
            account.deposit(amount)
        elif operation == "withdraw":
            account.withdraw(amount)
        else:
            raise ValueError(f"Unsupported operation: {operation}")

    return account.balance


if __name__ == "__main__":
    print(run_ops([("deposit", 100), ("withdraw", 35)]))
