import React from 'react';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotFoundView = () => {
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
        backgroundColor: 'var(--slate-100, #f1f5f9)',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem'
      }}>
        <FileQuestion size={40} />
      </div>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
        404 — Page Not Found
      </h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '460px', marginBottom: '1.5rem', lineHeight: 1.5 }}>
        The requested URL path does not exist in the Forensic Medicine Department Database System.
      </p>
      <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
        <ArrowLeft size={16} style={{ marginRight: '6px' }} />
        Return to Dashboard
      </button>
    </div>
  );
};

export default NotFoundView;
