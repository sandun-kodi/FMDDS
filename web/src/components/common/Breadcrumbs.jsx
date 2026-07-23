import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_NAME_MAP = {
  'dashboard': 'Dashboard',
  'patients': 'Patients',
  'register': 'Register',
  'cases': 'Cases',
  'clinical': 'Clinical Exam',
  'autopsy': 'Postmortem Exam',
  'evidence': 'Evidence Ledger',
  'lab-requests': 'Laboratory Queue',
  'reports': 'Reports Queue',
  'admin': 'Administration',
  'users': 'User Management',
  'audit': 'Audit Logs',
  'settings': 'System Settings'
};

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  if (pathnames.length === 0 || pathnames[0] === 'login') return null;

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '0.85rem',
      color: 'var(--text-muted)',
      padding: '0.5rem 1.5rem',
      backgroundColor: 'var(--surface-50, #f8fafc)',
      borderBottom: '1px solid var(--border-subtle, #e2e8f0)'
    }}>
      <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--primary-600)', textDecoration: 'none' }}>
        <Home size={14} style={{ marginRight: '4px' }} />
        Home
      </Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const displayName = ROUTE_NAME_MAP[name] || name;

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight size={14} style={{ color: 'var(--surface-400)' }} />
            {isLast ? (
              <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{displayName}</span>
            ) : (
              <Link to={routeTo} style={{ color: 'var(--primary-600)', textDecoration: 'none' }}>
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
