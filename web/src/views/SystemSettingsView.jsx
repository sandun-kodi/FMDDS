import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Settings, Building, Sliders, Database, AlertCircle, RefreshCw } from 'lucide-react';

const SystemSettingsView = () => {
  const { hasAnyPermission } = useAuth();
  const [settings, setSettings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSettings = async () => {
    if (!hasAnyPermission('admin:stats', 'user:manage')) {
      setError('Access Denied: Only system administrators have permission to view settings.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const data = await adminService.getSystemSettings();
      setSettings(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load system settings from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div className="card animate-in" style={{ padding: '2rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}>
              <Settings size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                System Settings & Metadata (SCR-014)
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Configure hospital units, department parameters, and database counter states
              </p>
            </div>
          </div>

          <button className="btn btn-outline" onClick={fetchSettings} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {isLoading ? (
          <LoadingSpinner message="Fetching system settings..." />
        ) : error ? (
          <div style={{ padding: '1rem', color: '#b91c1c', backgroundColor: '#fef2f2', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {settings.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Key</th>
                      <th style={{ padding: '10px' }}>Value</th>
                      <th style={{ padding: '10px' }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settings.map((s) => (
                      <tr key={s.settingID || s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', fontWeight: 700, color: 'var(--primary-600)' }}>{s.settingKey}</td>
                        <td style={{ padding: '10px', fontWeight: 600 }}>{s.settingValue}</td>
                        <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{s.description || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No custom system setting overrides stored in database. Standard environment defaults active.
              </div>
            )}

            <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={18} style={{ color: 'var(--primary-600)' }} /> Hospital & Ward Registry
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Hospitals: NHSL Colombo, CSTH Kalubowila, Teaching Hospital Peradeniya.
              </p>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database size={18} style={{ color: 'var(--primary-600)' }} /> Case Number Counter State
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                PostgreSQL Atomic Counter Table: <code>CaseNumberCounters</code> (Prefix: <code>COL</code>, Format: <code>COL/&#123;YYYY&#125;/&#123;Type&#125;/&#123;Seq&#125;</code>)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemSettingsView;
