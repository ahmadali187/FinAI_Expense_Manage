import React, { useState, useContext } from 'react';
import { FaCalculator, FaTimes, FaPlus } from 'react-icons/fa';
import { TransactionsContext } from '../../contexts/TransactionsContext';

const BillSplitterModal = ({ isOpen, onClose }) => {
  const { addTransaction } = useContext(TransactionsContext);

  const [totalAmount, setTotalAmount] = useState('');
  const [description, setDescription] = useState('');
  const [numPeople, setNumPeople] = useState('2');
  const [tipPercent, setTipPercent] = useState('10');
  const [category, setCategory] = useState('Food');

  const calcTotalWithTip = () => {
    const amt = parseFloat(totalAmount) || 0;
    const tip = amt * (parseFloat(tipPercent || 0) / 100);
    return amt + tip;
  };

  const calcPerPerson = () => {
    const total = calcTotalWithTip();
    const people = parseInt(numPeople) || 1;
    return (total / people).toFixed(2);
  };

  const handleSaveMyShare = async () => {
    const perPerson = calcPerPerson();
    if (parseFloat(perPerson) <= 0) return;

    await addTransaction({
      amount: parseFloat(perPerson),
      description: `Split Bill: ${description || 'Group Expense'} (1/${numPeople} share)`,
      category: category,
      type: 'expense',
      date: new Date().toISOString().split('T')[0]
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-glass-container" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaCalculator color="var(--primary-glow)" size={20} />
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Group Bill Splitter</h3>
          </div>
          <FaTimes style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={onClose} />
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bill Description</label>
            <input className="glass-input" placeholder="e.g. Dinner with team" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Bill Amount (₹)</label>
              <input className="glass-input" type="number" placeholder="1000" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Number of People</label>
              <input className="glass-input" type="number" min="1" value={numPeople} onChange={e => setNumPeople(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tip Percentage (%)</label>
              <select className="glass-input" value={tipPercent} onChange={e => setTipPercent(e.target.value)}>
                <option value="0" style={{ background: '#0f172a' }}>0% No Tip</option>
                <option value="5" style={{ background: '#0f172a' }}>5% Tip</option>
                <option value="10" style={{ background: '#0f172a' }}>10% Tip</option>
                <option value="15" style={{ background: '#0f172a' }}>15% Tip</option>
                <option value="20" style={{ background: '#0f172a' }}>20% Tip</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Category</label>
              <select className="glass-input" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="Food" style={{ background: '#0f172a' }}>Food & Dining</option>
                <option value="Entertainment" style={{ background: '#0f172a' }}>Entertainment</option>
                <option value="Transport" style={{ background: '#0f172a' }}>Transport</option>
                <option value="Other" style={{ background: '#0f172a' }}>Other</option>
              </select>
            </div>
          </div>

          <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.2)', textAlign: 'center', marginTop: '10px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>YOUR INDIVIDUAL SHARE</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-glow)', margin: '4px 0' }}>
              ₹{calcPerPerson()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Total with Tip: ₹{calcTotalWithTip().toFixed(2)} | Split among {numPeople} people
            </div>
          </div>

          <button className="btn-gradient-primary" style={{ marginTop: '10px' }} onClick={handleSaveMyShare}>
            <FaPlus /> Save My Share to Expenses
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillSplitterModal;
