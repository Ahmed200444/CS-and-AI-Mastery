# Bank Account State — Python

**Course:** Object-Oriented Programming  
**Type:** Practice / Exercise  
**Language:** Python

## Task

Model an account whose balance changes through deposits and withdrawals, then process a sequence of operations and return the final balance.

## Solution

`BankAccount` stores the balance as object state. Deposits increase it, withdrawals decrease it when enough funds are available, and invalid negative amounts are rejected. `run_ops` applies the requested operations in order.

## How to run

```bash
python solution.py
```
