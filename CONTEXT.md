# Opensplit Domain

Opensplit helps a group record shared expenses, calculate balances, and settle debts between members.

## Groups and participation

**Group**:
A shared bill-splitting space with a name and currency.
_Avoid_: account, project

**Member**:
A person participating in a group and associated with an authenticated user identity.
_Avoid_: guest, account

## Money and settlement

**Expense**:
A recorded amount paid by one member and allocated across one or more members.
_Avoid_: bill, charge

**Settlement**:
A recorded transfer of money from one member to another to reduce an outstanding balance.
_Avoid_: payment, transaction

**Balance**:
The net amount a member is owed or owes after expenses and settlements are considered.
_Avoid_: debt, total
