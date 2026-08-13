import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaPlus, FaRobot, FaDownload, FaChartBar, FaExchangeAlt, FaPiggyBank, FaTimes } from 'react-icons/fa';

const CommandPalette = ({ isOpen, onClose, onOpenAi, onOpenAddModal, onOpenCurrencyModal, onOpenReceiptScanner }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const commands = [
    { id: 'add-expense', title: 'Add New Expense / Income', icon: <FaPlus />, action: () => { onOpenAddModal(); onClose(); } },
    { id: 'ai-assistant', title: 'Ask FinAI Assistant', icon: <FaRobot />, action: () => { onOpenAi(); onClose(); } },
    { id: 'scan-receipt', title: 'Scan Receipt (AI OCR)', icon: <FaDownload />, action: () => { onOpenReceiptScanner(); onClose(); } },
    { id: 'currency', title: 'Switch Currency (USD, EUR, INR...)', icon: <FaExchangeAlt />, action: () => { onOpenCurrencyModal(); onClose(); } },
    { id: 'goto-dashboard', title: 'Go to Dashboard', icon: <FaChartBar />, action: () => { navigate('/dashboard'); onClose(); } },
    { id: 'goto-reports', title: 'View Reports & Analytics', icon: <FaChartBar />, action: () => { navigate('/report'); onClose(); } },
    { id: 'goto-settings', title: 'Manage Categories & Settings', icon: <FaPiggyBank />, action: () => { navigate('/settings'); onClose(); } },
  ];

  const filteredCommands = commands.filter(cmd => cmd.title.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (isOpen) {
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowDown') {
          setSelectedIndex(prev => (prev + 1) % (filteredCommands.length || 1));
        }
        if (e.key === 'ArrowUp') {
          setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
        }
        if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  if (!isOpen) return null;

  return (
    <div className="cmd-palette-backdrop" onClick={onClose}>
      <div className="cmd-palette-box" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--surface-glass-border)' }}>
          <FaSearch style={{ color: 'var(--text-muted)', marginRight: '12px' }} />
          <input
            type="text"
            placeholder="Type a command or search (e.g. Add Expense, Ask AI...)..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            autoFocus
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '1.05rem',
              width: '100%',
              outline: 'none'
            }}
          />
          <FaTimes style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={onClose} />
        </div>

        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, idx) => (
              <div
                key={cmd.id}
                className={`cmd-palette-item ${idx === selectedIndex ? 'active' : ''}`}
                onClick={cmd.action}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: 'var(--primary-glow)', fontSize: '1.1rem' }}>{cmd.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{cmd.title}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Action</span>
              </div>
            ))
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No matching commands found.</div>
          )}
        </div>
        <div style={{ padding: '10px 20px', background: 'rgba(0,0,0,0.2)', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Navigation: ↑ ↓ arrows</span>
          <span>Execute: Enter</span>
          <span>Close: Esc</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
