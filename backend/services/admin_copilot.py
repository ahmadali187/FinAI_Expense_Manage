import datetime
import time
import re
from sqlalchemy import func, text
from models import db, User, Transaction, Account, Budget, Subscription, SavingsGoal, Notification, ActivityLog, ReportTemplate, Asset, Liability

# Session-based multi-turn conversation context engine
ADMIN_CHAT_SESSIONS = {}

def parse_date_range(text_query):
    q = text_query.lower()
    today = datetime.date.today()

    if 'today' in q:
        start = today
        end = today
        label = 'Today'
    elif 'yesterday' in q:
        start = today - datetime.timedelta(days=1)
        end = start
        label = 'Yesterday'
    elif 'this week' in q or 'last 7 days' in q or '7 days' in q:
        start = today - datetime.timedelta(days=7)
        end = today
        label = 'Last 7 Days'
    elif 'last week' in q:
        start = today - datetime.timedelta(days=14)
        end = today - datetime.timedelta(days=7)
        label = 'Last Week'
    elif 'this month' in q or 'current month' in q:
        start = today.replace(day=1)
        end = today
        label = 'This Month'
    elif 'last month' in q:
        first_this_month = today.replace(day=1)
        last_month_end = first_this_month - datetime.timedelta(days=1)
        start = last_month_end.replace(day=1)
        end = last_month_end
        label = 'Last Month'
    elif 'this year' in q:
        start = today.replace(month=1, day=1)
        end = today
        label = 'This Year'
    elif 'last 30 days' in q or '30 days' in q:
        start = today - datetime.timedelta(days=30)
        end = today
        label = 'Last 30 Days'
    else:
        start = None
        end = None
        label = 'All Time'

    return start, end, label

from services.financial_aggregation import get_centralized_system_summary

def get_admin_stats():
    return get_centralized_system_summary()

def get_database_health():
    t0 = time.perf_counter()
    tables_count = 0
    is_healthy = True
    try:
        with db.engine.connect() as conn:
            res = conn.execute(text("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")).fetchone()
            tables_count = res[0] if res else 0
            conn.execute(text("SELECT 1")).fetchone()
    except Exception:
        is_healthy = False
    
    latency_ms = round((time.perf_counter() - t0) * 1000, 2)
    timestamp_str = datetime.datetime.now().strftime("%d %b %Y, %I:%M %p")

    return {
        'status': 'Healthy' if is_healthy else 'Unhealthy',
        'database': 'SQLite',
        'tables': tables_count,
        'connection': 'OK' if is_healthy else 'FAILED',
        'latency_ms': latency_ms,
        'last_checked': timestamp_str
    }

def list_admins():
    admins = User.query.filter_by(role='admin').order_by(User.id.asc()).all()
    return [{'id': a.id, 'name': a.name, 'email': a.email, 'role': 'admin', 'is_active': getattr(a, 'is_active', True), 'created_at': a.created_at.strftime("%d %b %Y") if a.created_at else 'N/A'} for a in admins]

def get_recent_users(limit=5):
    users = User.query.order_by(User.id.desc()).limit(limit).all()
    return [{'id': u.id, 'name': u.name, 'email': u.email, 'role': u.role or 'user', 'created_at': u.created_at.strftime("%d %b %Y, %I:%M %p") if u.created_at else 'N/A'} for u in users]

def get_recent_transactions(limit=5, user_id=None):
    query = Transaction.query
    if user_id:
        query = query.filter_by(user_id=user_id)
    txs = query.order_by(Transaction.id.desc()).limit(limit).all()
    
    res = []
    for t in txs:
        u = db.session.get(User, t.user_id)
        user_name = u.name if u else f"User #{t.user_id}"
        formatted_date = t.date
        try:
            dt = datetime.datetime.strptime(t.date, "%Y-%m-%d")
            formatted_date = dt.strftime("%d %b %Y")
        except Exception:
            pass

        res.append({
            'id': t.id,
            'user_id': t.user_id,
            'user_name': user_name,
            'type': t.type,
            'amount': round(t.amount, 2),
            'category': t.category,
            'description': t.description or t.category,
            'date': formatted_date
        })
    return res

