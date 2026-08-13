import React, { useState } from 'react';
import { parseQuickAdd, addTransaction } from '../../services/api';
import { FaMagic, FaTimes, FaCheck } from 'react-icons/fa';

const QuickAddExpenseModal = ({ isOpen, onClose, onAdded }) => {
  const [text, setText] = useState('');
  const [parsedTx, setParsedTx] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleParse = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      setLoading(true);
      setError('');
      const result = await parseQuickAdd(text);
      setParsedTx(result);
    } catch (err) {
      console.error('Quick Add parse error:', err);
      setError('Failed to parse text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!parsedTx) return;

    try {
      setLoading(true);
      await addTransaction({
        type: parsedTx.type || 'expense',
        amount: parsedTx.amount || 0,
        category: parsedTx.category || 'Other',
        description: parsedTx.description || text,
        date: parsedTx.date || new Date().toISOString().split('T')[0]
      });

      if (onAdded) onAdded();
      setText('');
      setParsedTx(null);
      onClose();
    } catch (err) {
      console.error('Error saving parsed transaction:', err);
      setError('Failed to save transaction to SQLite database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-glass-container"
        style={{
          maxWidth: '460px',
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
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaMagic color="#ffffff" size={16} />
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
              FinAI Quick Add
            </span>
          </div>
          <FaTimes style={{ cursor: 'pointer', color: '#94a3b8', fontSize: '1.2rem' }} onClick={onClose} />
        </div>

        <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '16px', lineHeight: 1.4 }}>
          Type any sentence like <em>"Spent 450 at Starbucks today"</em> or <em>"Earned 12500 stock dividend"</em>.
        </p>

        {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</div>}

        {!parsedTx ? (
          <form onSubmit={handleParse} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="text"
              className="glass-input"
              style={{ background: 'rgba(30, 41, 59, 0.9)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '12px', fontSize: '0.95rem' }}
              placeholder="e.g. Spent 450 at Starbucks today"
              value={text}
              onChange={e => setText(e.target.value)}
              required
              autoFocus
            />

            <button
              type="submit"
              className="btn-gradient-primary"
              disabled={loading}
              style={{ padding: '12px', width: '100%', fontWeight: 700 }}
            >
              {loading ? 'AI Parsing...' : 'Parse Transaction with FinAI'}
            </button>
          </form>
        ) : (
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaCheck /> FinAI Parsed Result ({parsedTx.confidence}% Confidence)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '16px' }}>
              <div><strong>Type:</strong> <span style={{ color: parsedTx.type === 'income' ? '#10b981' : '#ef4444', textTransform: 'capitalize' }}>{parsedTx.type}</span></div>
              <div><strong>Amount:</strong> <span style={{ color: '#ffffff', fontWeight: 700 }}>₹{parsedTx.amount}</span></div>
              <div><strong>Category:</strong> <span style={{ color: '#ffffff' }}>{parsedTx.category}</span></div>
              <div><strong>Date:</strong> <span style={{ color: '#ffffff' }}>{parsedTx.date}</span></div>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '16px' }}>
              Description: "{parsedTx.description}"
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn-glass-secondary"
                style={{ flex: 1 }}
                onClick={() => setParsedTx(null)}
              >
                Re-type
              </button>

              <button
                type="button"
                className="btn-gradient-primary"
                style={{ flex: 1, background: '#10b981' }}
                onClick={handleConfirmSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickAddExpenseModal;
