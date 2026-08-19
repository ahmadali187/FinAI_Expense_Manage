import React, { useState, useEffect, useContext, useCallback } from 'react';
import { CurrencyContext } from '../../contexts/CurrencyContext';
import * as api from '../../services/api';
import { FaLandmark, FaPlus, FaCreditCard, FaCoins } from 'react-icons/fa';

const NetWorthTracker = () => {
  const { formatAmount } = useContext(CurrencyContext);
  const [netWorthData, setNetWorthData] = useState({ net_worth: 0, total_assets: 0, total_liabilities: 0, assets: [], liabilities: [] });
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemType, setItemType] = useState('asset'); // 'asset' or 'liability'
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchNetWorth = useCallback(async () => {
    try {
      const data = await api.getNetWorthData();
      setNetWorthData(data);
    } catch (err) {
      console.error('Error fetching Net Worth data:', err);
    }
  }, []);

  useEffect(() => {
    fetchNetWorth();
  }, [fetchNetWorth]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!name || !amount) return;

    try {
      setLoading(true);
      if (itemType === 'asset') {
        await api.addAsset({ name, category: category || 'Bank', value: parseFloat(amount) });
      } else {
        await api.addLiability({ name, category: category || 'Credit Card', amount: parseFloat(amount) });
      }
      setName('');
      setAmount('');
      setCategory('');
      setShowAddModal(false);
      fetchNetWorth();
    } catch (err) {
      console.error('Error adding Net Worth item:', err);
    } finally {
      setLoading(false);
    }
  };

  const { net_worth = 0, total_assets = 0, total_liabilities = 0, assets = [], liabilities = [] } = netWorthData;

  return (
    <div className="glass-card" style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaLandmark size={20} color="#10b981" />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary, #ffffff)' }}>Net Worth & Debt Tracker</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>Formula: <strong>Net Worth = Assets - Liabilities</strong></span>
          </div>
        </div>

        <button
          className="btn-gradient-primary"
          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          onClick={() => setShowAddModal(prev => !prev)}
        >
          <FaPlus /> {showAddModal ? 'Close Form' : 'Add Asset / Debt'}
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '16px' }}>
        <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '14px', borderRadius: '12px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaCoins color="#10b981" /> Total Assets
          </span>
          <strong style={{ fontSize: '1.3rem', color: '#10b981', display: 'block', marginTop: '4px' }}>{formatAmount(total_assets)}</strong>
        </div>

        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '14px', borderRadius: '12px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaCreditCard color="#ef4444" /> Total Liabilities / Debt
          </span>
          <strong style={{ fontSize: '1.3rem', color: '#ef4444', display: 'block', marginTop: '4px' }}>{formatAmount(total_liabilities)}</strong>
        </div>

        <div style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '14px', borderRadius: '12px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', display: 'block' }}>Total Net Worth</span>
          <strong style={{ fontSize: '1.3rem', color: net_worth >= 0 ? 'var(--text-primary, #ffffff)' : '#ef4444', display: 'block', marginTop: '4px' }}>{formatAmount(net_worth)}</strong>
        </div>
      </div>

      {showAddModal && (
        <form onSubmit={handleAddSubmit} style={{ background: 'var(--surface-glass, rgba(15, 23, 42, 0.8))', padding: '14px', borderRadius: '12px', marginBottom: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          <select
            className="glass-input"
            value={itemType}
            onChange={e => setItemType(e.target.value)}
          >
            <option value="asset">Asset (Property, Bank, Gold)</option>
            <option value="liability">Liability (Credit Card, Loan)</option>
          </select>
          <input
            type="text"
            className="glass-input"
            placeholder="Name (e.g. HDFC Savings)"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            type="number"
            className="glass-input"
            placeholder="Value / Amount (₹)"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            step="0.01"
          />
          <button type="submit" className="btn-gradient-primary" disabled={loading} style={{ padding: '8px', fontSize: '0.8rem' }}>
            {loading ? 'Saving...' : 'Save Record'}
          </button>
        </form>
      )}

      {/* Assets & Liabilities List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#10b981' }}>Assets ({assets.length})</h4>
          {assets.map(a => (
            <div key={a.id} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 12px', borderRadius: '8px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{a.name} ({a.category})</span>
              <strong style={{ fontSize: '0.85rem', color: '#10b981' }}>{formatAmount(a.value)}</strong>
            </div>
          ))}
        </div>

        <div>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#ef4444' }}>Liabilities ({liabilities.length})</h4>
          {liabilities.map(l => (
            <div key={l.id} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 12px', borderRadius: '8px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{l.name} ({l.category})</span>
              <strong style={{ fontSize: '0.85rem', color: '#ef4444' }}>{formatAmount(l.amount)}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NetWorthTracker;
