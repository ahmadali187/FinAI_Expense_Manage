import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { UserContext } from '../../contexts/UserContext';
import * as api from '../../services/api';
import { FaFileAlt, FaPlus, FaSave, FaDownload, FaImage, FaTrash, FaPen } from 'react-icons/fa';
import './ReportPage.css';

const ReportPage = () => {
  const { loggedInUser } = useContext(UserContext);

  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const [savedReports, setSavedReports] = useState([]);
  const [editingReportId, setEditingReportId] = useState(null);
  const fileInputRef = useRef(null);

  const fetchReports = useCallback(async () => {
    if (loggedInUser) {
      try {
        const res = await api.getReportTemplates();
        setSavedReports(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      }
    }
  }, [loggedInUser]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleSaveReport = async () => {
    if (!loggedInUser) {
      alert("Please log in to save reports.");
      return;
    }
    if (!reportTitle.trim() || reportContent.length === 0) {
      alert("Please enter a title and add content before saving.");
      return;
    }

    try {
      await api.addReportTemplate({
        title: reportTitle,
        dateRange: 'custom',
        categories: reportContent.map(c => c.value ? String(c.value).slice(0, 30) : 'Content')
      });
      fetchReports();
      alert("Report saved successfully to SQLite!");
      handleNewReport();
    } catch (err) {
      console.error("Failed to save report:", err);
      alert("Failed to save report to database.");
    }
  };

  const handleNewReport = () => {
    setReportTitle('');
    setReportContent([]);
    setCurrentText('');
    setEditingReportId(null);
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm("Are you sure you want to delete this report template?")) {
      try {
        await api.deleteReportTemplate(reportId);
        fetchReports();
      } catch (err) {
        console.error("Failed to delete report:", err);
      }
    }
  };

  const loadReportForEditing = (reportId) => {
    const reportToEdit = savedReports.find(report => report.id === reportId);
    if (reportToEdit) {
      setReportTitle(reportToEdit.title);
      if (typeof reportToEdit.content === 'string') {
        setReportContent([{ type: 'text', value: reportToEdit.content, id: `text_${Date.now()}` }]);
      } else {
        setReportContent(reportToEdit.content || []);
      }
      setCurrentText('');
      setEditingReportId(reportToEdit.id);
    }
  };

  const handleAddText = () => {
    if (!currentText.trim()) return;
    setReportContent([...reportContent, { type: 'text', value: currentText, id: `text_${Date.now()}` }]);
    setCurrentText('');
  };

  const handleImageSelected = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImageBlock = { type: 'image', src: reader.result, id: `image_${Date.now()}` };
        setReportContent(prev => [...prev, newImageBlock]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBlock = (blockId) => {
    setReportContent(reportContent.filter(block => block.id !== blockId));
  };

  const handleDownloadReport = () => {
    if (!reportTitle.trim() && reportContent.length === 0) {
      alert("Please create content before downloading.");
      return;
    }

    let reportHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${reportTitle || 'Financial Report'}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; color: #0f172a; }
          h1 { color: #4f46e5; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
          p { white-space: pre-wrap; line-height: 1.6; }
          img { max-width: 100%; border-radius: 8px; margin: 15px 0; }
          .block { margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <h1>${reportTitle || 'Financial Report'}</h1>
    `;

    reportContent.forEach(block => {
      reportHtml += '<div class="block">';
      if (block.type === 'text') {
        reportHtml += `<p>${block.value}</p>`;
      } else if (block.type === 'image' && block.src) {
        reportHtml += `<img src="${block.src}" alt="Report Image">`;
      }
      reportHtml += '</div>';
    });

    reportHtml += `</body></html>`;

    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(reportTitle || 'report').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card" style={{ maxWidth: '900px', margin: '20px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaFileAlt color="var(--primary-glow)" size={24} />
          <h2 style={{ margin: 0, fontWeight: 800 }}>Custom Financial Report Builder</h2>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={handleNewReport} className="btn-glass-secondary">
            <FaPlus /> New
          </button>
          <button onClick={handleSaveReport} className="btn-gradient-primary">
            <FaSave /> {editingReportId ? 'Update Report' : 'Save Report'}
          </button>
          <button onClick={handleDownloadReport} className="btn-glass-secondary">
            <FaDownload /> Download HTML
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
            Report Title
          </label>
          <input
            type="text"
            className="glass-input"
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            placeholder="e.g. Q3 Financial Performance & Goals"
          />
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
            Add Text Content Block
          </label>
          <textarea
            className="glass-input"
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            placeholder="Type notes, analysis, or financial summary text..."
            rows="4"
          />
          <button onClick={handleAddText} className="btn-glass-secondary" style={{ marginTop: '8px', padding: '6px 12px', fontSize: '0.85rem' }}>
            + Append Text Block
          </button>
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
            Add Image / Chart Screenshot
          </label>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageSelected}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="btn-glass-secondary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <FaImage /> Upload Image Block
          </button>
        </div>

        {/* Live Preview Section */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--surface-glass-border)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Report Preview</h3>
          
          {reportContent.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No content added to this report yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {reportContent.map(block => (
                <div key={block.id} className="report-block">
                  {block.type === 'text' && <p style={{ margin: 0 }}>{block.value}</p>}
                  {block.type === 'image' && <img src={block.src} alt="Report Preview" />}
                  <button
                    className="btn-glass-secondary"
                    style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#ef4444', marginTop: '8px' }}
                    onClick={() => handleRemoveBlock(block.id)}
                  >
                    <FaTrash /> Remove Block
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Reports List */}
        {savedReports.length > 0 && (
          <div className="saved-reports-section">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Saved Reports ({savedReports.length})</h3>
            <ul>
              {savedReports.map(report => (
                <li key={report.id} onClick={() => loadReportForEditing(report.id)}>
                  <div>
                    <strong style={{ fontSize: '1rem' }}>{report.title}</strong>
                    <small style={{ color: 'var(--text-muted)' }}>
                      Last modified: {new Date(report.lastModified).toLocaleDateString()}
                    </small>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn-glass-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={(e) => { e.stopPropagation(); loadReportForEditing(report.id); }}
                    >
                      <FaPen /> Edit
                    </button>
                    <button
                      className="btn-glass-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#ef4444' }}
                      onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }}
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPage;