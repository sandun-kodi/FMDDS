import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { caseService } from '../services/caseService';
import { useNotification } from '../context/NotificationContext';
import { FilePlus, Search, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

const CaseRegisterView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useNotification();

  const preselectedPatient = location.state?.patient || null;

  const [nicQuery, setNicQuery] = useState(preselectedPatient?.nic || '');
  const [patient, setPatient] = useState(preselectedPatient);
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [patientError, setPatientError] = useState('');

  const [caseType, setCaseType] = useState('Clinical Forensic');
  const [referralSource, setReferralSource] = useState('Police Station');
  const [hospitalId, setHospitalId] = useState(1);
  const [wardId, setWardId] = useState(1);
  const [assignedOfficerId, setAssignedOfficerId] = useState(2);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [registeredCase, setRegisteredCase] = useState(null);

  const handleLookupPatient = async () => {
    if (!nicQuery.trim()) return;
    setIsSearchingPatient(true);
    setPatientError('');
    try {
      const res = await caseService.getPatientByNic(nicQuery.trim());
      setPatient(res);
    } catch (err) {
      setPatient(null);
      setPatientError(err.message || 'No registered patient found with this NIC.');
    } finally {
      setIsSearchingPatient(false);
    }
  };

  const handleSubmitCase = async (e) => {
    e.preventDefault();
    if (!patient || !patient.patientID) {
      setFormError('Please search and select a valid registered patient before opening a case sheet.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      const newCase = await caseService.registerCase({
        patientID: patient.patientID,
        caseType,
        referralSource,
        referralSourceTypeID: 1,
        assignedOfficerID: parseInt(assignedOfficerId),
        hospitalID: parseInt(hospitalId),
        wardID: parseInt(wardId)
      });

      setRegisteredCase(newCase);
      notifySuccess(`Case opened! Server-Generated Case Number: ${newCase.caseNumber}`);
    } catch (err) {
      setFormError(err.message || 'Failed to register new case folder.');
      notifyError(err.message || 'Failed to register new case folder.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      <div className="card animate-in" style={{ padding: '2rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}>
            <FilePlus size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Case Sheet Registration (SCR-004)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Open a new medico-legal incident folder linked to a registered patient
            </p>
          </div>
        </div>

        {registeredCase ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ color: '#16a34a', marginBottom: '1rem' }}>
              <CheckCircle size={52} style={{ margin: '0 auto' }} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>Case Folder Opened Successfully!</h3>
            
            <div style={{
              display: 'inline-block',
              padding: '1rem 2rem',
              backgroundColor: '#f0f9ff',
              borderRadius: '12px',
              border: '2px solid #0284c7',
              margin: '1rem 0'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#0369a1', textTransform: 'uppercase', fontWeight: 700 }}>
                Server-Generated Case Number
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0284c7', letterSpacing: '0.05em' }}>
                {registeredCase.caseNumber}
              </div>
            </div>

            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Case Type: <strong>{registeredCase.caseType}</strong> | Patient: <strong>{patient?.fullName}</strong>
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button className="btn btn-outline" onClick={() => { setRegisteredCase(null); setPatient(null); setNicQuery(''); }}>
                Open Another Case
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/cases')}>
                View All Cases <ArrowRight size={16} style={{ marginLeft: '6px' }} />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitCase}>
            {formError && (
              <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#991b1b' }}>
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            {/* Patient Lookup Section */}
            <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                Step 1: Lookup Patient by NIC
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter patient NIC (e.g. 941234567V)"
                  value={nicQuery}
                  onChange={(e) => setNicQuery(e.target.value)}
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleLookupPatient}
                  disabled={isSearchingPatient || !nicQuery.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Search size={16} />
                  {isSearchingPatient ? 'Searching...' : 'Find Patient'}
                </button>
              </div>

              {patientError && (
                <div style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} />
                  <span>{patientError} — <Link to="/patients/register">Register Patient First</Link></span>
                </div>
              )}

              {patient && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0', color: '#065f46', fontSize: '0.85rem' }}>
                  ✓ Linked Patient: <strong>{patient.fullName}</strong> (NIC: {patient.nic}, DOB: {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}, Gender: {patient.gender})
                </div>
              )}
            </div>

            {/* Case Details Form */}
            <div style={{ opacity: patient ? 1 : 0.6, pointerEvents: patient ? 'auto' : 'none' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label htmlFor="caseType" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Case Type *
                  </label>
                  <select
                    id="caseType"
                    value={caseType}
                    onChange={(e) => setCaseType(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    required
                  >
                    <option value="Clinical Forensic">Clinical Forensic (Living Patient)</option>
                    <option value="Postmortem">Postmortem (Autopsy Examination)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="referralSource" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Referral Source / Police Branch *
                  </label>
                  <input
                    id="referralSource"
                    type="text"
                    placeholder="e.g. Police Station Fort / Magistrate Order"
                    value={referralSource}
                    onChange={(e) => setReferralSource(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
                <div>
                  <label htmlFor="assignedOfficerId" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Assigned Medical Officer ID
                  </label>
                  <input
                    id="assignedOfficerId"
                    type="number"
                    value={assignedOfficerId}
                    onChange={(e) => setAssignedOfficerId(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label htmlFor="hospitalId" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Hospital Unit ID
                  </label>
                  <input
                    id="hospitalId"
                    type="number"
                    value={hospitalId}
                    onChange={(e) => setHospitalId(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard')}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || !patient}>
                  {isSubmitting ? 'Generating Case Sheet...' : 'Submit & Register Case'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CaseRegisterView;
