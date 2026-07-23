import React from 'react';

const STATUS_STYLES = {
  'Registered': { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
  'In Progress': { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  'Pending Lab': { bg: '#fae8ff', color: '#86198f', border: '#f5d0fe' },
  'Report Drafted': { bg: '#ede9fe', color: '#6d28d9', border: '#ddd6fe' },
  'Report Approved': { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  'Closed': { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' }
};

const StatusBadge = ({ status }) => {
  const normalized = status || 'Registered';
  const style = STATUS_STYLES[normalized] || STATUS_STYLES['Registered'];

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 9px',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: 600,
      backgroundColor: style.bg,
      color: style.color,
      border: `1px solid ${style.border}`,
      whiteSpace: 'nowrap'
    }}>
      {normalized}
    </span>
  );
};

export default StatusBadge;
