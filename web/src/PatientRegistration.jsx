import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, CreditCard, Calendar, Phone, MapPin, UserCheck, AlertCircle, Save } from 'lucide-react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5200/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Configure interceptor to automatically add the JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fmdds_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const PatientRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nic: '',
    fullName: '',
    dateOfBirth: '',
    gender: 'Male',
    address: '',
    telephone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateNIC = (nic) => {
    if (!nic) return true; // Optional in DB, but let's validate format if provided
    const oldNicRegex = /^[0-9]{9}[vVxX]$/;
    const newNicRegex = /^[0-9]{12}$/;
    return oldNicRegex.test(nic) || newNicRegex.test(nic);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validations
    if (formData.fullName.length < 3 || formData.fullName.length > 150) {
      setError('Full Name must be between 3 and 150 characters.');
      return;
    }

    if (formData.nic && !validateNIC(formData.nic)) {
      setError('Invalid NIC format. Must be 9 digits followed by V/X (old format) or 12 digits (new format).');
      return;
    }

    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dob >= today) {
        setError('Date of Birth must be in the past.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await api.post('/patients', {
        nic: formData.nic || null,
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
        gender: formData.gender,
        address: formData.address || '',
        telephone: formData.telephone || ''
      });

      setSuccess('Patient profile created successfully!');
      
      // Auto transition to Case Registration after 1.5 seconds, passing the registered patient details
      setTimeout(() => {
        navigate('/cases/register', { state: { patient: response.data } });
      }, 1500);

    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('An error occurred during patient registration. Make sure the backend is running.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div className="glass-panel animate-in" style={{ padding: '2.5rem' }}>
        
        {/* Header Title */}
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--surface-200)', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={24} style={{ color: 'var(--primary-500)' }} />
            <span>Register New Patient Profile</span>
          </h2>
          <p>Demographic record entry for living patient or deceased profile (SCR-003)</p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} style={{ marginRight: '0.5rem', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid #a7f3d0' }}>
            <UserCheck size={18} style={{ marginRight: '0.5rem', flexShrink: 0 }} />
            <span>{success} Redirecting to Case Intake...</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* NIC */}
            <div className="input-group">
              <label className="input-label" htmlFor="nic">NIC (National Identity Card)</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', color: 'var(--surface-300)' }}>
                  <CreditCard size={18} />
                </div>
                <input 
                  id="nic"
                  name="nic"
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. 199428301556 or 942830155V"
                  value={formData.nic}
                  onChange={handleInputChange}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Gender */}
            <div className="input-group">
              <label className="input-label" htmlFor="gender">Gender</label>
              <select 
                id="gender"
                name="gender"
                className="input-field"
                value={formData.gender}
                onChange={handleInputChange}
                style={{ height: '46px' }}
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Full Name */}
          <div className="input-group">
            <label className="input-label" htmlFor="fullName">Full Name</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', color: 'var(--surface-300)' }}>
                <User size={18} />
              </div>
              <input 
                id="fullName"
                name="fullName"
                type="text" 
                className="input-field" 
                placeholder="e.g. Adambarage Perera"
                value={formData.fullName}
                onChange={handleInputChange}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Date of Birth */}
            <div className="input-group">
              <label className="input-label" htmlFor="dateOfBirth">Date of Birth</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', color: 'var(--surface-300)' }}>
                  <Calendar size={18} />
                </div>
                <input 
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date" 
                  className="input-field" 
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            {/* Telephone */}
            <div className="input-group">
              <label className="input-label" htmlFor="telephone">Telephone Number</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', color: 'var(--surface-300)' }}>
                  <Phone size={18} />
                </div>
                <input 
                  id="telephone"
                  name="telephone"
                  type="tel" 
                  className="input-field" 
                  placeholder="e.g. +94771234567"
                  value={formData.telephone}
                  onChange={handleInputChange}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="input-group" style={{ marginBottom: '2.5rem' }}>
            <label className="input-label" htmlFor="address">Residential Address</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '14px', left: '12px', color: 'var(--surface-300)' }}>
                <MapPin size={18} />
              </div>
              <textarea 
                id="address"
                name="address"
                className="input-field" 
                rows="3"
                placeholder="e.g. 12/A, Galle Road, Colombo 03"
                value={formData.address}
                onChange={handleInputChange}
                style={{ paddingLeft: '2.5rem', resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Action Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button 
              type="button" 
              className="btn" 
              onClick={() => navigate('/dashboard')}
              style={{ backgroundColor: 'var(--surface-200)', color: 'var(--text-main)' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading}
            >
              <Save size={18} />
              <span>{isLoading ? 'Saving Record...' : 'Save Profile & Continue'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default PatientRegistration;
