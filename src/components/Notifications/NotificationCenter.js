import React, { useState, useEffect, useContext, useCallback } from 'react';
import { TransactionsContext } from '../../contexts/TransactionsContext';
import { BudgetsContext } from '../../contexts/BudgetsContext';
import { UserContext } from '../../contexts/UserContext';
import { generateSmartNotifications } from '../../utils/notificationEngine';
import * as api from '../../services/api';
import { FaBell, FaCalendarCheck, FaExclamationTriangle, FaTrophy, FaTimes } from 'react-icons/fa';

const NotificationCenter = () => {
  const { transactions } = useContext(TransactionsContext);
  const { budgets } = useContext(BudgetsContext);
  const { loggedInUser } = useContext(UserContext);

  const [dbNotifications, setDbNotifications] = useState([]);
  const [readIds, setReadIds] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const fetchDbNotifications = useCallback(async () => {
    if (loggedInUser) {
      try {
        const res = await api.getNotifications();
        setDbNotifications(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    }
  }, [loggedInUser]);

  useEffect(() => {
    fetchDbNotifications();
  }, [fetchDbNotifications]);

  const smartNotifs = generateSmartNotifications(transactions, budgets, [], []);
  
  const allNotifs = [
    ...dbNotifications.map(n => ({
      id: `db_${n.id}`,
      type: n.type || 'info',
      title: n.title,
      message: n.message,
      severity: n.severity || 'info',
      isRead: n.is_read || n.isRead || readIds.includes(`db_${n.id}`)
    })),
    ...smartNotifs.map(n => ({
      ...n,
      isRead: readIds.includes(n.id)
    }))
  ];

  const unreadCount = allNotifs.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id) => {
    if (!readIds.includes(id)) {
      setReadIds(prev => [...prev, id]);
    }
  };

  const handleMarkAllRead = async () => {
    setReadIds(allNotifs.map(n => n.id));
    try {
      await api.markNotificationsRead();
      fetchDbNotifications();
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  const filteredNotifs = allNotifs.filter(n => {
    if (activeTab === 'bills') return n.type === 'bill';
    if (activeTab === 'budgets') return n.type === 'budget';
    if (activeTab === 'milestones') return n.type === 'milestone';
    return true;
  });

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'danger': return { background: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', iconColor: '#ef4444' };
      case 'warning': return { background: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', iconColor: '#f59e0b' };
      case 'success': return { background: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', iconColor: '#10b981' };
      default: return { background: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.3)', iconColor: '#6366f1' };
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'bill': return <FaCalendarCheck />;
      case 'budget': return <FaExclamationTriangle />;
      case 'milestone': return <FaTrophy />;
      default: return <FaBell />;
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-glass-secondary"
        style={{
          position: 'relative',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(30, 41, 59, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px'
        }}
        title="Notifications & Alerts"
      >
        <FaBell size={16} color={unreadCount > 0 ? '#fbbf24' : '#cbd5e1'} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#ef4444',
            color: '#ffffff',
            fontSize: '0.7rem',
            fontWeight: 800,
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '50px',
          width: '360px',
          maxWidth: '90vw',
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
          zIndex: 9999,
          overflow: 'hidden',
          color: '#ffffff'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaBell color="#6366f1" />
              <strong style={{ fontSize: '1rem', fontWeight: 800 }}>Notification Center</strong>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                  Mark All Read
                </button>
              )}
              <FaTimes style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => setIsOpen(false)} />
            </div>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(15, 23, 42, 0.5)' }}>
            {['all', 'bills', 'budgets', 'milestones'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
                  color: activeTab === tab ? '#ffffff' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'capitalize',
                  cursor: 'pointer'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredNotifs.length > 0 ? (
              filteredNotifs.map(n => {
                const style = getSeverityStyle(n.severity);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleMarkAsRead(n.id)}
                    style={{
                      background: n.isRead ? 'rgba(30, 41, 59, 0.4)' : style.background,
                      border: `1px solid ${style.border}`,
                      padding: '10px 12px',
                      borderRadius: '10px',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      opacity: n.isRead ? 0.7 : 1,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ marginTop: '2px', color: style.iconColor }}>
                      {getIcon(n.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary, #f8fafc)', marginBottom: '2px' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #cbd5e1)', lineHeight: 1.3 }}>
                        {n.message}
                      </div>
                    </div>
                    {!n.isRead && (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', marginTop: '6px' }} />
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                No notifications in this category.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
