import datetime
from sqlalchemy import func, text
from models import db, User, Transaction, Account, Budget, SavingsGoal, Subscription, ActivityLog, Bill

def calculate_unified_budget_status(budget):
    """
    Unified budget calculation engine.
    Calculates spending for a budget category based on SQLite transactions.
    Returns a dictionary with limit, spent, remaining, percentage, and status.
    """
    if not budget:
        return None

    # Filter expense transactions for this user and category
    query = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == budget.user_id,
        Transaction.type == 'expense',
        func.lower(Transaction.category) == func.lower(budget.category)
    )

    total_spent = query.scalar() or 0.0
    allocated = float(budget.amount) if budget.amount else 0.0
    spent = float(total_spent)
    remaining = round(allocated - spent, 2)
    percentage = round((spent / allocated * 100), 1) if allocated > 0 else 0.0

    if spent > allocated or percentage >= 100.0:
        status = 'EXCEEDED'
    elif percentage >= 80.0:
        status = 'WARNING'
    else:
        status = 'ON_TRACK'

    return {
        'id': str(budget.id),
        'user_id': budget.user_id,
        'category': budget.category,
        'period': budget.period or 'monthly',
        'allocated_limit': round(allocated, 2),
        'spent_amount': round(spent, 2),
        'remaining_amount': remaining,
        'usage_percentage': percentage,
        'status': status
    }

def get_centralized_system_summary():
    """
    Single Source of Truth system metrics engine.
    Used by Dashboard, Admin Overview, Analytics, Reports, and Copilot.
    """
    user_count = User.query.count()
    active_user_count = User.query.filter(User.is_active == True).count()
    admin_count = User.query.filter(User.role == 'admin').count()
    accounts_count = Account.query.count()
    tx_count = Transaction.query.count()

    total_income = db.session.query(func.sum(Transaction.amount)).filter(Transaction.type == 'income').scalar() or 0.0
    total_expenses = db.session.query(func.sum(Transaction.amount)).filter(Transaction.type == 'expense').scalar() or 0.0
    net_cashflow = total_income - total_expenses

    budgets = Budget.query.all()
    budgets_count = len(budgets)
    exceeded_budgets_count = 0
    warning_budgets_count = 0
    budget_details = []

    for b in budgets:
        b_stat = calculate_unified_budget_status(b)
        if b_stat:
            budget_details.append(b_stat)
            if b_stat['status'] == 'EXCEEDED':
                exceeded_budgets_count += 1
            elif b_stat['status'] == 'WARNING':
                warning_budgets_count += 1

    goals = SavingsGoal.query.all()
    goals_count = len(goals)
    total_savings_target = sum(g.target_amount for g in goals) if goals else 0.0
    total_savings_saved = sum(g.current_amount for g in goals) if goals else 0.0

    subscriptions_count = Subscription.query.count()
    activity_count = ActivityLog.query.count()

    tables_count = 12
    try:
        with db.engine.connect() as conn:
            res = conn.execute(text("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")).fetchone()
            if res:
                tables_count = res[0]
    except Exception:
        pass

    return {
        'users': user_count,
        'active_users': active_user_count,
        'admins': admin_count,
        'accounts': accounts_count,
        'transactions': tx_count,
        'total_income': round(total_income, 2),
        'total_expenses': round(total_expenses, 2),
        'net_cashflow': round(net_cashflow, 2),
        'budgets': budgets_count,
        'exceeded_budgets': exceeded_budgets_count,
        'warning_budgets': warning_budgets_count,
        'savings_goals': goals_count,
        'total_savings_target': round(total_savings_target, 2),
        'total_savings_saved': round(total_savings_saved, 2),
        'subscriptions': subscriptions_count,
        'activity_logs': activity_count,
        'database_tables': tables_count
    }

def get_user_financial_profile(user_id):
    """
    Aggregates full financial profile for a specific user.
    Used for Admin User Detail view and User Profile intelligence.
    """
    user = db.session.get(User, user_id)
    if not user:
        return None

    accounts = Account.query.filter_by(user_id=user.id).all()
    total_balance = sum(a.current_balance for a in accounts)

    txs = Transaction.query.filter_by(user_id=user.id).all()
    total_income = sum(t.amount for t in txs if t.type == 'income')
    total_expenses = sum(t.amount for t in txs if t.type == 'expense')
    net_cashflow = total_income - total_expenses

    budgets = Budget.query.filter_by(user_id=user.id).all()
    budget_stats = [calculate_unified_budget_status(b) for b in budgets]

    goals = SavingsGoal.query.filter_by(user_id=user.id).all()
    goal_stats = []
    for g in goals:
        progress = round((g.current_amount / g.target_amount * 100), 1) if g.target_amount > 0 else 0.0
        capped_progress = min(progress, 100.0)
        goal_stats.append({
            'id': str(g.id),
            'title': g.title,
            'target_amount': g.target_amount,
            'current_amount': g.current_amount,
            'remaining_amount': max(0.0, g.target_amount - g.current_amount),
            'progress_percentage': capped_progress,
            'target_date': g.target_date,
            'status': 'COMPLETED' if g.current_amount >= g.target_amount else 'ACTIVE'
        })

    subscriptions = Subscription.query.filter_by(user_id=user.id).all()
    recent_activity = ActivityLog.query.filter_by(user_id=user.id).order_by(ActivityLog.timestamp.desc()).limit(20).all()

    return {
        'profile': user.to_dict(),
        'financial_summary': {
            'total_income': round(total_income, 2),
            'total_expenses': round(total_expenses, 2),
            'net_cashflow': round(net_cashflow, 2),
            'current_balance': round(total_balance, 2),
            'accounts_count': len(accounts),
            'transactions_count': len(txs)
        },
        'accounts': [a.to_dict() for a in accounts],
        'transactions': [t.to_dict() for t in sorted(txs, key=lambda x: x.date or '', reverse=True)[:50]],
        'budgets': budget_stats,
        'savings_goals': goal_stats,
        'subscriptions': [s.to_dict() for s in subscriptions],
        'activity_logs': [a.to_dict() for a in recent_activity]
    }
