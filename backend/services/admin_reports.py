import io
import datetime
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from sqlalchemy import func
from models import db, User, Transaction, Account

def generate_financial_report_chart():
    txs = Transaction.query.order_by(Transaction.date.asc()).all()
    tx_vol_map = {}

    for t in txs:
        d_str = t.date or datetime.date.today().isoformat()
        if d_str not in tx_vol_map:
            tx_vol_map[d_str] = {'income': 0.0, 'expense': 0.0}
        if t.type == 'income':
            tx_vol_map[d_str]['income'] += t.amount
        else:
            tx_vol_map[d_str]['expense'] += t.amount

    dates = sorted(tx_vol_map.keys())[-14:]
    incomes = [tx_vol_map[d]['income'] for d in dates]
    expenses = [tx_vol_map[d]['expense'] for d in dates]

    fig, ax = plt.subplots(figsize=(10, 5), dpi=100)
    fig.patch.set_facecolor('#0f172a')
    ax.set_facecolor('#1e293b')

    x = range(len(dates))
    width = 0.35

    ax.bar([i - width/2 for i in x], incomes, width, label='Income (₹)', color='#34d399')
    ax.bar([i + width/2 for i in x], expenses, width, label='Expenses (₹)', color='#ef4444')

    ax.set_title('FinAI Application Financial Cashflow Report', color='#ffffff', fontsize=14, pad=15, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels([d[-5:] for d in dates], color='#cbd5e1', rotation=45)
    ax.tick_params(axis='y', colors='#cbd5e1')
    ax.legend(facecolor='#1e293b', edgecolor='#6366f1', labelcolor='#ffffff')
    ax.grid(True, linestyle='--', alpha=0.2, color='#94a3b8')

    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format='png', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close(fig)
    buf.seek(0)
    return buf

def generate_user_growth_report_chart():
    users = User.query.order_by(User.created_at.asc()).all()
    user_growth_map = {}
    for u in users:
        d_str = u.created_at.strftime("%Y-%m-%d") if u.created_at else datetime.date.today().isoformat()
        user_growth_map[d_str] = user_growth_map.get(d_str, 0) + 1

    cumulative = 0
    dates = []
    totals = []
    for d_str, count in sorted(user_growth_map.items()):
        cumulative += count
        dates.append(d_str)
        totals.append(cumulative)

    fig, ax = plt.subplots(figsize=(10, 5), dpi=100)
    fig.patch.set_facecolor('#0f172a')
    ax.set_facecolor('#1e293b')

    ax.plot(dates, totals, color='#818cf8', marker='o', linewidth=2.5, markersize=6)
    ax.fill_between(dates, totals, color='#6366f1', alpha=0.25)

    ax.set_title('FinAI User Base Growth Report', color='#ffffff', fontsize=14, pad=15, fontweight='bold')
    ax.set_xticklabels([d[-5:] for d in dates], color='#cbd5e1', rotation=45)
    ax.tick_params(axis='y', colors='#cbd5e1')
    ax.grid(True, linestyle='--', alpha=0.2, color='#94a3b8')

    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format='png', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close(fig)
    buf.seek(0)
    return buf

def generate_category_spending_report_chart():
    cat_spent = db.session.query(
        Transaction.category, func.sum(Transaction.amount)
    ).filter(Transaction.type == 'expense').group_by(Transaction.category).all()

    categories = [c[0] for c in cat_spent]
    amounts = [round(c[1], 2) for c in cat_spent]

    fig, ax = plt.subplots(figsize=(9, 5), dpi=100)
    fig.patch.set_facecolor('#0f172a')
    ax.set_facecolor('#1e293b')

    bars = ax.barh(categories, amounts, color='#a855f7')
    ax.set_title('FinAI Category Expense Breakdown Report', color='#ffffff', fontsize=14, pad=15, fontweight='bold')
    ax.tick_params(axis='x', colors='#cbd5e1')
    ax.tick_params(axis='y', colors='#cbd5e1')
    ax.grid(True, linestyle='--', alpha=0.2, color='#94a3b8')

    for bar in bars:
        width = bar.get_width()
        ax.text(width + (max(amounts)*0.01 if amounts else 1), bar.get_y() + bar.get_height()/2, f'₹{width:,.0f}', va='center', ha='left', color='#e9d5ff', fontsize=9, fontweight='bold')

    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format='png', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close(fig)
    buf.seek(0)
    return buf
