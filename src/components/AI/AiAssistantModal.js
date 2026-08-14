import React, { useState, useContext, useRef, useEffect } from 'react';
import { FaRobot, FaPaperPlane, FaTimes, FaLightbulb, FaCheck, FaCalculator } from 'react-icons/fa';
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

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

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

  const [quickPrompts, setQuickPrompts] = useState([
    "What is my net balance?",
    "Where am I spending the most?",
    "Can I afford a ₹15,000 purchase?"
  ]);

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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-glass-container" style={{ maxWidth: '560px', background: '#0f172a', border: '1px solid rgba(99, 102, 241, 0.4)' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <FaRobot size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>FinAI Advisor</h3>
              <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ● Connected • SQLite Database Grounded
              </span>
            </div>
          </div>
          <FaTimes style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={onClose} />
        </div>

        <div className="modal-body">
          <div className="chat-messages" style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((m, idx) => (
              <div key={idx} className={`chat-bubble ${m.sender === 'user' ? 'chat-user' : 'chat-ai'}`}>
                <div style={{ whiteSpace: 'pre-line' }}>{m.text}</div>

                {/* Optional Source/Calculation Breakdown Toggle */}
                {(m.breakdown || m.classification === 'CALCULATION' || m.classification === 'RECOMMENDATION') && m.sender === 'ai' && (
                  <div style={{ marginTop: '8px' }}>
                    <button
                      onClick={() => setShowBreakdownIdx(showBreakdownIdx === idx ? null : idx)}
                      style={{ background: 'transparent', border: 'none', color: '#818cf8', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: 0 }}
                    >
                      <FaCalculator size={11} /> {showBreakdownIdx === idx ? 'Hide source details' : 'View calculation source'}
                    </button>
                    {showBreakdownIdx === idx && (
                      <div style={{ marginTop: '6px', background: 'rgba(15, 23, 42, 0.8)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.75rem', color: '#cbd5e1', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                        <div><strong>Type:</strong> {m.classification}</div>
                        {m.breakdown && (
                          <div style={{ marginTop: '4px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                            <div>Net Balance: ₹{m.breakdown.current_balance?.toLocaleString()}</div>
                            <div>Commitments: ₹{m.breakdown.upcoming_commitments?.toLocaleString()}</div>
                            <div>Available: ₹{m.breakdown.estimated_available_amount?.toLocaleString()}</div>
                            <div>Purchase: ₹{m.breakdown.purchase_amount?.toLocaleString()}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Render Contextual Action Buttons */}
                {m.actions && m.actions.length > 0 && m.sender === 'ai' && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {m.actions.map((act, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => handleActionClick(act)}
                        style={{ background: 'rgba(99, 102, 241, 0.2)', border: '1px solid #818cf8', color: '#fff', borderRadius: '12px', padding: '3px 8px', fontSize: '0.72rem', cursor: 'pointer' }}
                      >
                        {act.label} →
                      </button>
                    ))}
                  </div>
                )}

                {/* AI Proposed Action Card */}
                {m.proposal && !m.proposalConfirmed && (
                  <div style={{ marginTop: '10px', background: 'rgba(15, 23, 42, 0.8)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, marginBottom: '6px' }}>AI Proposed Action</div>
                    <button
                      className="btn-gradient-primary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#10b981' }}
                      onClick={() => handleConfirmProposal(m.proposal, idx)}
                      disabled={loading}
                    >
                      <FaCheck /> Confirm & Execute
                    </button>
                  </div>
                )}
                {m.proposalConfirmed && (
                  <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                    ✓ Confirmed & Executed in SQLite
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div style={{ margin: '14px 0 10px 0', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                style={{
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  color: '#ffffff',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <FaLightbulb color="#f59e0b" size={10} /> {prompt}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="glass-input"
              style={{ background: '#1e293b', color: '#ffffff' }}
              placeholder="Ask FinAI financial questions..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="btn-gradient-primary" style={{ padding: '0 18px' }} disabled={loading || !input.trim()}>
              <FaPaperPlane />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantModal;
