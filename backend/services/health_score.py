def calculate_health_score(transactions, budgets, liabilities, totals_override=None):
    if totals_override:
        total_income = totals_override.get('total_income', 0.0)
        total_expense = totals_override.get('total_expense', 0.0)
        category_expenses = totals_override.get('category_expenses', {})
    else:
        total_income = sum(t.amount for t in transactions if t.type == 'income')
        total_expense = sum(t.amount for t in transactions if t.type == 'expense')
        category_expenses = {}
        for t in transactions:
            if t.type == 'expense':
                category_expenses[t.category] = category_expenses.get(t.category, 0.0) + t.amount

    cash_flow_score = 50
    if total_income > 0:
        ratio = ((total_income - total_expense) / total_income) * 100
        cash_flow_score = min(100, max(0, int(ratio * 2 + 50)))

    budget_score = 80
    if budgets:
        over_count = 0
        for b in budgets:
            spent = category_expenses.get(b.category, 0.0)
            if spent > b.amount:
                over_count += 1
        budget_score = max(20, 100 - (over_count * 20))

    debt_score = 90
    total_debt = sum(l.amount for l in liabilities) if liabilities else 0
    if total_debt > 50000:
        debt_score = 40
    elif total_debt > 10000:
        debt_score = 65

    overall = round((cash_flow_score * 0.4) + (budget_score * 0.4) + (debt_score * 0.2))

    return {
        "score": overall,
        "cash_flow": cash_flow_score,
        "savings": cash_flow_score,
        "budget": budget_score,
        "debt": debt_score,
        "total_debt": total_debt
    }
