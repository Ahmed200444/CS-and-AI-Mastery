class BankAccount:
    def __init__(self, balance=0):
        self.balance = balance

    def deposit(self, amount):
        if amount < 0:
            raise ValueError("Deposit amount cannot be negative")
        self.balance += amount

    def withdraw(self, amount):
        if amount < 0:
            raise ValueError("Withdrawal amount cannot be negative")
        if amount <= self.balance:
            self.balance -= amount


def run_ops(ops):
    account = BankAccount()

    for operation, amount in ops:
        if operation == "deposit":
            account.deposit(amount)
        elif operation == "withdraw":
            account.withdraw(amount)
        else:
            raise ValueError(f"Unknown operation: {operation}")

    return account.balance
