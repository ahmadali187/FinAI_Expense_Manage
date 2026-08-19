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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Messages Scroll Area */}
        <div style={{
          maxHeight: '360px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingRight: '4px'
        }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: m.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.sender === 'user' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'var(--surface-glass, rgba(30, 41, 59, 0.85))',
                  border: m.sender === 'user' ? 'none' : '1px solid var(--surface-glass-border, rgba(255, 255, 255, 0.1))',
                  color: m.sender === 'user' ? '#ffffff' : 'var(--text-primary, #ffffff)',
                  fontSize: '0.88rem',
                  lineHeight: 1.5,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ whiteSpace: 'pre-line' }}>{m.text}</div>

                {/* Calculation Breakdown */}
                {(m.breakdown || m.classification === 'CALCULATION' || m.classification === 'RECOMMENDATION') && m.sender === 'ai' && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <button
                      type="button"
                      onClick={() => setShowBreakdownIdx(showBreakdownIdx === idx ? null : idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#818cf8',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: 0
                      }}
                    >
                      <FaCalculator /> {showBreakdownIdx === idx ? 'Hide breakdown' : 'View calculation details'}
                    </button>
                    {showBreakdownIdx === idx && (
                      <div style={{
                        marginTop: '8px',
                        background: 'var(--surface-glass, rgba(15, 23, 42, 0.9))',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary, #cbd5e1)'
                      }}>
                        <div><strong style={{ color: 'var(--text-primary, #ffffff)' }}>Type:</strong> {m.classification}</div>
                        {m.breakdown && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '6px' }}>
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

                {/* Contextual Actions */}
                {m.actions && m.actions.length > 0 && m.sender === 'ai' && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {m.actions.map((act, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => handleActionClick(act)}
                        style={{
                          background: 'rgba(99, 102, 241, 0.2)',
                          border: '1px solid rgba(99, 102, 241, 0.4)',
                          color: '#c7d2fe',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {act.label} →
                      </button>
                    ))}
                  </div>
                )}

                {/* Proposal Action Card */}
                {m.proposal && !m.proposalConfirmed && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '10px'
                  }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#34d399', marginBottom: '6px' }}>
                      AI Proposed Action
                    </div>
                    <button
                      onClick={() => handleConfirmProposal(m.proposal, idx)}
                      disabled={loading}
                      style={{
                        padding: '6px 14px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <FaCheck /> Confirm & Execute
                    </button>
                  </div>
                )}
                {m.proposalConfirmed && (
                  <div style={{ marginTop: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#34d399' }}>
                    ✓ Executed successfully in database
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Quick Prompt Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '4px 0' }}>
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              style={{
                padding: '6px 12px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                color: '#c7d2fe',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '9999px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <FaLightbulb color="#fbbf24" size={12} /> {prompt}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
          <input
            type="text"
            placeholder="Ask FinAI about your cashflow, budgets..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              color: '#ffffff',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              padding: '10px 16px',
              background: loading || !input.trim() ? 'rgba(99, 102, 241, 0.4)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              fontWeight: 700,
              border: 'none',
              borderRadius: '10px',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
          >
            <FaPaperPlane size={14} />
          </button>
        </form>

      </div>
    </ModalPortal>
  );
};

export default AiAssistantModal;
