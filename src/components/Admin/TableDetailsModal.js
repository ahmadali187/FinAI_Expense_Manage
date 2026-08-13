import React, { useState, useEffect } from 'react';
import { FaTimes, FaTable, FaShieldAlt, FaSyncAlt, FaExclamationTriangle } from 'react-icons/fa';
import * as api from '../../services/api';

const TableDetailsModal = ({ tableName, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tableName) return;

    const fetchTableInfo = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.getAdminTableDetail(tableName);
        setData(res);
      } catch (err) {
        setError(err.message || `Failed to load schema for table '${tableName}'.`);
      } finally {
        setLoading(false);
      }
    };

    fetchTableInfo();
  }, [tableName]);

  if (!tableName) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '850px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
        
        {/* Header */}
        <div style={{ padding: '18px 24px', background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(15, 23, 42, 0.95))', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaTable size={24} color="#818cf8" />
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.15rem' }}>SQLite Table: `{tableName}`</h3>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Total Records: <strong>{data?.count || 0}</strong> | Columns: <strong>{data?.columns?.length || 0}</strong>
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#fff' }}>
            <FaSyncAlt className="fa-spin" size={32} color="#6366f1" />
            <p style={{ marginTop: '12px', color: '#94a3b8' }}>Inspecting SQLite table schema...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '40px', color: '#fca5a5', textAlign: 'center' }}>
            <FaExclamationTriangle size={32} color="#ef4444" />
            <p style={{ marginTop: '10px' }}>{error}</p>
          </div>
        ) : (
          <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Columns Schema Table */}
            <div>
              <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '0.95rem' }}>Column Definitions & Types</h4>
              <div style={{ overflowX: 'auto' }}>
                <table className="glass-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                      <th style={{ padding: '8px' }}>Column Name</th>
                      <th style={{ padding: '8px' }}>Data Type</th>
                      <th style={{ padding: '8px' }}>Nullable</th>
                      <th style={{ padding: '8px' }}>Primary Key</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.columns.map((col, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#cbd5e1' }}>
                        <td style={{ padding: '8px', fontWeight: 600, color: col.pk ? '#818cf8' : '#fff' }}>{col.name}</td>
                        <td style={{ padding: '8px' }}><code>{col.type}</code></td>
                        <td style={{ padding: '8px' }}>{col.notnull ? 'NO' : 'YES'}</td>
                        <td style={{ padding: '8px' }}>{col.pk ? <span style={{ color: '#34d399', fontWeight: 700 }}>YES</span> : 'NO'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Safe Record Preview Table */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, color: '#fff', fontSize: '0.95rem' }}>Safe Recent Record Preview (Top 10)</h4>
                <span style={{ fontSize: '0.75rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FaShieldAlt /> Sensitive hashes redacted
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="glass-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                      {data.columns.map((col, idx) => (
                        <th key={idx} style={{ padding: '8px', whiteSpace: 'nowrap' }}>{col.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_records.map((rec, rIdx) => (
                      <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#cbd5e1' }}>
                        {data.columns.map((col, cIdx) => (
                          <td key={cIdx} style={{ padding: '8px', whiteSpace: 'nowrap', color: rec[col.name] === '[REDACTED]' ? '#fca5a5' : '#cbd5e1' }}>
                            {String(rec[col.name] ?? 'NULL')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default TableDetailsModal;
