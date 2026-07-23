import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { examService } from '../services/examService';
import { caseService } from '../services/caseService';
import { reportService } from '../services/reportService';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { Skull, Save, AlertCircle, ArrowLeft } from 'lucide-react';

const PostmortemExamView = () => {
  const { caseId: paramCaseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useNotification();
  const { user, hasPermission } = useAuth();

  const initialCaseItem = location.state?.caseItem || null;
  const [caseItem, setCaseItem] = useState(initialCaseItem);
  const [targetCaseId, setTargetCaseId] = useState(paramCaseId || initialCaseItem?.caseID || '');

  // Sections
  const [inquestNumber, setInquestNumber] = useState('');
  const [externalFindings, setExternalFindings] = useState('');
  const [internalFindings, setInternalFindings] = useState('');
  const [immediateCOD, setImmediateCOD] = useState('');
  const [antecedentCOD, setAntecedentCOD] = useState('');
  const [mannerOfDeath, setMannerOfDeath] = useState('Homicide');

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (paramCaseId && !caseItem) {
      caseService.getCaseById(paramCaseId)
        .then(data => setCaseItem(data))
        .catch(err => notifyError(`Failed to load postmortem case #${paramCaseId}: ${err.message}`));
    }
  }, [paramCaseId, caseItem, notifyError]);

  const handleSavePostmortem = async (e) => {
    e.preventDefault();

    const cid = parseInt(targetCaseId || caseItem?.caseID);
    if (!cid || isNaN(cid)) {
      notifyError('Valid Case ID is required to record postmortem examination.');
      return;
    }

    if (!hasPermission('exam:record_postmortem')) {
      notifyError('Access Denied: Only authorized Judicial Medical Officers (JMOs) with `exam:record_postmortem` can submit postmortem autopsy exams.');
      return;
    }

    setIsSaving(true);
    try {
      const fullFindings = `Inquest: ${inquestNumber}\nManner: ${mannerOfDeath}\nExternal Findings: ${externalFindings}\nInternal Findings: ${internalFindings}`;
      const fullCause = `1a. ${immediateCOD}${antecedentCOD ? `\n1b. ${antecedentCOD}` : ''}`;

      await examService.recordPostmortemExam(cid, {
        examinerID: user?.userID || 1,
        findings: fullFindings.trim(),
        causeOfDeath: fullCause.trim()
      });

      // Submit structured causes of death array if provided
      if (immediateCOD) {
        const causesArray = [
          { recordType: 'Part I', category: '1a', description: immediateCOD.trim() }
        ];
        if (antecedentCOD) {
          causesArray.push({ recordType: 'Part I', category: '1b', description: antecedentCOD.trim() });
        }
        await examService.saveCausesOfDeath(cid, causesArray).catch(() => {});
      }

      setIsSaved(true);
      notifySuccess(`Postmortem autopsy examination recorded successfully for Case #${cid}!`);
    } catch (err) {
      notifyError(err.message || 'Failed to save postmortem autopsy examination.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateDraftReport = async () => {
    const cid = parseInt(targetCaseId || caseItem?.caseID);
    try {
      const summaryText = `POSTMORTEM AUTOPSY REPORT\nCase: ${caseItem?.caseNumber || cid}\nImmediate Cause: ${immediateCOD}\nManner: ${mannerOfDeath}`;
      await reportService.createDraftReport(cid, summaryText);
      notifySuccess(`Draft Postmortem Report created for Case #${cid}!`);
      navigate('/reports');
    } catch (err) {
      notifyError(err.message || 'Failed to create draft report.');
    }
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div className="card animate-in" style={{ padding: '2rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn btn-outline" onClick={() => navigate('/cases')} style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
              <ArrowLeft size={14} /> Back
            </button>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#fdf4ff', color: '#a21caf' }}>
              <Skull size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Postmortem Autopsy Examination (SCR-006)
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                {caseItem ? `Case ${caseItem.caseNumber} | Deceased: ${caseItem.patientName || 'Unidentified'}` : 'Autopsy Findings & Cause of Death Documentation'}
              </p>
            </div>
          </div>
        </div>

        {!caseItem && !paramCaseId && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Select Target Postmortem Case ID</label>
            <input
              type="number"
              placeholder="Enter Case ID (e.g. 3)"
              value={targetCaseId}
              onChange={(e) => setTargetCaseId(e.target.value)}
              style={{ width: '200px', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
        )}

        <form onSubmit={handleSavePostmortem}>
          {/* Section 1: Inquest & Authority */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-600)', marginBottom: '0.75rem' }}>1. Authority & Inquest Verification</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Magistrate / Police Inquest Order No</label>
                <input
                  type="text"
                  placeholder="e.g. INQ-2026-0412"
                  value={inquestNumber}
                  onChange={(e) => setInquestNumber(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Manner of Death Classification</label>
                <select
                  value={mannerOfDeath}
                  onChange={(e) => setMannerOfDeath(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value="Homicide">Homicide</option>
                  <option value="Suicide">Suicide</option>
                  <option value="Accidental">Accidental</option>
                  <option value="Natural">Natural</option>
                  <option value="Undetermined">Undetermined</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: External Examination */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-600)', marginBottom: '0.75rem' }}>2. External Dissection Examination</h3>
            <textarea
              rows={3}
              placeholder="Rigor mortis state, postmortem hypostasis, external trauma..."
              value={externalFindings}
              onChange={(e) => setExternalFindings(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
            />
          </div>

          {/* Section 3: Internal Examination */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-600)', marginBottom: '0.75rem' }}>3. Internal Organ Anatomical Examination</h3>
            <textarea
              rows={4}
              placeholder="Cranial cavity, brain weights, thoracic cavity, cardiovascular pathology..."
              value={internalFindings}
              onChange={(e) => setInternalFindings(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
            />
          </div>

          {/* Section 4: Cause of Death (COD) */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-600)', marginBottom: '0.75rem' }}>4. Determination of Cause of Death (COD)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Immediate Cause of Death (1a) *</label>
                <input
                  type="text"
                  placeholder="e.g. Intracranial hemorrhage due to cranial fracture"
                  value={immediateCOD}
                  onChange={(e) => setImmediateCOD(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Antecedent Underlying Cause (1b)</label>
                <input
                  type="text"
                  placeholder="e.g. Blunt force trauma to head secondary to vehicular crash"
                  value={antecedentCOD}
                  onChange={(e) => setAntecedentCOD(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            {isSaved && (
              <button type="button" className="btn btn-outline" onClick={handleCreateDraftReport}>
                Compile Draft PMR
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={isSaving || !hasPermission('exam:record_postmortem')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Save size={16} />
              {isSaving ? 'Submitting Autopsy Findings...' : 'Submit Autopsy Exam to Backend'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostmortemExamView;
