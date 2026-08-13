import datetime

def calculate_safe_to_spend(user_id, accounts, transactions, budgets, subscriptions, goals):
    now = datetime.datetime.now()
    days_in_month = (datetime.date(now.year, now.month % 12 + 1, 1) - datetime.date(now.year, now.month, 1)).days if now.month != 12 else 31
    remaining_days = max(1, days_in_month - now.day + 1)

    total_account_balance = sum(a.current_balance for a in accounts) if accounts else 0.0
    if not accounts and transactions:
        total_income = sum(t.amount for t in transactions if t.type == 'income')
        total_expense = sum(t.amount for t in transactions if t.type == 'expense')
        total_account_balance = total_income - total_expense

    upcoming_bills = sum(s.amount for s in subscriptions if not s.is_paid)
    planned_savings = sum(max(0, g.target_amount - g.current_amount) * 0.1 for g in goals)

    discretionary_fund = max(0, total_account_balance - upcoming_bills - planned_savings)
    daily_safe_to_spend = round(discretionary_fund / remaining_days, 2)

    calculation_details = [
        {"label": "Total Account Balances", "amount": round(total_account_balance, 2), "sign": "+"},
        {"label": "Upcoming Unpaid Bills", "amount": round(upcoming_bills, 2), "sign": "-"},
        {"label": "Planned Goal Savings (10% Target)", "amount": round(planned_savings, 2), "sign": "-"},
        {"label": "Net Safe Discretionary Fund", "amount": round(discretionary_fund, 2), "sign": "="},
        {"label": "Days Remaining in Month", "amount": remaining_days, "sign": "÷"}
    ]

    return {
        "safe_to_spend_today": daily_safe_to_spend,
        "remaining_discretionary": round(discretionary_fund, 2),
        "current_balance": round(total_account_balance, 2),
        "upcoming_bills": round(upcoming_bills, 2),
        "planned_savings": round(planned_savings, 2),
        "remaining_days": remaining_days,
        "calculation_details": calculation_details,
        "is_estimate": True
    }
