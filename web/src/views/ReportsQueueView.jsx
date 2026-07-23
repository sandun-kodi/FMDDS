import React, { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { caseService } from '../services/caseService';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import { FileCheck, Download, CheckCircle2, Lock, FileText, AlertTriangle } from 'lucide-react';

const ReportsQueueView = () => {
  const { notifySuccess, notifyError } = useNotification();
  const { role, hasRole } = useAuth();

  const [reports, setReports] = useState([
    { reportID: 1, caseID: 1, caseNumber: 'COL/2026/CL/0001', reportType: 'Clinical Medico-Legal Report', approvalStatus: 'Draft', summary: 'Clinical examination findings for soft tissue trauma' },
    { reportID: 2, caseID: 3, caseNumber: 'COL/2026/PM/0001', reportType: 'Postmortem Autopsy Report (PMR)', approvalStatus: 'Approved', approvedBy: 2, approvalDate: '2026-07-05T12:45:00Z', summary: 'Intracranial hemorrhage secondary to blunt force trauma' }
  ]);

  const [selectedReport, setSelectedReport] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleApproveReport = async (rep) => {
    if (!hasRole('Judicial Medical Officer', 'JMO', 'Admin')) {
      notifyError('Access Restricted: Only authorized Judicial Medical Officers (JMOs) can approve final medico-legal reports.');
      return;
    }

    setIsApproving(true);
    try {
      await reportService.approveReportByCase(rep.caseID, 2);
      notifySuccess(`Report #${rep.reportID} signed & approved! Case ${rep.caseNumber} locked as read-only.`);
      
      setReports(prev => prev.map(r => r.reportID === rep.reportID ? {
        ...r,
        approvalStatus: 'Approved',
        approvedBy: 2,
        approvalDate: new Date().toISOString()
      } : r));

      setSelectedReport(null);
    } catch (err) {
      notifyError(err.message || 'Failed to approve medico-legal report.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleDownloadPdf = async (caseId) => {
    setIsDownloading(true);
    try {
      const blob = await reportService.downloadReportPdf(caseId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Case_${caseId}_Report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      notifySuccess(`PDF report downloaded for Case #${caseId}!`);
    } catch (err) {
      notifyError(err.message || 'PDF report is only available after final JMO approval.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
          Medico-Legal Reports Queue & Sign-off (SCR-011)
        </h2>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Review compiled case reports, execute JMO digital approval, and download court-ready PDFs
        </p>
      </div>

      {/* Reports Queue Table */}
      <div className="card" style={{ padding: '1.25rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileCheck size={18} style={{ color: 'var(--primary-600)' }} /> Pending & Approved Reports Queue
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px' }}>Report ID</th>
                <th style={{ padding: '10px' }}>Case Number</th>
                <th style={{ padding: '10px' }}>Report Type</th>
                <th style={{ padding: '10px' }}>Approval Status</th>
                <th style={{ padding: '10px' }}>Summary Preview</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.reportID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px', fontWeight: 700, color: 'var(--primary-600)' }}>#{r.reportID}</td>
                  <td style={{ padding: '10px', fontWeight: 600 }}>{r.caseNumber}</td>
                  <td style={{ padding: '10px' }}>{r.reportType}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      padding: '3px 9px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: r.approvalStatus === 'Approved' ? '#dcfce7' : '#ede9fe',
                      color: r.approvalStatus === 'Approved' ? '#15803d' : '#6d28d9',
                      border: `1px solid ${r.approvalStatus === 'Approved' ? '#bbf7d0' : '#ddd6fe'}`
                    }}>
                      {r.approvalStatus === 'Approved' ? 'Approved & Locked' : 'Draft'}
                    </span>
                  </td>
                  <td style={{ padding: '10px', maxWidth: '280px' }}>{r.summary}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => setSelectedReport(r)}
                        style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <FileText size={14} /> Preview
                      </button>

                      {r.approvalStatus === 'Approved' && (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleDownloadPdf(r.caseID)}
                          disabled={isDownloading}
                          style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Download size={14} /> PDF
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Preview & Approval Modal */}
      {selectedReport && (
        <Modal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title={`Medico-Legal Report Sign-Off — ${selectedReport.caseNumber}`}
          maxWidth="680px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Report Type</div>
                <div style={{ fontWeight: 600 }}>{selectedReport.reportType}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</div>
                <span style={{ fontWeight: 700, color: selectedReport.approvalStatus === 'Approved' ? '#15803d' : '#6d28d9' }}>
                  {selectedReport.approvalStatus}
                </span>
              </div>
            </div>

            {/* Document Draft Preview Body */}
            <div style={{ padding: '1.25rem', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
              {selectedReport.summary}
            </div>

            {/* Role Warning for Non-JMO */}
            {!hasRole('Judicial Medical Officer', 'JMO', 'Admin') && selectedReport.approvalStatus !== 'Approved' && (
              <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: '#fffbe0', color: '#b45309', border: '1px solid #fde68a', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} />
                <span>Medical Officers may draft reports, but final digital signature and lock approval requires JMO authorization.</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setSelectedReport(null)}>Close Preview</button>

              {selectedReport.approvalStatus !== 'Approved' && hasRole('Judicial Medical Officer', 'JMO', 'Admin') && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleApproveReport(selectedReport)}
                  disabled={isApproving}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#15803d' }}
                >
                  <Lock size={16} />
                  {isApproving ? 'Executing JMO Lock...' : 'Execute JMO Digital Sign-off & Lock'}
                </button>
              )}

              {selectedReport.approvalStatus === 'Approved' && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleDownloadPdf(selectedReport.caseID)}
                  disabled={isDownloading}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={16} /> Download Signed PDF
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ReportsQueueView;
