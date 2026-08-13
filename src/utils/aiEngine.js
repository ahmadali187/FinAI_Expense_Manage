// Smart AI Rule Engine & Financial Advisory Assistant

const CATEGORY_RULES = {
  'Food': ['starbucks', 'mcdonalds', 'kfc', 'pizza', 'burger', 'restaurant', 'cafe', 'coffee', 'grocery', 'supermarket', 'diner', 'lunch', 'dinner', 'zomato', 'swiggy'],
  'Transport': ['uber', 'lyft', 'taxi', 'metro', 'bus', 'train', 'flight', 'fuel', 'petrol', 'diesel', 'parking', 'ola', 'cab', 'airline'],
  'Utilities': ['electricity', 'water', 'internet', 'wifi', 'phone', 'bill', 'gas', 'recharge', 'power'],
  'Entertainment': ['netflix', 'spotify', 'cinema', 'movie', 'game', 'playstation', 'xbox', 'steam', 'concert', 'prime video', 'disney'],
  'Shopping': ['amazon', 'walmart', 'target', 'nike', 'adidas', 'clothing', 'mall', 'flipkart', 'myntra', 'shoes', 'electronics'],
  'Health': ['hospital', 'pharmacy', 'doctor', 'medicine', 'gym', 'fitness', 'clinic', 'dentist']
};

/**
 * Predicts category from expense description using AI pattern matching.
 */
export const predictCategory = (description) => {
  if (!description) return 'Other';
  const lowerDesc = description.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_RULES)) {
    if (keywords.some(keyword => lowerDesc.includes(keyword))) {
      return category;
    }
  }
  return 'Other';
};

/**
 * Analyzes transactions for AI Anomaly & Velocity Warnings.
 */
export const analyzeSpendingAnomalies = (transactions = [], budgets = []) => {
  const warnings = [];
  if (!transactions || transactions.length === 0) return warnings;
  const safeBudgets = Array.isArray(budgets) ? budgets : [];

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthExpenses = transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalSpentMonth = currentMonthExpenses.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  // Velocity Check (Day of month)
  const dayOfMonth = new Date().getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthProgress = dayOfMonth / daysInMonth;

  if (monthProgress < 0.5 && totalSpentMonth > 0) {
    const overallBudget = safeBudgets.find(b => b.category === 'Overall');
    if (overallBudget && (totalSpentMonth / overallBudget.amount) > 0.6) {
      warnings.push({
        id: 'velocity-warning',
        severity: 'high',
        title: 'High Spending Pace Detected',
        message: `You've used ${( (totalSpentMonth / overallBudget.amount) * 100 ).toFixed(0)}% of your monthly budget in the first ${dayOfMonth} days!`
      });
    }
  }

  // Duplicate / Large Charge Anomaly
  const sortedDesc = [...currentMonthExpenses].sort((a, b) => b.amount - a.amount);
  if (sortedDesc.length > 0 && sortedDesc[0].amount > 5000) {
    warnings.push({
      id: `large-expense-${sortedDesc[0].id}`,
      severity: 'medium',
      title: 'Large Single Transaction Alert',
      message: `Significant single expense detected: "${sortedDesc[0].description}" for ₹${parseFloat(sortedDesc[0].amount).toFixed(2)}.`
    });
  }

  // Recurring Subscriptions Detector
  const descCounts = {};
  transactions.forEach(t => {
    const desc = t.description ? t.description.trim().toLowerCase() : '';
    if (desc) {
      descCounts[desc] = (descCounts[desc] || 0) + 1;
    }
  });

  const recurringNames = Object.keys(descCounts).filter(desc => descCounts[desc] >= 2);
  if (recurringNames.length > 0) {
    warnings.push({
      id: 'recurring-detector',
      severity: 'info',
      title: 'Recurring Subscriptions Found',
      message: `Detected ${recurringNames.length} recurring expenses (${recurringNames.slice(0, 3).join(', ')}). Track them in Recurring Bills!`
    });
  }

  return warnings;
};

/**
 * Intelligent Natural Language Query Responder (FinAI)
 */
export const answerFinancialQuery = (userQuery, transactions, budgets) => {
  const q = userQuery.toLowerCase().trim();

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);

  const netBalance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : 0;

  if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
    return "Hello! I'm FinAI, your smart financial assistant. Ask me about your spending, budget advice, highest expense category, or savings rate!";
  }

  if (q.includes('balance') || q.includes('net worth') || q.includes('how much money')) {
    return `Your net balance is ₹${netBalance.toFixed(2)}. Total Income: ₹${totalIncome.toFixed(2)} | Total Spent: ₹${totalExpenses.toFixed(2)}.`;
  }

  if (q.includes('saving') || q.includes('savings rate')) {
    return `Your current savings rate is ${savingsRate}%. ${savingsRate > 20 ? 'Great job building your wealth!' : 'Consider reducing non-essential shopping or dining expenses to boost savings above 20%.'}`;
  }

  if (q.includes('highest') || q.includes('most spent') || q.includes('top category')) {
    const categoryTotals = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount);
    });
    
    let topCat = 'None';
    let topAmount = 0;
    for (const [cat, amt] of Object.entries(categoryTotals)) {
      if (amt > topAmount) {
        topAmount = amt;
        topCat = cat;
      }
    }
    return `Your highest spending category is "${topCat}" with a total of ₹${topAmount.toFixed(2)}.`;
  }

  if (q.includes('budget') || q.includes('advice') || q.includes('tips') || q.includes('cut')) {
    if (budgets.length === 0) {
      return "You haven't set any budget limits yet! I recommend creating a monthly budget for Food and Transport in the Budget Manager.";
    }
    return `You have ${budgets.length} active budgets. Pro tip: Follow the 50/30/20 rule — 50% for Needs, 30% for Wants, and 20% dedicated directly to Savings!`;
  }

  // OCR or Receipt query
  if (q.includes('receipt') || q.includes('scan') || q.includes('ocr')) {
    return "You can use the 'Scan Receipt (OCR)' button on the top header or quick action menu to auto-extract expenses from image files!";
  }

  return `Based on your recent ${transactions.length} transactions, your net cashflow is ₹${netBalance.toFixed(2)}. You've spent ₹${totalExpenses.toFixed(2)} in total across ${new Set(transactions.map(t => t.category)).size} categories. Ask me specific questions about your top categories or savings goals!`;
};
