import re
import datetime

CATEGORY_KEYWORDS = {
    'Food': ['starbucks', 'mcdonalds', 'kfc', 'pizza', 'burger', 'restaurant', 'cafe', 'coffee', 'grocery', 'supermarket', 'diner', 'lunch', 'dinner', 'zomato', 'swiggy', 'food'],
    'Transport': ['uber', 'lyft', 'taxi', 'metro', 'bus', 'train', 'flight', 'fuel', 'petrol', 'diesel', 'parking', 'ola', 'cab', 'airline', 'transport'],
    'Utilities': ['electricity', 'water', 'internet', 'wifi', 'phone', 'bill', 'gas', 'recharge', 'power', 'broadband'],
    'Entertainment': ['netflix', 'spotify', 'cinema', 'movie', 'game', 'playstation', 'xbox', 'steam', 'concert', 'prime video', 'disney'],
    'Shopping': ['amazon', 'walmart', 'target', 'nike', 'adidas', 'clothing', 'mall', 'flipkart', 'myntra', 'shoes', 'electronics'],
    'Health': ['hospital', 'pharmacy', 'doctor', 'medicine', 'gym', 'fitness', 'clinic', 'dentist']
}

def parse_quick_add(text):
    if not text:
        return None

    clean_text = text.strip()
    
    amount_match = re.search(r'(?:₹|\$|€|£)?\s*(\d+(?:\.\d{1,2})?)', clean_text)
    amount = float(amount_match.group(1)) if amount_match else 0.0

    is_income = any(w in clean_text.lower() for w in ['received', 'earned', 'salary', 'bonus', 'dividend', 'income'])
    tx_type = 'income' if is_income else 'expense'

    predicted_category = 'Other'
    lower_text = clean_text.lower()
    for cat, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in lower_text for kw in keywords):
            predicted_category = cat
            break

    account_name = None
    if 'hdfc' in lower_text:
        account_name = 'HDFC Bank'
    elif 'sbi' in lower_text:
        account_name = 'SBI Savings'
    elif 'card' in lower_text or 'credit' in lower_text:
        account_name = 'Credit Card'
    elif 'cash' in lower_text:
        account_name = 'Cash Wallet'

    tx_date = datetime.date.today().isoformat()

    return {
        'type': tx_type,
        'amount': amount,
        'category': predicted_category,
        'description': clean_text,
        'account_name': account_name,
        'date': tx_date,
        'confidence': 95 if amount > 0 else 60
    }

