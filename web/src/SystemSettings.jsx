import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle, CheckCircle, Search, Edit2 } from 'lucide-react';
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

const SystemSettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  
  // Mock data for demo purposes if backend isn't ready
  const mockSettings = [
    { id: 1, key: 'MaxLoginAttempts', value: '5', description: 'Number of failed logins before lockout' },
    { id: 2, key: 'DefaultHospital', value: 'National Hospital Colombo', description: 'Default hospital for new cases' },
    { id: 3, key: 'SessionTimeoutMins', value: '30', description: 'User session timeout in minutes' },
    { id: 4, key: 'RetentionYears', value: '10', description: 'Number of years to retain archived cases' }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings');
      // Backend returns { settingID, settingKey, settingValue, description }
      const mapped = response.data.map(s => ({
        id: s.settingID,
        key: s.settingKey,
        value: s.settingValue,
        description: s.description
      }));
      setSettings(mapped);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch system settings.');
      setLoading(false);
    }
  };

  const handleValueChange = (id, newValue) => {
    setSettings(settings.map(s => 
      s.id === id ? { ...s, value: newValue } : s
    ));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaveSuccess('');
    
    try {
      // Backend expects { id, key, value, description }
      await api.put('/settings/bulk', settings);
      
      setSaveSuccess('System settings updated successfully.');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save system settings.');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Settings...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-panel animate-in" style={{ padding: '2.5rem' }}>
        
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--surface-200)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={24} style={{ color: 'var(--primary-500)' }} />
              <span>System Configuration</span>
            </h2>
            <p>Manage dynamic system parameters and lookups (SCR-014)</p>
          </div>
          <button onClick={handleSave} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Save size={18} /> Save Changes
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} style={{ marginRight: '0.5rem', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
        
        {saveSuccess && (
          <div className="alert" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid #a7f3d0', marginBottom: '1.5rem' }}>
            <CheckCircle size={18} style={{ marginRight: '0.5rem', flexShrink: 0 }} />
            <span>{saveSuccess}</span>
          </div>
        )}

        <div style={{ backgroundColor: 'var(--surface-50)', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--surface-200)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-100)', borderBottom: '1px solid var(--surface-200)' }}>
                <th style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-main)', width: '30%' }}>Setting Key</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-main)', width: '40%' }}>Value</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-main)', width: '30%' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((setting) => (
                <tr key={setting.id} style={{ borderBottom: '1px solid var(--surface-200)' }}>
                  <td style={{ padding: '1rem', color: 'var(--primary-700)', fontWeight: '500' }}>
                    {setting.key}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        className="input-field"
                        value={setting.value}
                        onChange={(e) => handleValueChange(setting.id, e.target.value)}
                        style={{ margin: 0, paddingRight: '2rem' }}
                      />
                      <Edit2 size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--surface-400)', pointerEvents: 'none' }} />
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {setting.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
      </div>
    </div>
  );
};

export default SystemSettings;
