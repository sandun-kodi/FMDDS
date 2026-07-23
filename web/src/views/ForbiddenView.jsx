import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ForbiddenView = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        backgroundColor: 'var(--amber-50, #fffbe0)',
        color: 'var(--amber-600, #d97706)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem'
      }}>
        <ShieldAlert size={40} />
      </div>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
        403 — Access Restricted
      </h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '460px', marginBottom: '1.5rem', lineHeight: 1.5 }}>
        You do not have permission to access this module or perform this operation under your current authenticated role.
      </p>
      <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>
        <ArrowLeft size={16} style={{ marginRight: '6px' }} />
        Return to Dashboard
      </button>
    </div>
  );
};

export default ForbiddenView;
