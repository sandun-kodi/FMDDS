import React from 'react';
import { Settings, ShieldAlert, Lock } from 'lucide-react';

const SystemSettingsView = () => {
  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div className="card animate-in" style={{ padding: '2rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#fef2f2', color: '#dc2626' }}>
            <Settings size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              System Settings & Configuration (SCR-014)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              System metadata, hospital registry overrides, and database counter configuration
            </p>
          </div>
        </div>

        <div style={{
          padding: '2rem',
          backgroundColor: '#fef2f2',
          borderRadius: '10px',
          border: '1px solid #fca5a5',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626' }}>
            <ShieldAlert size={32} />
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#991b1b' }}>
            System Settings Integration Blocked
          </h3>

          <p style={{ fontSize: '0.9rem', color: '#7f1d1d', maxWidth: '600px', margin: 0, lineHeight: 1.5 }}>
            System settings are temporarily unavailable because the backend settings endpoints (<code>GET /api/v1/settings</code> and <code>PUT /api/v1/settings/bulk</code>) require authentication and permission enforcement before they can be safely exposed.
          </p>

          <div style={{
            fontSize: '0.8rem',
            color: '#991b1b',
            backgroundColor: '#fff',
            padding: '8px 14px',
            borderRadius: '6px',
            border: '1px solid #fca5a5',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Lock size={14} /> Feature Disabled Pending Backend Authorization Patch
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsView;
