import React, { useState, useContext, useRef, useEffect } from 'react';
import { FaPaperPlane, FaLightbulb, FaCheck, FaCalculator } from 'react-icons/fa';
import ModalPortal from '../common/ModalPortal';
import { TransactionsContext } from '../../contexts/TransactionsContext';
import { BudgetsContext } from '../../contexts/BudgetsContext';
import * as api from '../../services/api';

const AiAssistantModal = ({ isOpen, onClose }) => {
  const { refreshTransactions } = useContext(TransactionsContext);
  const { refreshBudgets } = useContext(BudgetsContext);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello! I'm FinAI, your smart financial assistant. Ask me anything about your cashflow, top spending categories, budget health, or savings goals!`
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [showBreakdownIdx, setShowBreakdownIdx] = useState(null);
  const [quickPrompts, setQuickPrompts] = useState([
    "What is my net balance?",
    "Where am I spending the most?",
    "Can I afford a ₹15,000 purchase?"
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      api.getAiQuickQuestions()
        .then(res => {
          if (res && Array.isArray(res.questions) && res.questions.length > 0) {
            setQuickPrompts(res.questions);
          }
        })
        .catch(err => console.error('Failed to load dynamic AI questions:', err));
    }
  }, [isOpen]);

  const handleSend = async (queryOverride) => {
    const queryToSend = typeof queryOverride === 'string' ? queryOverride : input;
    if (!queryToSend.trim() || loading) return;

    const userMsg = queryToSend.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.sendAiChat(userMsg);
      if (typeof res === 'object' && res.reply) {
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: res.reply,
          proposal: res.action_proposal || null,
          classification: res.classification || 'FACT',
          breakdown: res.breakdown || null,
          actions: res.actions || []
        }]);
      } else {
        setMessages(prev => [...prev, { sender: 'ai', text: String(res) }]);
      }
    } catch (err) {
      console.error('Error sending AI chat:', err);
      setMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I had trouble processing your query. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmProposal = async (proposal, msgIdx) => {
    try {
      setLoading(true);
      await api.confirmAiAction(proposal);
      refreshTransactions();
      refreshBudgets();
      setMessages(prev => prev.map((m, idx) => idx === msgIdx ? { ...m, proposalConfirmed: true } : m));
    } catch (err) {
      console.error('Error confirming AI action:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (act) => {
    if (act.query) {
      handleSend(act.query);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose} title="FinAI Financial Assistant" maxWidth="560px">
      <div className="space-y-4">
        {/* Messages List */}
        <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[88%] ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white ml-auto rounded-br-xs shadow-md'
                  : 'bg-slate-800/90 border border-slate-700/70 text-slate-200 mr-auto rounded-bl-xs shadow-md'
              }`}
            >
              <div className="whitespace-pre-line">{m.text}</div>

              {/* Source/Calculation Breakdown Toggle */}
              {(m.breakdown || m.classification === 'CALCULATION' || m.classification === 'RECOMMENDATION') && m.sender === 'ai' && (
                <div className="mt-2 pt-2 border-t border-slate-700/50">
                  <button
                    onClick={() => setShowBreakdownIdx(showBreakdownIdx === idx ? null : idx)}
                    className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <FaCalculator className="text-xs" /> {showBreakdownIdx === idx ? 'Hide breakdown' : 'View calculation details'}
                  </button>
                  {showBreakdownIdx === idx && (
                    <div className="mt-2 bg-slate-900/90 p-3 rounded-xl border border-indigo-500/30 text-xs space-y-1.5 text-slate-300">
                      <div><strong className="text-white">Type:</strong> {m.classification}</div>
                      {m.breakdown && (
                        <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                          <div>Balance: ₹{m.breakdown.current_balance?.toLocaleString('en-IN')}</div>
                          <div>Commitments: ₹{m.breakdown.upcoming_commitments?.toLocaleString('en-IN')}</div>
                          <div>Available: ₹{m.breakdown.estimated_available_amount?.toLocaleString('en-IN')}</div>
                          <div>Purchase: ₹{m.breakdown.purchase_amount?.toLocaleString('en-IN')}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Contextual Action Buttons */}
              {m.actions && m.actions.length > 0 && m.sender === 'ai' && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {m.actions.map((act, aIdx) => (
                    <button
                      key={aIdx}
                      onClick={() => handleActionClick(act)}
                      className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 rounded-lg text-xs font-medium transition"
                    >
                      {act.label} →
                    </button>
                  ))}
                </div>
              )}

              {/* AI Proposed Action Card */}
              {m.proposal && !m.proposalConfirmed && (
                <div className="mt-3 p-3 bg-slate-900/90 border border-emerald-500/40 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-emerald-400">AI Proposed Action</div>
                  <button
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow transition flex items-center gap-1.5"
                    onClick={() => handleConfirmProposal(m.proposal, idx)}
                    disabled={loading}
                  >
                    <FaCheck /> Confirm & Execute
                  </button>
                </div>
              )}
              {m.proposalConfirmed && (
                <div className="mt-2 text-xs font-bold text-emerald-400 flex items-center gap-1">
                  ✓ Executed successfully in database
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Quick Prompt Chips */}
        <div className="flex flex-wrap gap-1.5 py-1">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <FaLightbulb className="text-amber-400 text-xs" /> {prompt}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 pt-1">
          <input
            type="text"
            className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
            placeholder="Ask FinAI about your cashflow, budgets..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center"
          >
            <FaPaperPlane className="text-sm" />
          </button>
        </form>
      </div>
    </ModalPortal>
  );
};

export default AiAssistantModal;