def get_savings_goals_summary(user_id=None):
    from models import SavingsGoal
    query = SavingsGoal.query
    if user_id:
        query = query.filter_by(user_id=user_id)
    goals = query.all()
    today_str = datetime.date.today().isoformat()
    
    total_target = sum(g.target_amount or 0.0 for g in goals)
    total_saved = sum(g.current_amount or 0.0 for g in goals)
    completed = sum(1 for g in goals if (g.current_amount or 0.0) >= (g.target_amount or 0.0) and (g.target_amount or 0.0) > 0)
    overdue = sum(1 for g in goals if (g.current_amount or 0.0) < (g.target_amount or 0.0) and g.target_date and g.target_date < today_str)
    active = len(goals) - completed - overdue

    return {
        'count': len(goals),
        'total_target': round(total_target, 2),
        'total_saved': round(total_saved, 2),
        'completed': completed,
        'overdue': overdue,
        'active': active
    }

def get_top_saving_user():
    from models import SavingsGoal
    goal_sums = db.session.query(
        SavingsGoal.user_id, func.sum(SavingsGoal.current_amount).label('total_saved')
    ).group_by(SavingsGoal.user_id).order_by(func.sum(SavingsGoal.current_amount).desc()).first()

    if not goal_sums:
        return None
    u = db.session.get(User, goal_sums[0])
    if not u:
        return None
    return {'user_id': u.id, 'name': u.name, 'email': u.email, 'total_saved': round(goal_sums[1], 2)}

def get_top_spending_user(start_date=None, end_date=None):
    query = db.session.query(
        User.id, User.name, User.email, func.sum(Transaction.amount).label('total_spent')
    ).join(Transaction, User.id == Transaction.user_id)\
     .filter(Transaction.type == 'expense')

    if start_date and end_date:
        query = query.filter(Transaction.date >= start_date.isoformat(), Transaction.date <= end_date.isoformat())

    top_user = query.group_by(User.id).order_by(func.sum(Transaction.amount).desc()).first()

    if top_user:
        return {'user_id': top_user[0], 'name': top_user[1], 'email': top_user[2], 'total_spent': round(top_user[3], 2)}
    return None

def get_most_active_user(start_date=None, end_date=None):
    query = db.session.query(
        User.id, User.name, User.email, func.count(Transaction.id).label('tx_count')
    ).join(Transaction, User.id == Transaction.user_id)

    if start_date and end_date:
        query = query.filter(Transaction.date >= start_date.isoformat(), Transaction.date <= end_date.isoformat())

    top_user = query.group_by(User.id).order_by(func.count(Transaction.id).desc()).first()

    if top_user:
        return {'user_id': top_user[0], 'name': top_user[1], 'email': top_user[2], 'tx_count': top_user[3]}
    return None

def get_financial_summary_by_date(start_date, end_date):
    tx_query = Transaction.query
    if start_date and end_date:
        tx_query = tx_query.filter(Transaction.date >= start_date.isoformat(), Transaction.date <= end_date.isoformat())
    
    txs = tx_query.all()
    total_inc = sum(t.amount for t in txs if t.type == 'income')
    total_exp = sum(t.amount for t in txs if t.type == 'expense')
    return {
        'total_income': round(total_inc, 2),
        'total_expenses': round(total_exp, 2),
        'net_cashflow': round(total_inc - total_exp, 2),
        'tx_count': len(txs)
    }

def compare_monthly_financials():
    today = datetime.date.today()
    this_month_start = today.replace(day=1)
    
    last_month_end = this_month_start - datetime.timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)

    this_month = get_financial_summary_by_date(this_month_start, today)
    last_month = get_financial_summary_by_date(last_month_start, last_month_end)

    exp_diff = this_month['total_expenses'] - last_month['total_expenses']
    inc_diff = this_month['total_income'] - last_month['total_income']

    return {
        'this_month': this_month,
        'last_month': last_month,
        'expense_diff': round(exp_diff, 2),
        'income_diff': round(inc_diff, 2)
    }

