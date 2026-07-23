import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      height: '40px',
      backgroundColor: 'var(--surface-0, #ffffff)',
      borderTop: '1px solid var(--border-subtle, #e2e8f0)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      fontSize: '0.75rem',
      color: 'var(--text-muted)'
    }}>
      <div>© 2026 Forensic Medicine Department | Medico-Legal Database System</div>
      <div>Designed with data privacy and security principles</div>
    </footer>
  );
};

export default Footer;
