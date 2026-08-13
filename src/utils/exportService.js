// src/utils/exportService.js

/**
 * Converts array of transaction objects into CSV format and triggers browser download
 * @param {Array} transactions - Array of transaction objects
 * @param {string} filename - Desired CSV filename
 */
export const exportTransactionsToCSV = (transactions = [], filename = 'FinAI_Transactions_Report.csv') => {
  if (!transactions || transactions.length === 0) {
    alert('No transactions available to export.');
    return;
  }

  const headers = ['ID', 'Date', 'Type', 'Category', 'Amount', 'Description'];
  const rows = transactions.map(t => [
    `"${t.id || ''}"`,
    `"${t.date || ''}"`,
    `"${t.type || 'expense'}"`,
    `"${t.category || 'Other'}"`,
    t.amount || 0,
    `"${(t.description || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generates and launches printable PDF Financial Statement
 * @param {Array} transactions - Transactions list
 * @param {Array} budgets - Budgets list
 * @param {object} user - Currently logged-in user
 */
export const generatePDFStatement = (transactions = [], budgets = [], user = {}) => {
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const netSavings = totalIncome - totalExpense;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up blocked. Please allow pop-ups to print PDF statements.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>FinAI Financial Statement</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; background: #ffffff; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: 800; color: #4338ca; }
          .sub { color: #64748b; font-size: 14px; margin-top: 4px; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; text-align: center; }
          .card h4 { margin: 0; font-size: 12px; text-transform: uppercase; color: #64748b; }
          .card .val { font-size: 22px; font-weight: 700; margin-top: 8px; }
          .val.income { color: #16a34a; }
          .val.expense { color: #dc2626; }
          .val.savings { color: #2563eb; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          th { background: #f1f5f9; font-weight: 700; color: #475569; }
          tr:nth-child(even) { background: #fafafa; }
          .badge { padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
          .badge.income { background: #dcfce7; color: #15803d; }
          .badge.expense { background: #fee2e2; color: #b91c1c; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">FinAI Expense Statement</div>
            <div class="sub">Official Wealth & Cashflow Audit Report</div>
          </div>
          <div style="text-align: right;">
            <div><strong>User:</strong> ${user.name || user.email || 'Valued User'}</div>
            <div class="sub">Generated: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <div class="summary-grid">
          <div class="card">
            <h4>Total Income</h4>
            <div class="val income">₹${totalIncome.toLocaleString()}</div>
          </div>
          <div class="card">
            <h4>Total Expenses</h4>
            <div class="val expense">₹${totalExpense.toLocaleString()}</div>
          </div>
          <div class="card">
            <h4>Net Balance</h4>
            <div class="val savings">₹${netSavings.toLocaleString()}</div>
          </div>
        </div>

        <h3>Recent Transactions (${transactions.length})</h3>
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
                <td>${t.date || '-'}</td>
                <td><span class="badge ${t.type}">${t.type}</span></td>
                <td>${t.category || 'Other'}</td>
                <td>${t.description || '-'}</td>
                <td style="font-weight: 700;">₹${Number(t.amount || 0).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Confidential - Generated by FinAI Expense Manager AI Engine
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