def answer_admin_copilot(query, admin_user_id=1):
    if not query:
        return {"reply": "Please enter an administrative question regarding system metrics, users, or database status."}

    q = query.lower().strip()
    session_ctx = ADMIN_CHAT_SESSIONS.get(admin_user_id, {})

    # PHASE 7: Normal Conversation Greetings
    greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'thanks', 'thank you', 'okay', 'ok']
    if q in greetings or any(q == f"{g}!" for g in greetings):
        return {
            "type": "greeting",
            "reply": "Hello! 👋 I'm FinAI Admin Copilot. How can I help you with users, admins, transactions, analytics, or system activity?",
            "actions": [
                {"label": "Total users?", "query": "Total users?"},
                {"label": "Who are the admins?", "query": "Who are the admins?"},
                {"label": "Show last 5 transactions", "query": "Show the last 5 transactions"}
            ]
        }

    # Refuse Personal Finance Questions
    personal_keywords = ['my balance', 'my spent', 'my income', 'my expense', 'my account', 'my budget', 'my goal', 'can i afford']
    if any(k in q for k in personal_keywords):
        return {"reply": "That is a personal financial question. Please use the normal FinAI Advisor for your personal finance data."}

    stats = get_admin_stats()
    start_d, end_d, date_label = parse_date_range(q)

    # Contextual Follow-up Resolution ("his", "her", "their", "they", "them", "who are they", "last 5 only")
    is_followup_pronoun = bool(re.search(r'\b(his|her|their|they|them|who are they|last 5 only|last 10 only)\b', q))

    # LAST N MATCH DEFINITION
    last_n_match = re.search(r'(?:last|latest|recent|show)\s+(\d+)\s+(transaction|user|registration|log|admin)s?', q)
    limit_n = int(last_n_match.group(1)) if last_n_match else (5 if is_followup_pronoun else 0)

    # Zero Hallucination Lookup Checks for specific User / Transaction IDs
    user_lookup_match = re.search(r'user\s+([a-zA-Z0-9_-]+)', query, re.IGNORECASE)
    if user_lookup_match:
        raw_target_token = user_lookup_match.group(1)
        if raw_target_token.lower() not in ['count', 'statistics', 'registrations', 'list', 'growth']:
            target_user = None
            if raw_target_token.isdigit():
                target_user = db.session.get(User, int(raw_target_token))
            else:
                target_user = User.query.filter(User.name.ilike(f"%{raw_target_token}%")).first()

            if not target_user:
                return {"reply": f"I couldn't find a user matching {raw_target_token} in the database."}

    tx_lookup_match = re.search(r'transaction\s+([a-zA-Z0-9_-]+)', query, re.IGNORECASE)
    if tx_lookup_match:
        raw_tx_token = tx_lookup_match.group(1)
        if raw_tx_token.lower() not in ['count', 'summary', 'list', 'history', 'volume', 'statistics', 'total']:
            target_tx = None
            if raw_tx_token.isdigit():
                target_tx = db.session.get(Transaction, int(raw_tx_token))

            if not target_tx:
                return {"reply": f"I couldn't find transaction {raw_tx_token} in the database."}

    # Explicit Name Search Handler (e.g., "Show Phase User" or "Show Phase User's transactions")
    show_user_match = re.search(r'(?:show|find|search|view)\s+([a-zA-Z0-9\s]+?)(?:\'s|\s+transaction|\s+details|\s*$)', query, re.IGNORECASE)
    if show_user_match and not last_n_match and not any(k in q for k in ['last', 'recent', 'admin', 'database', 'health', 'activity', 'budget', 'income', 'expense', 'cashflow']):
        target_name = show_user_match.group(1).strip()
        matched_user = User.query.filter(User.name.ilike(f"%{target_name}%")).first()
        if matched_user:
            ADMIN_CHAT_SESSIONS[admin_user_id] = {
                'last_intent': 'SHOW_USER_DETAILS',
                'last_entity': 'user',
                'last_user_id': matched_user.id,
                'last_user_name': matched_user.name,
                'last_result_summary': f"User {matched_user.name}"
            }
            if 'transaction' in q:
                txs = get_recent_transactions(limit=10, user_id=matched_user.id)
                rows = [[t['id'], t['user_name'], t['type'].upper(), f"₹{t['amount']:,.2f}", t['category'], t['description'], t['date']] for t in txs]
                return {
                    "type": "transaction_list",
                    "title": f"Transactions for {matched_user.name}",
                    "reply": f"💳 **Transactions for {matched_user.name}**\nFound {len(txs)} recorded transaction(s) in SQLite:",
                    "headers": ["Tx ID", "User", "Type", "Amount", "Category", "Description", "Date"],
                    "rows": rows,
                    "data": txs
                }
            else:
                u_dict = matched_user.to_dict()
                tx_count = Transaction.query.filter_by(user_id=matched_user.id).count()
                total_spent = db.session.query(func.sum(Transaction.amount)).filter_by(user_id=matched_user.id, type='expense').scalar() or 0.0
                total_income = db.session.query(func.sum(Transaction.amount)).filter_by(user_id=matched_user.id, type='income').scalar() or 0.0
                return {
                    "type": "summary",
                    "title": f"User Profile: {matched_user.name}",
                    "reply": (
                        f"👤 **User Profile: {matched_user.name}**\n\n"
                        f"• **ID:** `#{matched_user.id}`\n"
                        f"• **Email:** `{matched_user.email}`\n"
                        f"• **Role:** `{matched_user.role.upper()}`\n"
                        f"• **Status:** `{'Active' if matched_user.is_active else 'Deactivated'}`\n"
                        f"• **Total Transactions:** {tx_count}\n"
                        f"• **Total Spent:** ₹{round(total_spent, 2):,.2f}\n"
                        f"• **Total Income:** ₹{round(total_income, 2):,.2f}\n\n"
                        f"Ask *'Show their transactions'* or *'How many transactions do they have?'* for details."
                    ),
                    "actions": [
                        {"label": f"View {matched_user.name} Modal", "user_id": matched_user.id}
                    ]
                }

    # 1. LAST N TRANSACTIONS QUERY (Explicitly returns N transaction records!)
    if 'transaction' in q and ('total' not in q and 'count' not in q and 'volume' not in q) and (last_n_match or 'latest' in q or 'recent' in q or 'last' in q or is_followup_pronoun):
        target_user_id = session_ctx.get('last_user_id') if is_followup_pronoun else None
        user_label_str = f" for {session_ctx.get('last_user_name')}" if target_user_id and session_ctx.get('last_user_name') else ""
        
        txs = get_recent_transactions(limit=limit_n, user_id=target_user_id)
        rows = [[t['id'], t['user_name'], t['type'].upper(), f"₹{t['amount']:,.2f}", t['category'], t['description'], t['date']] for t in txs]

        ADMIN_CHAT_SESSIONS[admin_user_id] = {
            'last_intent': 'LAST_N_TRANSACTIONS',
            'last_entity': 'transaction',
            'last_limit': limit_n,
            'last_user_id': target_user_id,
            'last_result_summary': f"Latest {len(txs)} transactions"
        }

        return {
            "type": "transaction_list",
            "title": f"Latest {limit_n} Transactions{user_label_str}",
            "reply": f"💳 **Latest {len(txs)} Transactions{user_label_str}**\nHere are the {len(txs)} most recent transaction records from SQLite:",
            "headers": ["Tx ID", "User", "Type", "Amount", "Category", "Description", "Date"],
            "rows": rows,
            "data": txs,
            "actions": [
                {"label": "View Analytics", "tab": "analytics"}
            ]
        }

    # 2. LAST N USERS / RECENT REGISTRATIONS (Explicitly returns N user records!)
    if 'user' in q and (last_n_match or 'latest' in q or 'recent' in q or 'last' in q or 'registered' in q):
        users = get_recent_users(limit=limit_n)
        rows = [[u['id'], u['name'], u['email'], u['role'].upper(), u['created_at']] for u in users]

        ADMIN_CHAT_SESSIONS[admin_user_id] = {
            'last_intent': 'LAST_N_USERS',
            'last_entity': 'user',
            'last_limit': limit_n,
            'last_result_summary': f"{len(users)} recent users"
        }

        return {
            "type": "user_list",
            "title": f"Latest {limit_n} Registered Users",
            "reply": f"📋 **Latest {len(users)} Registered Users**\nHere are the {len(users)} most recently registered user accounts in SQLite:",
            "headers": ["ID", "Name", "Email", "Role", "Registration Date"],
            "rows": rows,
            "data": users,
            "actions": [
                {"label": "Open User Management", "tab": "users"}
            ]
        }

    # 3. LIST ADMINS
    if (any(k in q for k in ['who are the admin', 'who are admins', 'list admin', 'show admin', 'names of', 'admin names', 'show all admin']) or
        (is_followup_pronoun and session_ctx.get('last_intent') in ['COUNT_ADMINS', 'LIST_ADMINS'])):

        admins = list_admins()
        rows = [[a['id'], a['name'], a['email'], a['role'].upper(), 'Active' if a['is_active'] else 'Deactivated', a['created_at']] for a in admins]

        ADMIN_CHAT_SESSIONS[admin_user_id] = {
            'last_intent': 'LIST_ADMINS',
            'last_entity': 'admin',
            'last_result_summary': f"{len(admins)} administrators"
        }

        return {
            "type": "admin_list",
            "title": f"System Administrators ({len(admins)})",
            "reply": f"🛡️ **System Administrators ({len(admins)})**\nHere are the {len(admins)} registered administrator accounts in SQLite:",
            "headers": ["ID", "Name", "Email", "Role", "Status", "Created At"],
            "rows": rows,
            "data": admins,
            "actions": [
                {"label": "Open User Management", "tab": "users", "filter": "admin"}
            ]
        }

    # 4. COUNT ADMINS
    if any(k in q for k in ['how many admin', 'admin count', 'total admin', 'administrators']):
        admins = list_admins()

        ADMIN_CHAT_SESSIONS[admin_user_id] = {
            'last_intent': 'COUNT_ADMINS',
            'last_entity': 'admin',
            'last_result_summary': f"{stats['admins']} administrators"
        }

        return {
            "type": "summary",
            "title": "Administrator Count",
            "reply": (
                f"🛡️ **System Administrators**\n\n"
                f"There are currently **{stats['admins']}** registered administrator accounts in SQLite.\n\n"
                f"Ask *'Who are they?'* or *'Show all admins'* to list their names and emails."
            ),
            "actions": [
                {"label": "View All Admins", "tab": "users", "filter": "admin"}
            ]
        }

    # 5. TOP SPENDING USER & FOLLOWUP PRONOUN RESOLUTION ("Show his transactions")
    if any(k in q for k in ['highest spending', 'most spent', 'top spender', 'spent the most', 'highest spender']):
        top_spender = get_top_spending_user(start_d, end_d)
        if top_spender:
            ADMIN_CHAT_SESSIONS[admin_user_id] = {
                'last_intent': 'TOP_SPENDING_USER',
                'last_entity': 'user',
                'last_user_id': top_spender['user_id'],
                'last_user_name': top_spender['name'],
                'last_result_summary': f"{top_spender['name']} spent ₹{top_spender['total_spent']:,.2f}"
            }
            return {
                "type": "summary",
                "title": "Highest Spending User",
                "reply": (
                    f"👑 **Highest Spending User ({date_label})**\n\n"
                    f"User: **{top_spender['name']}** (ID: `#{top_spender['user_id']}`, `{top_spender['email']}`)\n"
                    f"Total Expenses Recorded: **₹{top_spender['total_spent']:,.2f}**\n\n"
                    f"Ask *'Show his transactions'* to see their recorded transaction history."
                ),
                "actions": [
                    {"label": f"View {top_spender['name']} Details", "user_id": top_spender['user_id']}
                ]
            }

    # 5.a CATEGORY SPENDING (Supports multi-turn pronoun resolution e.g., "What category did they spend the most on?")
    if 'category' in q and ('spend' in q or 'spent' in q or 'most' in q or 'highest' in q or 'breakdown' in q):
        target_user_id = session_ctx.get('last_user_id') if (is_followup_pronoun or 'they' in q or 'he' in q or 'she' in q or 'that user' in q) else None
        user_label = f" for {session_ctx.get('last_user_name')}" if target_user_id and session_ctx.get('last_user_name') else ""
        
        all_cats_query = db.session.query(
            Transaction.category, func.sum(Transaction.amount).label('cat_spent')
        ).filter(Transaction.type == 'expense')
        
        if target_user_id:
            all_cats_query = all_cats_query.filter(Transaction.user_id == target_user_id)
            
        cat_list = all_cats_query.group_by(Transaction.category).order_by(func.sum(Transaction.amount).desc()).all()
        top_cat = cat_list[0] if cat_list else None
        
        if top_cat:
            return {
                "type": "summary",
                "title": f"Category Spending Breakdown{user_label}",
                "reply": f"🏷️ **Category Spending Breakdown{user_label}**\n\nHighest: **{top_cat[0]}** (₹{round(top_cat[1], 2):,.2f}) across {len(cat_list)} categories.",
                "chart": {
                    "type": "bar",
                    "title": f"Category Spending{user_label}",
                    "labels": [c[0] for c in cat_list],
                    "values": [round(c[1], 2) for c in cat_list]
                },
                "actions": [
                    {"label": "View Analytics Visualizations", "tab": "analytics"}
                ]
            }

    # 5.b USER WHO SAVED THE MOST
    if any(k in q for k in ['who saved the most', 'top saver', 'saved the most', 'highest savings']):
        top_saver = get_top_saving_user()
        if top_saver:
            ADMIN_CHAT_SESSIONS[admin_user_id] = {
                'last_intent': 'TOP_SAVER_USER',
                'last_entity': 'user',
                'last_user_id': top_saver['user_id'],
                'last_user_name': top_saver['name'],
                'last_result_summary': f"{top_saver['name']} saved ₹{top_saver['total_saved']:,.2f}"
            }
            return {
                "type": "summary",
                "title": "Top Saving User",
                "reply": (
                    f"🏆 **Top Saving User**\n\n"
                    f"User: **{top_saver['name']}** (ID: `#{top_saver['user_id']}`, `{top_saver['email']}`)\n"
                    f"Total Saved Amount: **₹{top_saver['total_saved']:,.2f}**\n\n"
                    f"Ask *'Show his goals'* to inspect their savings goals."
                ),
                "actions": [
                    {"label": f"View {top_saver['name']} Details", "user_id": top_saver['user_id']}
                ]
            }

    # 5.c SAVINGS GOALS SUMMARY / OVERDUE GOALS
    if 'goal' in q or 'savings' in q:
        target_user_id = session_ctx.get('last_user_id') if is_followup_pronoun else None
        sg_summary = get_savings_goals_summary(user_id=target_user_id)
        user_label = f" for {session_ctx.get('last_user_name')}" if target_user_id and session_ctx.get('last_user_name') else ""
        
        ADMIN_CHAT_SESSIONS[admin_user_id] = {
            'last_intent': 'SAVINGS_GOALS_SUMMARY',
            'last_entity': 'goal',
            'last_user_id': target_user_id,
            'last_result_summary': f"Savings goals: {sg_summary['count']} ({sg_summary['completed']} completed, {sg_summary['overdue']} overdue)"
        }

        return {
            "type": "summary",
            "title": f"Savings Goals Summary{user_label}",
            "reply": (
                f"🎯 **Savings Goals Summary{user_label}**\n\n"
                f"Total Goals Recorded: **{sg_summary['count']}**\n"
                f"Total Target Amount: **₹{sg_summary['total_target']:,.2f}**\n"
                f"Total Saved Amount: **₹{sg_summary['total_saved']:,.2f}**\n"
                f"Completed Goals: **{sg_summary['completed']}**\n"
                f"Overdue Goals: **{sg_summary['overdue']}**\n"
                f"Active Goals: **{sg_summary['active']}**"
            ),
            "actions": [
                {"label": "View Savings Goals", "tab": "savings-goals"}
            ]
        }

    # 6. USER WITH MOST TRANSACTIONS
    if any(k in q for k in ['most transaction', 'top user by transaction', 'transaction count per user']):
        top_active = get_most_active_user(start_d, end_d)
        if top_active:
            ADMIN_CHAT_SESSIONS[admin_user_id] = {
                'last_intent': 'MOST_TRANSACTION_USER',
                'last_entity': 'user',
                'last_user_id': top_active['user_id'],
                'last_user_name': top_active['name'],
                'last_result_summary': f"{top_active['name']} has {top_active['tx_count']} transactions"
            }

            return {
                "type": "summary",
                "title": "User With Most Transactions",
                "reply": (
                    f"⚡ **User With Most Transactions ({date_label})**\n\n"
                    f"User: **{top_active['name']}** (ID: `#{top_active['user_id']}`, `{top_active['email']}`)\n"
                    f"Total Transactions Recorded: **{top_active['tx_count']}**"
                ),
                "actions": [
                    {"label": f"View {top_active['name']} Details", "user_id": top_active['user_id']}
                ]
            }

    # 7. TOTAL USERS / ACTIVE / INACTIVE
    if any(k in q for k in ['total user', 'user count', 'how many user', 'registered user', 'all user', 'active user', 'inactive user']):
        ADMIN_CHAT_SESSIONS[admin_user_id] = {
            'last_intent': 'COUNT_USERS',
            'last_entity': 'user',
            'last_result_summary': f"{stats['users']} users"
        }

        return {
            "type": "summary",
            "title": "User Statistics",
            "reply": (
                f"👥 **Application Users Summary**\n\n"
                f"Total Registered Users: **{stats['users']}**\n"
                f"Active Users: **{stats['active_users']}**\n"
                f"Inactive Users: **{stats['users'] - stats['active_users']}**\n"
                f"Administrators: **{stats['admins']}**\n\n"
                f"Ask *'Show last 5 users'* or *'Who are the admins?'* to list specific accounts."
            ),
            "actions": [
                {"label": "Open User Management", "tab": "users"}
            ]
        }

    # 8. COMPARE THIS MONTH VS LAST MONTH
    if 'compare' in q or ('this month' in q and 'last month' in q):
        comp = compare_monthly_financials()
        return {
            "type": "summary",
            "title": "Monthly Financial Comparison",
            "reply": (
                f"📊 **Monthly Financial Comparison**\n\n"
                f"**This Month:** Income: ₹{comp['this_month']['total_income']:,.2f} | Spent: ₹{comp['this_month']['total_expenses']:,.2f}\n"
                f"**Last Month:** Income: ₹{comp['last_month']['total_income']:,.2f} | Spent: ₹{comp['last_month']['total_expenses']:,.2f}\n\n"
                f"Expense Change: **{'+' if comp['expense_diff'] >= 0 else ''}₹{comp['expense_diff']:,.2f}**\n"
                f"Income Change: **{'+' if comp['income_diff'] >= 0 else ''}₹{comp['income_diff']:,.2f}**"
            ),
            "actions": [
                {"label": "View Analytics Visualizations", "tab": "analytics"}
            ]
        }

    # 9. TOTAL INCOME & EXPENSES & NET CASHFLOW & TRANSACTION STATS
    if any(k in q for k in ['total income', 'total expense', 'income and expense', 'net cashflow', 'financial summary', 'total transaction', 'transaction count', 'how many transaction', 'all transaction', 'transaction statistics']):
        summary = get_financial_summary_by_date(start_d, end_d)
        ADMIN_CHAT_SESSIONS[admin_user_id] = {
            'last_intent': 'TRANSACTION_SUMMARY',
            'last_date_range': date_label,
            'last_result_summary': f"Spent: ₹{summary['total_expenses']}, Income: ₹{summary['total_income']}"
        }

        return {
            "type": "summary",
            "title": "Financial Summary",
            "reply": (
                f"📈 **Total Financial Overview ({date_label})**\n\n"
                f"Total Income Recorded: **₹{summary['total_income']:,.2f}**\n"
                f"Total Expenses Recorded: **₹{summary['total_expenses']:,.2f}**\n"
                f"Net System Cashflow: **₹{summary['net_cashflow']:,.2f}**\n"
                f"Total Transactions: **{summary['tx_count']}**"
            ),
            "actions": [
                {"label": "View Analytics Visualizations", "tab": "analytics"}
            ]
        }

    # 10. DATABASE HEALTH WITH REAL LATENCY (PHASE 15)
    if any(k in q for k in ['database health', 'health', 'database', 'sqlite', 'status']):
        health = get_database_health()
        status_icon = "🟢" if health['status'] == 'Healthy' else "🔴"
        return {
            "type": "summary",
            "title": "Database System Health",
            "reply": (
                f"Database Health\n"
                f"{status_icon} **{health['status']}**\n\n"
                f"Database: **{health['database']}** (`backend/finai.db`)\n"
                f"Tables: **{health['tables']}**\n"
                f"Connection: **{health['connection']}**\n"
                f"Query Latency: **{health['latency_ms']} ms**\n"
                f"Last Checked: **{health['last_checked']}**"
            ),
            "actions": [
                {"label": "Inspect SQLite Tables", "tab": "database"}
            ]
        }

    # 11. RECENT ACTIVITY LOGS
    if any(k in q for k in ['recent activity', 'activity log', 'audit log', 'system activity']):
        logs = ActivityLog.query.order_by(ActivityLog.id.desc()).limit(5).all()
        log_rows = [[l.id, f"User #{l.user_id}", l.action, l.timestamp.strftime("%d %b %Y, %I:%M %p") if l.timestamp else 'N/A'] for l in logs]
        return {
            "type": "table",
            "title": "Recent System Activity",
            "reply": f"📜 **Recent Activity & Audit Trail**\nHere are the 5 most recent activity logs from SQLite:",
            "headers": ["Log ID", "User", "Action Description", "Timestamp"],
            "rows": log_rows,
            "actions": [
                {"label": "View Full Audit Logs", "tab": "audit"}
            ]
        }

    # Default Fallback System Summary
    return {
        "type": "summary",
        "title": "Admin Copilot Overview",
        "reply": (
            f"🤖 **FinAI Admin Copilot System Summary**\n\n"
            f"• **Registered Users:** {stats['users']} (Active: {stats['active_users']}, Admins: {stats['admins']})\n"
            f"• **Total Transactions:** {stats['transactions']} (Income: ₹{stats['total_income']:,.2f} | Spent: ₹{stats['total_expenses']:,.2f})\n"
            f"• **Database Health:** 🟢 Healthy ({stats['database_tables']} SQLite tables)\n\n"
            f"Try asking:\n"
            f"• *'Who are the admins?'*\n"
            f"• *'Show the last 5 transactions'* \n"
            f"• *'Which user spent the most?'*\n"
            f"• *'Compare this month with last month'*"
        ),
        "actions": [
            {"label": "Open User Management", "tab": "users"},
            {"label": "View Analytics Visualizations", "tab": "analytics"}
        ]
    }
