class BankAccount:
    def __init__(self, balance=0):
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount

    def withdraw(self, amount):
        if amount <= self.balance:
            self.balance -= amount


def run_ops(ops):
    acct = BankAccount()

    for op, amt in ops:
        if op == 'deposit':
            acct.deposit(amt)
        else:
            acct.withdraw(amt)

    return acct.balance