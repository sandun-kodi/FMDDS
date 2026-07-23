import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { caseService } from '../services/caseService';
import { validateNic } from '../utils/nicValidator';
import { useNotification } from '../context/NotificationContext';
import { UserPlus, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';

const PatientRegisterView = () => {
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useNotification();

  const [nic, setNic] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState('');
  const [telephone, setTelephone] = useState('');

  const [nicError, setNicError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState(null);

  const handleNicChange = (e) => {
    const val = e.target.value;
    setNic(val);
    if (val.trim()) {
      const res = validateNic(val);
      if (!res.isValid) {
        setNicError(res.message);
      } else {
        setNicError('');
      }
    } else {
      setNicError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const nicCheck = validateNic(nic);
    if (!nicCheck.isValid) {
      setNicError(nicCheck.message);
      return;
    }

    if (!fullName.trim() || fullName.trim().length < 3) {
      setFormError('Full name must be at least 3 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await caseService.registerPatient({
        nic: nicCheck.nic,
        fullName: fullName.trim(),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
        gender,
        address: address.trim() || null,
        telephone: telephone.trim() || null
      });

      setRegisteredPatient(result);
      notifySuccess(`Patient registered successfully! Patient ID: ${result.patientID}`);
    } catch (err) {
      setFormError(err.message || 'Failed to register patient profile.');
      notifyError(err.message || 'Failed to register patient profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div className="card animate-in" style={{ padding: '2rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}>
            <UserPlus size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Patient Demographic Intake (SCR-003)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Register demographic details of living patient or deceased profile
            </p>
          </div>
        </div>

        {registeredPatient ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ color: '#16a34a', marginBottom: '1rem' }}>
              <CheckCircle size={48} style={{ margin: '0 auto' }} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Patient Registered Successfully!</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Patient Name: <strong>{registeredPatient.fullName}</strong> | NIC: <strong>{registeredPatient.nic}</strong>
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setRegisteredPatient(null)}>
                Register Another Patient
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/cases/register', { state: { patient: registeredPatient } })}>
                Proceed to Case Registration <ArrowRight size={16} style={{ marginLeft: '6px' }} />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {formError && (
              <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#991b1b' }}>
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label htmlFor="nic" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  National Identity Card (NIC) *
                </label>
                <input
                  id="nic"
                  type="text"
                  className="input-field"
                  placeholder="e.g. 941234567V or 199412345678"
                  value={nic}
                  onChange={handleNicChange}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: nicError ? '1px solid #ef4444' : '1px solid #cbd5e1' }}
                  required
                />
                {nicError && <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px' }}>{nicError}</div>}
              </div>

              <div>
                <label htmlFor="fullName" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Full Name *
                </label>
                <input
                  id="fullName"
                  type="text"
                  className="input-field"
                  placeholder="Enter full legal name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label htmlFor="dateOfBirth" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Date of Birth
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  className="input-field"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label htmlFor="gender" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Gender *
                </label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="address" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Residential Address
              </label>
              <textarea
                id="address"
                rows={2}
                placeholder="Enter patient residential address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <label htmlFor="telephone" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Contact Telephone
              </label>
              <input
                id="telephone"
                type="tel"
                placeholder="e.g. 0771234567"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting || !!nicError}>
                {isSubmitting ? 'Saving Profile...' : 'Save Patient Profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PatientRegisterView;
