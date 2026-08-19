import React, { useState, useContext } from 'react';
import { FaCloudUploadAlt, FaTimes, FaCheckCircle, FaSpinner, FaReceipt, FaExclamationTriangle } from 'react-icons/fa';
import { TransactionsContext } from '../../contexts/TransactionsContext';
import { validateReceiptFile, preprocessImageCanvas, parseReceiptDetails } from '../../utils/ocrEngine';
import { createWorker } from 'tesseract.js';

const ReceiptScannerModal = ({ isOpen, onClose }) => {
  const { transactions, addTransaction } = useContext(TransactionsContext);

  const [imagePreview, setImagePreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [ocrError, setOcrError] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setValidationError('');
    const validation = validateReceiptFile(file);
    if (!validation.valid) {
      setValidationError(validation.message);
      return;
    }

    const rawImgUrl = URL.createObjectURL(file);
    setImagePreview(rawImgUrl);
    setIsScanning(true);
    setOcrError(false);
    setStatusMessage('Preprocessing image and running Tesseract OCR...');

    try {
      const processedImg = await preprocessImageCanvas(rawImgUrl);
      const worker = await createWorker('eng');
      const ret = await worker.recognize(processedImg);
      await worker.terminate();

      const text = ret.data.text || '';
      const parsed = parseReceiptDetails(text, transactions);

      setExtractedData(parsed);

      if (parsed.confidence.overall === 'High' || parsed.confidence.overall === 'Medium') {
        setStatusMessage(`OCR extracted receipt details (${parsed.confidence.overall} Confidence)! Please confirm below.`);
      } else {
        setOcrError(true);
        setStatusMessage("We couldn't confidently read this receipt. Please review and edit fields manually.");
      }
    } catch (err) {
      console.error("Tesseract OCR Processing failed:", err);
      setOcrError(true);
      setExtractedData(parseReceiptDetails('', transactions));
      setStatusMessage('OCR scan failed or image was unreadable. Please enter expense details manually.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveTransaction = async () => {
    if (!extractedData || !extractedData.amount || parseFloat(extractedData.amount) <= 0) {
      alert("Please enter a valid expense amount.");
      return;
    }

    if (extractedData.isDuplicate) {
      const confirmSave = window.confirm("Possible duplicate transaction detected! Do you still want to save this expense?");
      if (!confirmSave) return;
    }

    await addTransaction({
      amount: parseFloat(extractedData.amount),
      merchant: extractedData.merchant,
      description: `Receipt: ${extractedData.merchant}`,
      category: extractedData.category || 'Other',
      type: 'expense',
      date: extractedData.date
    });
    onClose();
    resetModal();
  };

  const resetModal = () => {
    setImagePreview(null);
    setIsScanning(false);
    setExtractedData(null);
    setStatusMessage('');
    setOcrError(false);
    setValidationError('');
  };

  if (!isOpen) return null;

  const getBadgeStyle = (confLevel) => {
    if (confLevel === 'High') return { background: '#064e3b', color: '#34d399', border: '1px solid #10b981' };
    if (confLevel === 'Medium') return { background: '#451a03', color: '#fbbf24', border: '1px solid #f59e0b' };
    return { background: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444' };
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-glass-container" style={{ maxWidth: '580px', background: '#0f172a', border: '1px solid rgba(99, 102, 241, 0.4)' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaReceipt size={22} color="#818cf8" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary, #ffffff)' }}>Production Tesseract OCR Receipt Scanner</h3>
          </div>
          <FaTimes style={{ cursor: 'pointer', color: 'var(--text-muted, #94a3b8)' }} onClick={onClose} />
        </div>

        <div className="modal-body">
          {validationError && (
            <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#fca5a5', marginBottom: '14px', fontSize: '0.85rem' }}>
              <FaExclamationTriangle style={{ marginRight: '6px' }} /> {validationError}
            </div>
          )}

          {!imagePreview ? (
            <label
              style={{
                border: '2px dashed #6366f1',
                borderRadius: '12px',
                padding: '40px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: 'rgba(99, 102, 241, 0.05)'
              }}
            >
              <FaCloudUploadAlt size={48} color="#818cf8" style={{ marginBottom: '12px' }} />
              <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary, #ffffff)' }}>
                Upload or Drop Receipt Image
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                Supports PNG, JPG, JPEG, WEBP files (Max 10MB)
              </span>
              <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <img
                  src={imagePreview}
                  alt="Receipt Preview"
                  style={{ width: '130px', height: '160px', objectFit: 'cover', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                />
                <div style={{ flex: 1 }}>
                  {isScanning ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '40px', color: '#818cf8' }}>
                      <FaSpinner className="fa-spin" size={24} />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{statusMessage}</span>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: ocrError ? '#f59e0b' : '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>
                          {ocrError ? <FaExclamationTriangle /> : <FaCheckCircle />} {statusMessage}
                        </div>
                        {extractedData?.confidence && (
                          <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, ...getBadgeStyle(extractedData.confidence.overall) }}>
                            {extractedData.confidence.overall} Confidence
                          </span>
                        )}
                      </div>

                      {extractedData?.isDuplicate && (
                        <div style={{ padding: '6px 10px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', borderRadius: '6px', color: '#fbbf24', fontSize: '0.75rem', marginBottom: '8px' }}>
                          <FaExclamationTriangle /> Possible duplicate transaction detected!
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Merchant Name</label>
                          <input
                            type="text"
                            className="glass-input"
                            style={{ background: '#1e293b', color: '#fff', padding: '6px 12px' }}
                            value={extractedData?.merchant || ''}
                            onChange={e => setExtractedData({ ...extractedData, merchant: e.target.value })}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Amount (₹)</label>
                            <input
                              type="number"
                              className="glass-input"
                              style={{ background: '#1e293b', color: '#fff', padding: '6px 12px' }}
                              value={extractedData?.amount || ''}
                              onChange={e => setExtractedData({ ...extractedData, amount: e.target.value })}
                              placeholder="e.g. 450.00"
                              step="0.01"
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Date</label>
                            <input
                              type="date"
                              className="glass-input"
                              style={{ background: '#1e293b', color: '#fff', padding: '6px 12px' }}
                              value={extractedData?.date || ''}
                              onChange={e => setExtractedData({ ...extractedData, date: e.target.value })}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Category (Suggested)</label>
                          <input
                            type="text"
                            className="glass-input"
                            style={{ background: '#1e293b', color: '#fff', padding: '6px 12px' }}
                            value={extractedData?.category || ''}
                            onChange={e => setExtractedData({ ...extractedData, category: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!isScanning && (
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <button className="btn-glass-secondary" onClick={resetModal}>Upload Another</button>
                  <button className="btn-gradient-primary" onClick={handleSaveTransaction}>Confirm & Add Expense</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptScannerModal;
