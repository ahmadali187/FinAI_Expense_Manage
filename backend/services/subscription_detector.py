from collections import defaultdict

def detect_recurring_subscriptions(transactions, existing_subscriptions):
    existing_titles = set(s.title.lower() for s in existing_subscriptions)
    desc_counts = defaultdict(list)

    for t in transactions:
        if t.type == 'expense' and t.description:
            desc = t.description.strip().lower()
            if desc and desc not in existing_titles:
                desc_counts[desc].append(t)

    suggestions = []
    for desc, txs in desc_counts.items():
        if len(txs) >= 2:
            avg_amount = sum(t.amount for t in txs) / len(txs)
            suggestions.append({
                'id': f'suggest_{desc}',
                'title': txs[0].description,
                'amount': round(avg_amount, 2),
                'frequency': 'monthly',
                'category': txs[0].category or 'Utilities',
                'confidence': 'High' if len(txs) >= 3 else 'Medium',
                'tx_count': len(txs)
            })

    return suggestions
