import React, { useState, useEffect, useContext, useRef } from 'react';
import { FaPaperPlane, FaLightbulb, FaCheck, FaCalculator, FaRobot } from 'react-icons/fa';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import { TransactionsContext } from '../../contexts/TransactionsContext';
import { BudgetsContext } from '../../contexts/BudgetsContext';
import * as api from '../../services/api';

const FinAiPage = () => {
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
    "Can I afford a ₹5,000 purchase?",
    "How can I reduce my expenses?",
    "What bills are coming up?"
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    api.getAiQuickQuestions()
      .then(res => {
        if (res && Array.isArray(res.questions) && res.questions.length > 0) {
          setQuickPrompts(res.questions);
        }
      })
      .catch(err => console.error('Failed to load dynamic AI questions:', err));
  }, []);

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

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '1.4rem'
        }}>
          <FaRobot />
        </div>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            FinAI Assistant
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
            Real-time intelligence based strictly on your account balances, spending, and budgets.
          </p>
        </div>
      </div>

      {/* Main Chat Container */}
      <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        {/* Messages Scroll Area */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div
                style={{
                  maxWidth: '82%',
                  padding: '14px 18px',
                  borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.sender === 'user' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'rgba(15, 23, 42, 0.85)',
                  border: msg.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                {/* Header Tag for AI */}
                {msg.sender === 'ai' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Badge variant="indigo" style={{ fontSize: '0.7rem' }}>FinAI Copilot</Badge>
                    {msg.classification && (
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        [{msg.classification}]
                      </span>
                    )}
                  </div>
                )}

                {/* Message Body */}
                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.55, whitespace: 'pre-line' }}>
                  {msg.text}
                </p>

                {/* Affordability Breakdown */}
                {msg.breakdown && (
                  <div style={{ marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setShowBreakdownIdx(showBreakdownIdx === idx ? null : idx)}
                      style={{
                        background: 'rgba(99, 102, 241, 0.2)',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        color: '#818cf8',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <FaCalculator /> {showBreakdownIdx === idx ? 'Hide Calculation' : 'View Affordability Breakdown'}
                    </button>

                    {showBreakdownIdx === idx && (
                      <div style={{
                        marginTop: '8px',
                        padding: '10px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        color: '#cbd5e1'
                      }}>
                        <div>Liquid Balance: <strong>₹{msg.breakdown.liquid_balance?.toLocaleString('en-IN') || 0}</strong></div>
                        <div>Upcoming Obligations: <strong>₹{msg.breakdown.upcoming_bills?.toLocaleString('en-IN') || 0}</strong></div>
                        <div>Safe-to-Spend Limit: <strong>₹{msg.breakdown.safe_to_spend?.toLocaleString('en-IN') || 0}</strong></div>
                      </div>
                    )}
                  </div>
                )}

                {/* Proposal Action Card */}
                {msg.proposal && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '10px'
                  }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                      Action Proposal: {msg.proposal.action}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '10px' }}>
                      {msg.proposal.details}
                    </div>
                    {msg.proposalConfirmed ? (
                      <Badge variant="success"><FaCheck /> Action Confirmed</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleConfirmProposal(msg.proposal, idx)}
                        disabled={loading}
                      >
                        Confirm Action
                      </Button>
                    )}
                  </div>
                )}

                {/* Contextual Quick Actions */}
                {msg.actions && msg.actions.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                    {msg.actions.map((act, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => handleActionClick(act)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#f8fafc',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        {act.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              <FaRobot className="animate-spin" /> FinAI is analyzing your financial records...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Chips */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(15, 23, 42, 0.4)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          <FaLightbulb color="#f59e0b" style={{ minWidth: '16px', marginTop: '4px' }} />
          {quickPrompts.map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleSend(prompt)}
              style={{
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#818cf8',
                padding: '5px 12px',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '10px', padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(15, 23, 42, 0.8)' }}>
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask FinAI anything about your finances (e.g. Can I afford ₹5,000?)..."
            style={{ flex: 1, margin: 0 }}
          />
          <Button type="submit" variant="primary" icon={FaPaperPlane} disabled={loading || !input.trim()}>
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default FinAiPage;
