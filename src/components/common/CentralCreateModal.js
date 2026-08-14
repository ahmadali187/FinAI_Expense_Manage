import React, { useState } from 'react';
import { FiX, FiMinusCircle, FiPlusCircle } from 'react-icons/fi';
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Add Transaction</h2>
              <p className="text-sm text-slate-400">Select transaction type to record</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSelectType('expense')}
                className="flex flex-col items-center justify-center p-6 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition group"
              >
                <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <FiMinusCircle className="w-6 h-6" />
                </div>
                <span className="font-semibold text-red-400 text-base mb-1">+ Add Expense</span>
                <span className="text-xs text-slate-400">Outflow record</span>
              </button>

              <button
                onClick={() => handleSelectType('income')}
                className="flex flex-col items-center justify-center p-6 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition group"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <FiPlusCircle className="w-6 h-6" />
                </div>
                <span className="font-semibold text-emerald-400 text-base mb-1">+ Add Income</span>
                <span className="text-xs text-slate-400">Inflow record</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CentralCreateModal;
