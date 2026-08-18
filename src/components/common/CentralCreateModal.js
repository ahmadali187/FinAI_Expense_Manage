import React, { useState } from 'react';
import { FiMinusCircle, FiPlusCircle } from 'react-icons/fi';
import ModalPortal from './ModalPortal';
import AddTransactionModal from '../Dashboard/AddTransactionModal';

const CentralCreateModal = ({ isOpen, onClose, onTransactionAdded }) => {
  const [activeType, setActiveType] = useState(null); // 'expense' or 'income'

  if (!isOpen) return null;

  const handleSelectType = (type) => {
    setActiveType(type);
  };

  const handleCloseSubModal = () => {
    setActiveType(null);
    onClose();
  };

  return (
    <>
      {activeType ? (
        <AddTransactionModal
          isOpen={true}
          onClose={handleCloseSubModal}
          initialType={activeType}
          onTransactionAdded={onTransactionAdded}
        />
      ) : (
        <ModalPortal isOpen={isOpen} onClose={onClose} title="Add Transaction" maxWidth="460px">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <p style={{ margin: 0, color: 'var(--text-muted, #94a3b8)', fontSize: '0.9rem' }}>
              What record type would you like to add?
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <button
              type="button"
              onClick={() => handleSelectType('expense')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 16px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px'
              }}>
                <FiMinusCircle style={{ width: '28px', height: '28px' }} />
              </div>
              <span style={{ fontWeight: 800, color: '#f87171', fontSize: '1rem', marginBottom: '4px', display: 'block' }}>
                + Add Expense
              </span>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block' }}>
                Outflow record
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType('income')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 16px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px'
              }}>
                <FiPlusCircle style={{ width: '28px', height: '28px' }} />
              </div>
              <span style={{ fontWeight: 800, color: '#34d399', fontSize: '1rem', marginBottom: '4px', display: 'block' }}>
                + Add Income
              </span>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block' }}>
                Inflow record
              </span>
            </button>
          </div>
        </ModalPortal>
      )}
    </>
  );
};

export default CentralCreateModal;
