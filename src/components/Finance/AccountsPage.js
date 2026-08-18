import React, { useState, useEffect, useContext, useCallback } from 'react';
import { CurrencyContext } from '../../contexts/CurrencyContext';
import * as api from '../../services/api';
import { 
  FaWallet, FaUniversity, FaCreditCard, FaMoneyBillWave, FaPlus, 
  FaEdit, FaTrashAlt, FaArchive, FaUndo, FaPiggyBank, FaExclamationTriangle
} from 'react-icons/fa';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

const ACCOUNT_TYPES = [
  { value: 'Bank Account', label: 'Bank Account' },
  { value: 'Credit Card', label: 'Credit Card' },
  { value: 'Cash', label: 'Cash / Physical Wallet' },
  { value: 'UPI Wallet', label: 'UPI / Digital Wallet' },
  { value: 'Savings / Investment', label: 'Savings & Investment' },
  { value: 'Other', label: 'Other' }
];

const AccountsPage = () => {
  const { formatAmount } = useContext(CurrencyContext);
  const [accounts, setAccounts] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAcc, setEditingAcc] = useState(null);
  
  // Safe Delete Modal State
  const [deleteConfirmAcc, setDeleteConfirmAcc] = useState(null);
  const [txCountNotice, setTxCountNotice] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [type, setType] = useState('Bank Account');
  const [institutionName, setInstitutionName] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [color, setColor] = useState('#4f46e5');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await api.getAccounts(showArchived);
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  }, [showArchived]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const resetForm = () => {
    setName('');
    setType('Bank Account');
    setInstitutionName('');
    setLastFour('');
    setOpeningBalance('');
    setColor('#4f46e5');
    setEditingAcc(null);
    setError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (acc) => {
    setEditingAcc(acc);
    setName(acc.name || '');
    setType(acc.type || 'Bank Account');
    setInstitutionName(acc.institution_name || '');
    setLastFour(acc.last_four || '');
    setOpeningBalance(acc.opening_balance || 0);
    setColor(acc.color || '#4f46e5');
    setError('');
    setShowAddModal(true);
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter an account name.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const payload = {
        name,
        type,
        institution_name: institutionName,
        last_four: lastFour,
        opening_balance: parseFloat(openingBalance || 0),
        color
      };

      if (editingAcc) {
        await api.updateAccount(editingAcc.id, payload);
      } else {
        await api.addAccount(payload);
      }

      setShowAddModal(false);
      resetForm();
      fetchAccounts();
    } catch (err) {
      setError(err.message || 'Failed to save account.');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (acc) => {
    try {
      if (acc.is_archived) {
        await api.restoreAccount(acc.id);
      } else {
        await api.archiveAccount(acc.id);
      }
      fetchAccounts();
    } catch (err) {
      alert(err.message || 'Failed to update account archive status');
    }
  };

  const handleDeleteClick = (acc) => {
    setDeleteConfirmAcc(acc);
    setTxCountNotice(acc.transaction_count || 0);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmAcc) return;
    try {
      setLoading(true);
      await api.deleteAccount(deleteConfirmAcc.id);
      setDeleteConfirmAcc(null);
      fetchAccounts();
    } catch (err) {
      alert(err.message || 'Failed to delete account.');
    } finally {
      setLoading(false);
    }
  };

  // Metrics
  const activeAccounts = accounts.filter(a => !a.is_archived);
  const archivedAccounts = accounts.filter(a => a.is_archived);
  const totalLiquidity = activeAccounts.reduce((sum, a) => sum + (parseFloat(a.current_balance || a.opening_balance) || 0), 0);

  const getAccountIcon = (accType) => {
    switch (accType) {
      case 'Credit Card': return <FaCreditCard color="#f472b6" />;
      case 'Cash': return <FaMoneyBillWave color="#34d399" />;
      case 'UPI Wallet': return <FaWallet color="#38bdf8" />;
      case 'Savings / Investment': return <FaPiggyBank color="#fbbf24" />;
      case 'Bank Account':
      default: return <FaUniversity color="#818cf8" />;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 6px 0', color: '#f8fafc' }}>
            Accounts & Wallets
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>
            Manage your liquid assets, bank accounts, cards, and UPI wallets in one centralized hub.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? 'Hide Archived' : `Show Archived (${archivedAccounts.length})`}
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={FaPlus}
            onClick={handleOpenAdd}
          >
            Add Account
          </Button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <Card style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.25), rgba(15, 23, 42, 0.6))' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            TOTAL LIQUIDITY
          </span>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 800, margin: '8px 0 0 0', color: '#ffffff' }}>
            {formatAmount(totalLiquidity)}
          </h2>
        </Card>

        <Card style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(15, 23, 42, 0.6))' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ACTIVE ACCOUNTS
          </span>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 800, margin: '8px 0 0 0', color: '#ffffff' }}>
            {activeAccounts.length}
          </h2>
        </Card>

        <Card style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(15, 23, 42, 0.6))' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ARCHIVED ACCOUNTS
          </span>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 800, margin: '8px 0 0 0', color: '#ffffff' }}>
            {archivedAccounts.length}
          </h2>
        </Card>
      </div>

      {/* Account Cards List */}
      {accounts.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <FaWallet size={26} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px 0' }}>
            No accounts found
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.92rem', margin: '0 0 20px 0', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
            Add your bank accounts, cash balances, or UPI wallets to begin tracking transactions accurately.
          </p>
          <Button variant="primary" icon={FaPlus} onClick={handleOpenAdd}>
            Create Your First Account
          </Button>
        </Card>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {accounts.map(acc => (
            <Card
              key={acc.id}
              style={{
                borderLeft: `4px solid ${acc.color || '#4f46e5'}`,
                opacity: acc.is_archived ? 0.65 : 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px'
                  }}>
                    {getAccountIcon(acc.type)}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                      {acc.name}
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {acc.institution_name ? `${acc.institution_name} • ` : ''}{acc.type} {acc.last_four ? `(•••• ${acc.last_four})` : ''}
                    </span>
                  </div>
                </div>
                {acc.is_archived && <Badge variant="warning">Archived</Badge>}
              </div>

              <div style={{ margin: '16px 0 20px 0' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                  CURRENT BALANCE
                </span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                  {formatAmount(acc.current_balance !== undefined ? acc.current_balance : acc.opening_balance)}
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '14px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {acc.transaction_count || 0} transactions recorded
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleOpenEdit(acc)}
                    title="Edit Account"
                    style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '6px' }}
                  >
                    <FaEdit size={15} />
                  </button>
                  <button
                    onClick={() => handleArchive(acc)}
                    title={acc.is_archived ? "Restore Account" : "Archive Account"}
                    style={{ background: 'transparent', border: 'none', color: acc.is_archived ? '#34d399' : '#fbbf24', cursor: 'pointer', padding: '6px' }}
                  >
                    {acc.is_archived ? <FaUndo size={15} /> : <FaArchive size={15} />}
                  </button>
                  <button
                    onClick={() => handleDeleteClick(acc)}
                    title="Delete Account"
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                  >
                    <FaTrashAlt size={15} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Account Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingAcc ? "Edit Account" : "Add New Financial Account"}
        maxWidth="500px"
      >
        <form onSubmit={handleSaveSubmit}>
          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <Input
            label="Account Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. HDFC Salary Account, Cash Wallet"
            required
          />

          <Select
            label="Account Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={ACCOUNT_TYPES}
            required
          />

          <Input
            label="Financial Institution (Optional)"
            value={institutionName}
            onChange={(e) => setInstitutionName(e.target.value)}
            placeholder="e.g. HDFC Bank, SBI, ICICI"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Input
              label="Opening Balance"
              type="number"
              step="0.01"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0.00"
            />
            <Input
              label="Last 4 Digits (Optional)"
              value={lastFour}
              onChange={(e) => setLastFour(e.target.value)}
              placeholder="e.g. 4321"
              maxLength={4}
            />
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={loading}>
              {editingAcc ? "Update Account" : "Create Account"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete / Archive Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmAcc}
        onClose={() => setDeleteConfirmAcc(null)}
        title="Confirm Account Deletion"
        maxWidth="480px"
      >
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            color: '#f87171',
            marginBottom: '16px'
          }}>
            <FaExclamationTriangle size={24} style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.88rem' }}>
              Are you sure you want to permanently delete <strong>{deleteConfirmAcc?.name}</strong>?
              {txCountNotice > 0 && (
                <div style={{ marginTop: '6px', fontWeight: 600 }}>
                  This account has {txCountNotice} financial transaction records associated with it. Deleting will erase all history.
                </div>
              )}
            </div>
          </div>

          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0 0 20px 0' }}>
            {txCountNotice > 0 ? "Consider archiving this account instead to preserve your historic budget and cash flow reports." : "This action cannot be undone."}
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button variant="secondary" onClick={() => setDeleteConfirmAcc(null)}>
              Cancel
            </Button>

            {txCountNotice > 0 && (
              <Button
                variant="warning"
                onClick={() => {
                  handleArchive(deleteConfirmAcc);
                  setDeleteConfirmAcc(null);
                }}
              >
                Archive Account Instead
              </Button>
            )}

            <Button variant="danger" loading={loading} onClick={confirmDelete}>
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default AccountsPage;