def answer_financial_copilot(query, transactions, budgets, subscriptions, goals, accounts=[]):
    q = query.lower().strip()

    total_income = sum(t.amount for t in transactions if t.type == 'income')
    total_expense = sum(t.amount for t in transactions if t.type == 'expense')
    net_balance = total_income - total_expense
    savings_rate = round(((total_income - total_expense) / total_income) * 100, 1) if total_income > 0 else 0.0

    # 1. WRITE ACTIONS (Require User Confirmation via Action Proposal UI Cards)
    if any(q.startswith(kw) for kw in ['add', 'log', 'create', 'set']):
        amount_match = re.search(r'\d+(?:\.\d+)?', q)
        amt = float(amount_match.group(0)) if amount_match else 500.0
        
        if 'goal' in q or ('save' in q and 'goal' in q):
            return {
                'reply': f"Action Proposal Created:\nI can create a new Savings Goal for ₹{amt:,.0f}. Please confirm below:",
                'classification': 'RECOMMENDATION',
                'action_proposal': {
                    'type': 'create_goal',
                    'title': 'New Savings Goal',
                    'targetAmount': amt,
                    'currentAmount': 0
                }
            }
        elif 'budget' in q:
            cat = 'Food'
            for category in ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health']:
                if category.lower() in q:
                    cat = category
                    break
            return {
                'reply': f"Action Proposal Created:\nI can set your '{cat}' budget limit to ₹{amt:,.0f}. Please confirm below:",
                'classification': 'RECOMMENDATION',
                'action_proposal': {
                    'type': 'set_budget',
                    'category': cat,
                    'amount': amt
                }
            }
        else:
            cat = 'Food'
            for category in ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Travel']:
                if category.lower() in q:
                    cat = category
                    break
            return {
                'reply': f"Action Proposal Created:\nI can log an expense transaction for ₹{amt:,.0f} under '{cat}'. Please confirm below:",
                'classification': 'RECOMMENDATION',
                'action_proposal': {
                    'type': 'add_transaction',
                    'amount': amt,
                    'category': cat,
                    'description': query.title()
                }
            }

    # 2. READ QUERIES WITH CLEAN NATURAL PROSE & STRUCTURED METADATA

    # Net Balance / Net Worth
    if any(w in q for w in ['balance', 'how much money', 'net worth']):
        return {
            'reply': f"Your recorded net balance is ₹{net_balance:,.2f} across {len(accounts)} active account(s). (Total Income: ₹{total_income:,.2f} | Total Expenses: ₹{total_expense:,.2f}).",
            'classification': 'FACT',
            'actions': [
                {'label': 'Show Transactions', 'tab': 'transactions'},
                {'label': 'View Accounts', 'tab': 'accounts'}
            ]
        }

    # Total Earned / Income
    if 'how much did i earn' in q or 'earned' in q or 'total income' in q:
        return {
            'reply': f"Your recorded total income is ₹{total_income:,.2f} across {len([t for t in transactions if t.type == 'income'])} income transaction(s).",
            'classification': 'FACT',
            'actions': [
                {'label': 'Show Transactions', 'tab': 'transactions'}
            ]
        }

    # Monthly Spending
    if 'spend this month' in q or 'spent this month' in q or 'this month spending' in q:
        today_prefix = datetime.date.today().strftime('%Y-%m')
        this_month_spent = sum(t.amount for t in transactions if t.type == 'expense' and t.date and t.date.startswith(today_prefix))
        pct = round((this_month_spent/total_expense*100),1) if total_expense>0 else 0
        return {
            'reply': f"Your recorded expenses for {datetime.date.today().strftime('%B %Y')} are ₹{this_month_spent:,.2f}, accounting for {pct}% of your all-time recorded expenses.",
            'classification': 'FACT',
            'actions': [
                {'label': 'Show Transactions', 'tab': 'transactions'},
                {'label': 'View Budgets', 'tab': 'budgets'}
            ]
        }

    # Highest Expense / Biggest Expense
    if 'biggest expense' in q or 'highest expense' in q or 'largest expense' in q:
        expenses = [t for t in transactions if t.type == 'expense']
        if not expenses:
            return {
                'reply': "No expense transactions were found in your database records.",
                'classification': 'UNKNOWN'
            }
        biggest = max(expenses, key=lambda x: x.amount)
        return {
            'reply': f"Your largest single recorded expense is ₹{biggest.amount:,.2f} for '{biggest.description or biggest.category}' on {biggest.date} (Category: {biggest.category}).",
            'classification': 'FACT',
            'actions': [
                {'label': 'Show Transactions', 'tab': 'transactions'}
            ]
        }

    # Where am I spending most / Top category
    if any(w in q for w in ['where am i spending', 'highest spending', 'spent most', 'top category']):
        cat_map = {}
        for t in transactions:
            if t.type == 'expense':
                cat_map[t.category] = cat_map.get(t.category, 0) + t.amount
        if not cat_map:
            return {
                'reply': "No expense category records were found in your database.",
                'classification': 'UNKNOWN'
            }
        top_cat = max(cat_map.items(), key=lambda x: x[1])
        return {
            'reply': f"Your highest spending category is '{top_cat[0]}' with total recorded expenses of ₹{top_cat[1]:,.2f}.",
            'classification': 'INTERPRETATION',
            'actions': [
                {'label': 'Why?', 'query': 'Why did my spending increase?'},
                {'label': 'Show Transactions', 'tab': 'transactions'},
                {'label': 'View Budget', 'tab': 'budgets'}
            ]
        }

    # Month vs Month Comparison
    if 'compare' in q or 'last month' in q or 'spending increase' in q or 'category increased' in q:
        today = datetime.date.today()
        this_month_prefix = today.strftime('%Y-%m')
        first_this = today.replace(day=1)
        last_month_obj = first_this - datetime.timedelta(days=1)
        last_month_prefix = last_month_obj.strftime('%Y-%m')

        this_spent = sum(t.amount for t in transactions if t.type == 'expense' and t.date and t.date.startswith(this_month_prefix))
        last_spent = sum(t.amount for t in transactions if t.type == 'expense' and t.date and t.date.startswith(last_month_prefix))
        diff = this_spent - last_spent

        return {
            'reply': f"Month-over-month expenses:\n• {today.strftime('%B %Y')}: ₹{this_spent:,.2f}\n• {last_month_obj.strftime('%B %Y')}: ₹{last_spent:,.2f}\nNet Change: {'+' if diff>=0 else ''}₹{diff:,.2f}. {'Expenses increased recently.' if diff > 0 else 'Expenses decreased, preserving your cash flow.'}",
            'classification': 'CALCULATION',
            'actions': [
                {'label': 'Why?', 'query': 'Where am I spending the most?'},
                {'label': 'Show Transactions', 'tab': 'transactions'}
            ]
        }

    # Affordability Analysis with Structured Transparency Breakdown
    if 'afford' in q:
        match = re.search(r'\d+(?:,\d+)*(?:\.\d+)?', q)
        purchase_amt = float(match.group(0).replace(',', '')) if match else 5000.0
        
        unpaid_subs = sum(s.amount for s in subscriptions if not s.is_paid) if subscriptions else 0.0
        savings_targets = sum(g.target_amount - g.current_amount for g in goals if g.current_amount < g.target_amount) if goals else 0.0
        available_amt = net_balance - (unpaid_subs + min(savings_targets, net_balance * 0.2))
        safe_margin = available_amt - purchase_amt

        is_safe = safe_margin >= 5000.0
        result_text = "Transaction is safe to execute." if is_safe else "We recommend maintaining a safety buffer of at least ₹5,000 before executing non-essential purchases."

        return {
            'reply': f"{'Yes, you can afford' if is_safe else 'Caution regarding'} a purchase of ₹{purchase_amt:,.2f}.\n{result_text}",
            'classification': 'RECOMMENDATION',
            'breakdown': {
                'current_balance': net_balance,
                'upcoming_commitments': unpaid_subs,
                'savings_commitments': savings_targets,
                'estimated_available_amount': max(0.0, available_amt),
                'purchase_amount': purchase_amt,
                'result': 'SAFE' if is_safe else 'CAUTION'
            },
            'actions': [
                {'label': 'View Accounts', 'tab': 'accounts'},
                {'label': 'Show Transactions', 'tab': 'transactions'}
            ]
        }

    # Savings Guidance
    if 'how much should i save' in q or 'recommend saving' in q:
        rec_savings = round(total_income * 0.20, 2)
        return {
            'reply': f"Following standard 50/30/20 financial guidelines, based on your total income of ₹{total_income:,.2f}, aim to save 20% (approx. ₹{rec_savings:,.2f}) every month.",
            'classification': 'RECOMMENDATION',
            'actions': [
                {'label': 'View Savings Goals', 'tab': 'savings'}
            ]
        }

    # Budgets
    if 'budget' in q or 'close to limit' in q or 'exceeding' in q:
        if not budgets:
            return {
                'reply': "No budget caps have been configured in your account yet.",
                'classification': 'UNKNOWN'
            }
        exceeded = []
        warning = []
        for b in budgets:
            cat_spent = sum(t.amount for t in transactions if t.type == 'expense' and t.category.lower() == b.category.lower())
            pct = (cat_spent / b.amount * 100) if b.amount > 0 else 0
            if cat_spent > b.amount:
                exceeded.append(f"• {b.category}: Spent ₹{cat_spent:,.2f} of ₹{b.amount:,.2f} (Exceeded by ₹{cat_spent - b.amount:,.2f})")
            elif pct >= 80:
                warning.append(f"• {b.category}: Spent ₹{cat_spent:,.2f} of ₹{b.amount:,.2f} ({pct:.1f}% used)")
        
        lines = []
        if exceeded:
            lines.append("Exceeded Budgets:\n" + "\n".join(exceeded))
        if warning:
            lines.append("Budgets Approaching Limit (>=80%):\n" + "\n".join(warning))
        if not lines:
            lines.append("All configured budgets are within safe spending limits.")
            
        return {
            'reply': "\n\n".join(lines),
            'classification': 'FACT',
            'actions': [
                {'label': 'View Budgets', 'tab': 'budgets'},
                {'label': 'Show Transactions', 'tab': 'transactions'}
            ]
        }

    # Subscriptions & Commitments
    if 'subscription' in q or 'commitments' in q or 'recurring' in q:
        if not subscriptions:
            return {
                'reply': "No active subscriptions are recorded in your account.",
                'classification': 'UNKNOWN'
            }
        total_sub_cost = sum(s.amount for s in subscriptions)
        unpaid = [s for s in subscriptions if not s.is_paid]
        return {
            'reply': f"You have {len(subscriptions)} active subscription(s) totaling ₹{total_sub_cost:,.2f}/month. Unpaid commitments: {len(unpaid)} totaling ₹{sum(s.amount for s in unpaid):,.2f}.",
            'classification': 'FACT',
            'actions': [
                {'label': 'View Subscriptions', 'tab': 'subscriptions'}
            ]
        }

    # Savings Goal Progress
    if 'saved' in q or 'goal' in q:
        if not goals:
            return {
                'reply': "No savings goals have been configured yet.",
                'classification': 'UNKNOWN'
            }
        total_target = sum(g.target_amount for g in goals)
        total_saved = sum(g.current_amount for g in goals)
        pct = round((total_saved/total_target*100),1) if total_target>0 else 0
        return {
            'reply': f"Savings Goals Progress: Saved ₹{total_saved:,.2f} out of ₹{total_target:,.2f} target ({pct}% achieved across {len(goals)} goal(s)).",
            'classification': 'FACT',
            'actions': [
                {'label': 'View Savings Goals', 'tab': 'savings'}
            ]
        }

    return {
        'reply': f"FinAI Overview: Recorded net balance of ₹{net_balance:,.2f} across {len(transactions)} transaction(s), {len(budgets)} budget(s), and {len(goals)} goal(s).",
        'classification': 'FACT',
        'actions': [
            {'label': 'Show Transactions', 'tab': 'transactions'}
        ]
    }
