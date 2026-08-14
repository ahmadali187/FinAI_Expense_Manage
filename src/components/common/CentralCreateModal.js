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
        <ModalPortal isOpen={isOpen} onClose={onClose} title="Add Transaction" maxWidth="440px">
          <div className="text-center mb-6">
            <p className="text-sm text-slate-400">What record type would you like to add?</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleSelectType('expense')}
              className="flex flex-col items-center justify-center p-6 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-2xl transition group cursor-pointer shadow-lg"
            >
              <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <FiMinusCircle className="w-7 h-7" />
              </div>
              <span className="font-bold text-red-400 text-base mb-1">+ Add Expense</span>
              <span className="text-xs text-slate-400">Outflow record</span>
            </button>

            <button
              onClick={() => handleSelectType('income')}
              className="flex flex-col items-center justify-center p-6 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl transition group cursor-pointer shadow-lg"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <FiPlusCircle className="w-7 h-7" />
              </div>
              <span className="font-bold text-emerald-400 text-base mb-1">+ Add Income</span>
              <span className="text-xs text-slate-400">Inflow record</span>
            </button>
          </div>
        </ModalPortal>
      )}
    </>
  );
};

export default CentralCreateModal;
