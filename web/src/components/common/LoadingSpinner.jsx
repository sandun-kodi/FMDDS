import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message = 'Loading...', size = 24 }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      color: 'var(--text-muted)'
    }}>
      <Loader2 size={size} className="animate-spin" style={{ marginBottom: '0.5rem', color: 'var(--primary-600)' }} />
      <span style={{ fontSize: '0.85rem' }}>{message}</span>
    </div>
  );
};

export default LoadingSpinner;
