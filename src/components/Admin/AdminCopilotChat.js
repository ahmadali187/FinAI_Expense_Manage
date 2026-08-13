import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRobot, FaPaperPlane, FaTrash, FaDatabase, FaLightbulb, FaSyncAlt, FaChartBar, FaUser } from 'react-icons/fa';
import * as api from '../../services/api';

const SUGGESTED_QUESTIONS = [
  "Total users?",
  "Who are the admins?",
  "Total transactions?",
  "Show total income and expenses",
  "Which user has the highest spending?",
  "Which category has the highest spending?",
  "Show category spending",
  "How many budgets are exceeded?",
  "Show database health",
  "Show recent activity"
];

const AdminCopilotChat = ({ onSelectUser }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "🤖 Hello Administrator! I am your FinAI Admin Copilot analyst, connected directly to SQLite (`backend/finai.db`). Ask me any questions regarding metrics, user activity, spending trends, or database health.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryToSend) => {
    const query = (queryToSend || inputQuery).trim();
    if (!query || loading) return;

    const userMsg = {
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryToSend) setInputQuery('');
    setLoading(true);

    try {
      const res = await api.postAdminAiChat(query);
      const replyText = typeof res === 'object' ? (res.reply || res.message) : res;

      const aiMsg = {
        sender: 'assistant',
        text: replyText || "I couldn't retrieve that administrative information from SQLite.",
        type: res?.type,
        headers: res?.headers,
        rows: res?.rows,
        actions: res?.actions,
        chart: res?.chart,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: `⚠️ Admin Query Error: ${err.message || "Failed to execute database administrative query."}`,
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        sender: 'assistant',
        text: "🤖 FinAI Admin Copilot session cleared. Ask me any administrative question about SQLite data, users, or metrics.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleActionClick = (act) => {
    if (act.user_id && onSelectUser) {
      onSelectUser(act.user_id);
    } else if (act.tab) {
      navigate(`/admin/${act.tab === 'overview' ? '' : act.tab}`);
    } else if (act.query) {
      handleSend(act.query);
    }
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      let formatted = line;
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
      formatted = formatted.replace(/`(.*?)`/g, '<code style="background: rgba(99, 102, 241, 0.2); padding: 2px 5px; borderRadius: 4px; color: #a5b4fc;">$1</code>');

      return (
        <p key={idx} style={{ margin: '4px 0', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    });
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '620px', padding: '0', overflow: 'hidden', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'rgba(30, 27, 75, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaRobot size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>FinAI Admin Copilot Analyst</h3>
            <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
              <FaDatabase size={10} /> Connected to SQLite (`finai.db`)
            </span>
          </div>
        </div>

        <button className="btn-glass-secondary" onClick={clearChat} style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FaTrash /> Clear Chat
        </button>
      </div>

      {/* Suggested Questions Bar */}
      <div style={{ padding: '10px 16px', background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', alignSelf: 'center', flexShrink: 0 }}>
          <FaLightbulb color="#eab308" /> Suggestions:
        </span>
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              color: '#c7d2fe',
              padding: '4px 10px',
              borderRadius: '16px',
              fontSize: '0.78rem',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.borderColor = '#818cf8'}
            onMouseOut={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.25)'}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Container */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(15, 23, 42, 0.4)' }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderRadius: msg.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                background: msg.sender === 'user' ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : msg.isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(30, 41, 59, 0.9)',
                border: msg.sender === 'user' ? 'none' : msg.isError ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '0.9rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              {renderFormattedText(msg.text)}

              {/* Render Table Data */}
              {(msg.type === 'table' || msg.type === 'transaction_list' || msg.type === 'user_list' || msg.type === 'admin_list') && msg.headers && msg.rows && (
                <div style={{ marginTop: '10px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '6px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#818cf8' }}>
                        {msg.headers.map((h, hIdx) => (
                          <th key={hIdx} style={{ padding: '6px 8px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {msg.rows.map((row, rIdx) => (
                        <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#cbd5e1' }}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} style={{ padding: '6px 8px' }}>{String(cell)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Render AI Chart Data */}
              {msg.chart && (
                <div style={{ marginTop: '12px', background: 'rgba(15, 23, 42, 0.7)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#818cf8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaChartBar /> {msg.chart.title || 'Data Visualization'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {msg.chart.labels?.map((label, idx) => {
                      const val = msg.chart.values[idx] || 0;
                      const maxVal = Math.max(...msg.chart.values, 1);
                      const pct = Math.min(100, Math.round((val / maxVal) * 100));
                      return (
                        <div key={idx} style={{ fontSize: '0.78rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', marginBottom: '2px' }}>
                            <span>{label}</span>
                            <span style={{ fontWeight: 700 }}>₹{val.toLocaleString()}</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #34d399)', borderRadius: '4px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Render Clickable Action Buttons */}
              {msg.actions && msg.actions.length > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {msg.actions.map((act, aIdx) => (
                    <button
                      key={aIdx}
                      onClick={() => handleActionClick(act)}
                      className="btn-glass-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid #818cf8', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      {act.user_id && <FaUser size={10} />}
                      {act.label} →
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', padding: '0 4px' }}>
              {msg.timestamp}
            </span>
          </div>
        ))}

        {loading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'rgba(30, 41, 59, 0.7)', borderRadius: '16px', color: '#a5b4fc', fontSize: '0.85rem' }}>
            <FaSyncAlt className="fa-spin" /> Querying SQLite Database...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <div style={{ padding: '14px 16px', background: 'rgba(30, 27, 75, 0.9)', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Admin Copilot: 'Show category spending', 'Total income vs expense', 'Top users'..."
          disabled={loading}
          style={{
            flex: 1,
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#ffffff',
            fontSize: '0.9rem',
            outline: 'none'
          }}
        />
        <button
          className="btn-gradient-primary"
          onClick={() => handleSend()}
          disabled={loading || !inputQuery.trim()}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '46px', height: '42px', padding: '0', borderRadius: '8px' }}
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default AdminCopilotChat;
