import datetime

def calculate_cash_flow_forecast(user_id, current_balance, subscriptions, transactions, goals, totals_override=None):
    now = datetime.datetime.now()
    days_in_period = 30

    if totals_override:
        avg_income = totals_override.get('avg_income', 50000.0)
        avg_daily_expense = totals_override.get('avg_daily_expense', 800.0)
    else:
        # 1. Expected Income (monthly salary or recurring income)
        income_txs = [t for t in transactions if t.type == 'income']
        avg_income = sum(t.amount for t in income_txs) if income_txs else 50000.0

        # 3. Estimated Discretionary Expenses (based on last 14 days)
        expense_txs = [t for t in transactions if t.type == 'expense']
        avg_daily_expense = (sum(t.amount for t in expense_txs) / max(1, len(expense_txs))) * 1.5 if expense_txs else 800.0

    # 2. Expected Commitments (Unpaid Subscriptions & Bills)
    unpaid_bills = sum(s.amount for s in subscriptions if not s.is_paid)
    projected_spending = avg_daily_expense * days_in_period

    total_expected_commitments = round(unpaid_bills + projected_spending, 2)
    forecasted_balance = round(current_balance + avg_income - total_expected_commitments, 2)

    return {
        "current_balance": round(current_balance, 2),
        "forecasted_30day_balance": forecasted_balance,
        "expected_income": round(avg_income, 2),
        "expected_commitments": total_expected_commitments,
        "unpaid_bills": round(unpaid_bills, 2),
        "projected_spending": round(projected_spending, 2),
        "days_in_period": days_in_period,
        "label": "30-Day Cash Flow Forecast (Estimated)"
    }
