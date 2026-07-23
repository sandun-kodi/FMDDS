import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Activity } from 'lucide-react';

const HealthIndicator = () => {
  const { healthStatus } = useAuth();
  const isHealthy = healthStatus?.isHealthy;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '0.75rem',
      fontWeight: 500,
      padding: '4px 10px',
      borderRadius: '12px',
      backgroundColor: isHealthy ? '#ecfdf5' : '#fef2f2',
      color: isHealthy ? '#047857' : '#b91c1c',
      border: `1px solid ${isHealthy ? '#a7f3d0' : '#fecaca'}`
    }} title={healthStatus?.message}>
      <span style={{
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        backgroundColor: isHealthy ? '#10b981' : '#ef4444',
        boxShadow: isHealthy ? '0 0 6px #10b981' : '0 0 6px #ef4444'
      }} />
      <Activity size={12} />
      <span>{healthStatus?.message || (isHealthy ? 'Online' : 'Degraded')}</span>
    </div>
  );
};

export default HealthIndicator;
