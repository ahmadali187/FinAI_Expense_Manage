import React, { useState } from 'react';
import * as api from '../../services/api';
import { FaFileCsv, FaTimes, FaCheck, FaCloudUploadAlt } from 'react-icons/fa';

const CsvImportModal = ({ isOpen, onClose, onImported }) => {
  const [parsedRows, setParsedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(l => l.trim());

      if (lines.length <= 1) {
        setError('CSV file appears to be empty or missing header row.');
        return;
      }

      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length >= 2) {
          const date = cols[0] || new Date().toISOString().split('T')[0];
          const description = cols[1] || 'CSV Transaction';
          const amount = parseFloat(cols[2] || '0') || 100.0;
          const type = cols[3] && cols[3].toLowerCase().includes('inc') ? 'income' : 'expense';
          const category = cols[4] || 'Shopping';

          rows.push({ date, description, amount, type, category });
        }
      }

      setParsedRows(rows);
    };
    reader.readAsText(uploadedFile);
  };

  const handleImportConfirm = async () => {
    if (parsedRows.length === 0) return;

    try {
      setLoading(true);
      await api.importCsv(parsedRows);
      if (onImported) onImported();
      setParsedRows([]);
      onClose();
    } catch (err) {
      console.error('CSV import failed:', err);
      setError('Failed to import transactions to SQLite.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-glass-container"
        style={{
          maxWidth: '560px',
          background: '#0f172a',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '28px',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaFileCsv color="#10b981" size={22} />
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
              Import Transactions via CSV
            </span>
          </div>
          <FaTimes style={{ cursor: 'pointer', color: '#94a3b8', fontSize: '1.2rem' }} onClick={onClose} />
        </div>

        <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '16px', lineHeight: 1.4 }}>
          Upload a bank or credit card CSV file. We will preview the fields and map them to your SQLite database.
        </p>

        {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</div>}

        {parsedRows.length === 0 ? (
          <div style={{ border: '2px dashed rgba(99, 102, 241, 0.4)', borderRadius: '12px', padding: '36px', textAlign: 'center', background: 'rgba(15, 23, 42, 0.5)' }}>
            <FaCloudUploadAlt size={40} color="#818cf8" style={{ marginBottom: '12px' }} />
            <span style={{ display: 'block', fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '12px' }}>Choose a CSV spreadsheet file</span>
            <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} id="csvFileInput" />
            <label htmlFor="csvFileInput" className="btn-gradient-primary" style={{ cursor: 'pointer', padding: '10px 18px', display: 'inline-block' }}>
              Select CSV File
            </label>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaCheck /> Previewing {parsedRows.length} Transactions
            </div>

            <div style={{ maxHeight: '220px', overflowY: 'auto', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '10px', padding: '10px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '16px' }}>
              <table style={{ width: '100%', fontSize: '0.75rem', textAlign: 'left', color: '#cbd5e1' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(0, 10).map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '6px 0' }}>{r.date}</td>
                      <td style={{ padding: '6px 0', color: '#fff' }}>{r.description}</td>
                      <td style={{ padding: '6px 0' }}>{r.category}</td>
                      <td style={{ padding: '6px 0', fontWeight: 700, color: r.type === 'income' ? '#10b981' : '#ef4444' }}>₹{r.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-glass-secondary" style={{ flex: 1 }} onClick={() => setParsedRows([])}>
                Cancel & Change
              </button>

              <button className="btn-gradient-primary" style={{ flex: 1, background: '#10b981' }} onClick={handleImportConfirm} disabled={loading}>
                {loading ? 'Importing...' : `Import ${parsedRows.length} Rows`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CsvImportModal;
