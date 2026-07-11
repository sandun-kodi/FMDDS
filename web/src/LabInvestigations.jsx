import React, { useState, useEffect } from 'react';
import { Microscope, FileText, Plus, AlertCircle, Save } from 'lucide-react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5200/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fmdds_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const LabInvestigations = () => {
  const [testTypes, setTestTypes] = useState([]);
  const [formData, setFormData] = useState({
    caseNumber: '',
    testTypeId: '',
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mock data for test types if backend isn't ready
  const mockTestTypes = [
    { id: 1, name: 'Toxicology Screen', description: 'Standard toxicology profile' },
    { id: 2, name: 'DNA Profiling', description: 'Paternity or identity verification' },
    { id: 3, name: 'Histopathology', description: 'Tissue sample analysis' },
    { id: 4, name: 'Blood Alcohol Content', description: 'BAC level analysis' }
  ];

  useEffect(() => {
    fetchTestTypes();
  }, []);

  const fetchTestTypes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/lab-test-types');
      // Backend returns { testTypeID, testName, description, isActive }
      const mapped = response.data.map(t => ({
        id: t.testTypeID,
        name: t.testName,
        description: t.description
      }));
      setTestTypes(mapped);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch laboratory test types.');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.caseNumber || !formData.testTypeId) {
      setError('Case Number and Test Type are mandatory fields.');
      return;
    }

    try {
      // In a real app, caseNumber would be resolved to caseId. Assuming caseNumber is caseId for now.
      const caseId = formData.caseNumber;
      await api.post(`/cases/${caseId}/lab-requests`, {
        requesterID: 1, // Mocked UserID
        testTypeID: parseInt(formData.testTypeId),
        notes: formData.notes
      });
      
      setSuccess(`Lab request created successfully for Case ${formData.caseNumber}.`);
      setFormData({ caseNumber: '', testTypeId: '', notes: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('An error occurred while submitting the request.');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Laboratory Module...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-panel animate-in" style={{ padding: '2.5rem' }}>
        
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--surface-200)', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Microscope size={24} style={{ color: 'var(--primary-500)' }} />
            <span>New Laboratory Request</span>
          </h2>
          <p>Request diagnostic and toxicology laboratory tests (SCR-007)</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} style={{ marginRight: '0.5rem', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="alert" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid #a7f3d0', marginBottom: '1.5rem' }}>
            <Save size={18} style={{ marginRight: '0.5rem', flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            
            <div className="input-group">
              <label className="input-label" htmlFor="caseNumber">Case Number</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', color: 'var(--surface-300)' }}>
                  <FileText size={18} />
                </div>
                <input 
                  id="caseNumber"
                  name="caseNumber"
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. COL/2026/CL/0001"
                  value={formData.caseNumber}
                  onChange={handleInputChange}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="testTypeId">Test Type (Dynamic Lookup)</label>
              <select 
                id="testTypeId"
                name="testTypeId"
                className="input-field"
                value={formData.testTypeId}
                onChange={handleInputChange}
                style={{ height: '46px' }}
                required
              >
                <option value="" disabled>Select a test type...</option>
                {testTypes.map((test) => (
                  <option key={test.id} value={test.id}>
                    {test.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label className="input-label" htmlFor="notes">Clinical Notes / Instructions for Lab</label>
            <textarea 
              id="notes"
              name="notes"
              className="input-field" 
              rows="4"
              placeholder="Provide any specific context or focus areas for the laboratory technicians..."
              value={formData.notes}
              onChange={handleInputChange}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              <Plus size={18} />
              <span>Submit Lab Request</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default LabInvestigations;
