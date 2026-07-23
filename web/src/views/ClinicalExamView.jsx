import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { examService } from '../services/examService';
import { caseService } from '../services/caseService';
import { reportService } from '../services/reportService';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import AttachmentUploader from '../AttachmentUploader';
import { Stethoscope, FileText, Activity, Paperclip, CheckCircle, Save, AlertCircle, ArrowLeft } from 'lucide-react';

const ClinicalExamView = () => {
  const { caseId: paramCaseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useNotification();
  const { user, hasPermission } = useAuth();

  const initialCaseItem = location.state?.caseItem || null;
  const [caseItem, setCaseItem] = useState(initialCaseItem);
  const [targetCaseId, setTargetCaseId] = useState(paramCaseId || initialCaseItem?.caseID || '');

  const [activeTab, setActiveTab] = useState('history');

  // Form states
  const [bhtNumber, setBhtNumber] = useState('');
  const [historyNotes, setHistoryNotes] = useState('');
  const [physicalFindings, setPhysicalFindings] = useState('');
  const [injuryMapNotes, setInjuryMapNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Fetch case details if caseId is passed in URL
  useEffect(() => {
    if (paramCaseId && !caseItem) {
      caseService.getCaseById(paramCaseId)
        .then(data => setCaseItem(data))
        .catch(err => notifyError(`Failed to load case #${paramCaseId}: ${err.message}`));
    }
  }, [paramCaseId, caseItem, notifyError]);

  const handleSaveExam = async (e) => {
    e.preventDefault();

    const cid = parseInt(targetCaseId || caseItem?.caseID);
    if (!cid || isNaN(cid)) {
      notifyError('Valid Case ID is required to record clinical examination.');
      return;
    }

    if (!hasPermission('exam:record_clinical')) {
      notifyError('Access Denied: You do not have permission to record clinical forensic examinations.');
      return;
    }

    setIsSaving(true);
    try {
      const fullObservations = `BHT: ${bhtNumber}\nHistory: ${historyNotes}\nPhysical Findings: ${physicalFindings}\nInjury Mapping: ${injuryMapNotes}`;
      
      await examService.recordClinicalExam(cid, {
        examinerID: user?.userID || 1,
        examDate: new Date().toISOString(),
        observations: fullObservations.trim(),
        diagnosis: diagnosis.trim()
      });

      setIsSaved(true);
      notifySuccess(`Clinical forensic examination recorded successfully for Case #${cid}!`);
    } catch (err) {
      notifyError(err.message || 'Failed to save clinical forensic examination.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateDraftReport = async () => {
    const cid = parseInt(targetCaseId || caseItem?.caseID);
    try {
      const summaryText = `CLINICAL FORENSIC EXAMINATION REPORT\nCase: ${caseItem?.caseNumber || cid}\nDiagnosis: ${diagnosis}`;
      await reportService.createDraftReport(cid, summaryText);
      notifySuccess(`Draft Medico-Legal Report created for Case #${cid}!`);
      navigate('/reports');
    } catch (err) {
      notifyError(err.message || 'Failed to create draft report.');
    }
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      <div className="card animate-in" style={{ padding: '2rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn btn-outline" onClick={() => navigate('/cases')} style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
              <ArrowLeft size={14} /> Back
            </button>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
              <Stethoscope size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Clinical Forensic Examination (SCR-005)
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                {caseItem ? `Case ${caseItem.caseNumber} | Patient: ${caseItem.patientName || 'N/A'}` : 'Record clinical examination observations'}
              </p>
            </div>
          </div>
        </div>

        {!caseItem && !paramCaseId && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Select Target Case ID</label>
            <input
              type="number"
              placeholder="Enter Case ID (e.g. 1)"
              value={targetCaseId}
              onChange={(e) => setTargetCaseId(e.target.value)}
              style={{ width: '200px', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #f1f5f9', marginBottom: '1.5rem' }}>
          {[
            { id: 'history', label: '1. Incident History', icon: FileText },
            { id: 'findings', label: '2. Physical Findings', icon: Activity },
            { id: 'attachments', label: '3. Attachments', icon: Paperclip },
            { id: 'diagnosis', label: '4. Diagnosis & Conclusion', icon: CheckCircle }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  border: 'none',
                  borderBottom: isActive ? '3px solid #1d4ed8' : '3px solid transparent',
                  backgroundColor: 'transparent',
                  color: isActive ? '#1d4ed8' : 'var(--text-muted)',
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <form onSubmit={handleSaveExam}>
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Bed Head Ticket (BHT) Number</label>
                <input
                  type="text"
                  placeholder="e.g. BHT-2026-9842"
                  value={bhtNumber}
                  onChange={(e) => setBhtNumber(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Incident Narrative & Medical History</label>
                <textarea
                  rows={5}
                  placeholder="Record patient history narrative as related by patient or police referral notes..."
                  value={historyNotes}
                  onChange={(e) => setHistoryNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                />
              </div>
            </div>
          )}

          {activeTab === 'findings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Physical Examination & Injuries</label>
                <textarea
                  rows={4}
                  placeholder="Detailed description of injuries, contusions, lacerations, and abrasion dimensions..."
                  value={physicalFindings}
                  onChange={(e) => setPhysicalFindings(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Body Coordinates & Injury Diagram Mapping Notes</label>
                <textarea
                  rows={3}
                  placeholder="Anatomical location mapping notes..."
                  value={injuryMapNotes}
                  onChange={(e) => setInjuryMapNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                />
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div>
              <AttachmentUploader />
            </div>
          )}

          {activeTab === 'diagnosis' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Clinical Diagnosis & Conclusions *</label>
                <textarea
                  rows={6}
                  placeholder="Medical officer opinion, category of hurt (Grievous / Non-Grievous), weapon consistency..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                  required
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
            {isSaved && (
              <button type="button" className="btn btn-outline" onClick={handleCreateDraftReport}>
                Compile Draft Report
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={isSaving || !hasPermission('exam:record_clinical')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Save size={16} />
              {isSaving ? 'Submitting to Backend...' : 'Submit Clinical Exam to Backend'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClinicalExamView;
