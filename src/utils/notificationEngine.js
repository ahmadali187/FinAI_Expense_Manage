// src/utils/notificationEngine.js

/**
 * Evaluates real-time financial data and generates smart notification items
 * @param {Array} transactions 
 * @param {Array} budgets 
 * @param {Array} subscriptions 
 * @param {Array} goals 
 * @returns {Array} List of notification alert objects
 */
export const generateSmartNotifications = (transactions = [], budgets = [], subscriptions = [], goals = []) => {
  const notifications = [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 1. Bill Due Date Reminders (Unpaid Subscriptions & Utility Bills)
  subscriptions.forEach(sub => {
    if (!sub.isPaid) {
      notifications.push({
        id: `bill_${sub.id}`,
        type: 'bill',
        title: `Bill Due Reminder: ${sub.title}`,
        message: `Amount ${sub.amount ? '₹' + sub.amount : ''} due around ${sub.dueDate || 'soon'}. Mark as paid to keep your credit score high!`,
        timestamp: new Date().toISOString(),
        isRead: false,
        severity: 'warning'
      });
    }
  });

  // 2. Budget Overlimit & Threshold Warnings
  budgets.forEach(b => {
    const spent = transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === 'expense' && t.category === b.category && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const ratio = b.amount > 0 ? (spent / b.amount) * 100 : 0;

    if (ratio >= 100) {
      notifications.push({
        id: `budget_limit_${b.id}`,
        type: 'budget',
        title: `Budget Exceeded: ${b.category}`,
        message: `You've spent ₹${spent.toLocaleString()} (${ratio.toFixed(0)}%) of your ₹${Number(b.amount).toLocaleString()} limit!`,
        timestamp: new Date().toISOString(),
        isRead: false,
        severity: 'danger'
      });
    } else if (ratio >= 80) {
      notifications.push({
        id: `budget_warn_${b.id}`,
        type: 'budget',
        title: `Near Budget Cap: ${b.category}`,
        message: `You've used ${ratio.toFixed(0)}% of your ₹${Number(b.amount).toLocaleString()} cap for ${b.category}.`,
        timestamp: new Date().toISOString(),
        isRead: false,
        severity: 'warning'
      });
    }
  });

  // 3. Savings Goal Milestones
  goals.forEach(g => {
    const target = Number(g.targetAmount || 1);
    const saved = Number(g.currentAmount || 0);
    const progress = (saved / target) * 100;

    if (progress >= 100) {
      notifications.push({
        id: `goal_completed_${g.id}`,
        type: 'milestone',
        title: `🎉 Goal Achieved: ${g.title}!`,
        message: `Congratulations! You saved ₹${saved.toLocaleString()} and reached 100% of your target!`,
        timestamp: new Date().toISOString(),
        isRead: false,
        severity: 'success'
      });
    } else if (progress >= 75) {
      notifications.push({
        id: `goal_75_${g.id}`,
        type: 'milestone',
        title: `Almost There: ${g.title}`,
        message: `You've reached ${progress.toFixed(0)}% of your savings goal! Keep pushing!`,
        timestamp: new Date().toISOString(),
        isRead: false,
        severity: 'info'
      });
    }
  });

  return notifications;
};
