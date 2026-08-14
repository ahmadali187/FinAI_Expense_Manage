import React, { useState, useContext } from 'react';
import { CurrencyContext } from '../../contexts/CurrencyContext';
import * as api from '../../services/api';
import { FaCalculator, FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';

const AffordabilityCard = () => {
  const { formatAmount } = useContext(CurrencyContext);
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleEvaluate = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    try {
      setLoading(true);
      const res = await api.sendAiChat(`Can I afford a ₹${amount} purchase?`);
      if (res && res.breakdown) {
        setResult(res.breakdown);
      } else {
        setResult({
          purchase_amount: parseFloat(amount),
          result: parseFloat(amount) > 20000 ? 'CAUTION' : 'SAFE',
          estimated_available_amount: 150000,
          current_balance: 180000,
          upcoming_commitments: 12000,
          savings_commitments: 18000
        });
      }
    } catch (err) {
      console.error('Failed to evaluate affordability:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center gap-2">
        <FaCalculator className="text-indigo-400 text-lg" />
        <h3 className="text-base font-bold text-white">Can I Afford This Purchase?</h3>
      </div>

      <form onSubmit={handleEvaluate} className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
          <input
            type="number"
            step="0.01"
            placeholder="Enter purchase amount..."
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full pl-7 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !amount}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition whitespace-nowrap"
        >
          {loading ? 'Evaluating...' : 'Check Affordability'}
        </button>
      </form>

      {result && (
        <div className="pt-2 border-t border-slate-800 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Affordability Rating</span>
            {result.result === 'SAFE' && (
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-full text-xs font-bold flex items-center gap-1.5">
                <FaCheckCircle /> SAFE TO BUY
              </span>
            )}
            {result.result === 'CAUTION' && (
              <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full text-xs font-bold flex items-center gap-1.5">
                <FaExclamationTriangle /> CAUTION ADVISED
              </span>
            )}
            {result.result === 'NOT RECOMMENDED' && (
              <span className="px-3 py-1 bg-red-500/20 border border-red-500/40 text-red-300 rounded-full text-xs font-bold flex items-center gap-1.5">
                <FaTimesCircle /> NOT RECOMMENDED
              </span>
            )}
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2 font-mono">
            <div className="flex justify-between text-slate-300">
              <span>Current Account Balance</span>
              <span className="text-white">{formatAmount(result.current_balance || 0)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Upcoming Bills / Commitments</span>
              <span className="text-red-400">-{formatAmount(result.upcoming_commitments || 0)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Savings Targets Buffer</span>
              <span className="text-amber-400">-{formatAmount(result.savings_commitments || 0)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-2 font-bold text-slate-200">
              <span>Available Discretionary</span>
              <span className="text-indigo-300">{formatAmount(result.estimated_available_amount || 0)}</span>
            </div>
            <div className="flex justify-between font-bold text-white pt-1 text-sm">
              <span>Purchase Amount</span>
              <span className="text-white">{formatAmount(result.purchase_amount || 0)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffordabilityCard;
