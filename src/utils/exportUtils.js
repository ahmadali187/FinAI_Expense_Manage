export const exportToCSV = (transactions, filename = 'expense_report.csv') => {
  if (!transactions || transactions.length === 0) return false;

  const headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount (INR)'];
  const rows = transactions.map(t => [
    t.id,
    new Date(t.date).toLocaleDateString(),
    t.type,
    `"${t.category || ''}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    parseFloat(t.amount).toFixed(2)
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
  return true;
};

export const exportToJSON = (transactions, budgets, filename = 'financial_backup.json') => {
  const data = {
    exportedAt: new Date().toISOString(),
    transactions: transactions || [],
    budgets: budgets || []
  };

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
  return true;
};

export const printFinancialStatement = (transactions, user, currencySymbol = '₹') => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const netBalance = totalIncome - totalExpense;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Financial Statement - ${user ? user.name : 'Expense Manager'}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }
        .header { border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
        h1 { margin: 0; color: #4f46e5; }
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
        .card { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .card h3 { margin: 0 0 5px 0; font-size: 14px; color: #64748b; }
        .card p { margin: 0; font-size: 22px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f1f5f9; font-weight: 600; }
        .income { color: #10b981; font-weight: bold; }
        .expense { color: #ef4444; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>Financial Statement</h1>
          <p>User: ${user ? user.name : 'Account Holder'} (${user ? user.email : ''})</p>
        </div>
        <div>
          <p>Generated: ${new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div class="summary-grid">
        <div class="card">
          <h3>Total Income</h3>
          <p class="income">${currencySymbol}${totalIncome.toFixed(2)}</p>
        </div>
        <div class="card">
          <h3>Total Expenses</h3>
          <p class="expense">${currencySymbol}${totalExpense.toFixed(2)}</p>
        </div>
        <div class="card">
          <h3>Net Balance</h3>
          <p style="color: ${netBalance >= 0 ? '#10b981' : '#ef4444'}">${currencySymbol}${netBalance.toFixed(2)}</p>
        </div>
      </div>

      <h2>Transaction Audit Log</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Category</th>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.map(t => `
            <tr>
              <td>${new Date(t.date).toLocaleDateString()}</td>
              <td><span class="${t.type}">${t.type.toUpperCase()}</span></td>
              <td>${t.category}</td>
              <td>${t.description || '-'}</td>
              <td class="${t.type}">${t.type === 'expense' ? '-' : '+'}${currencySymbol}${parseFloat(t.amount).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
};
