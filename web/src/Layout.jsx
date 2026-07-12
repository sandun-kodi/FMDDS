import React from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Activity, 
  Home, 
  UserPlus, 
  FileText, 
  FileSearch, 
  ClipboardList, 
  FlaskConical, 
  FolderLock, 
  LogOut,
  Bell,
  Settings,
  Paperclip
} from 'lucide-react';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = JSON.parse(localStorage.getItem('fmdds_user')) || { FullName: 'Guest', role: 'No Role' };

  const handleLogout = () => {
    localStorage.removeItem('fmdds_token');
    localStorage.removeItem('fmdds_user');
    navigate('/');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <Home size={18} /> },
    { name: 'Register Patient', path: '/patients/register', icon: <UserPlus size={18} /> },
    { name: 'Register Case', path: '/cases/register', icon: <FileText size={18} /> },
    { name: 'Clinical Exam', path: '/exams/clinical', icon: <ClipboardList size={18} /> },
    { name: 'Postmortem Exam', path: '/exams/postmortem', icon: <FolderLock size={18} /> },
    { name: 'Lab Investigations', path: '/lab', icon: <FlaskConical size={18} /> },
    { name: 'Document Attachments', path: '/documents', icon: <Paperclip size={18} /> },
    { name: 'Search Cases', path: '/search', icon: <FileSearch size={18} /> },
    { name: 'System Settings', path: '/settings', icon: <Settings size={18} /> }
  ];

  return (
    <div className="layout-container">
      {/* Header */}
      <header className="layout-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Activity size={24} style={{ color: 'var(--primary-500)' }} />
          <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary-600)' }}>FMDDS Portal</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Bell size={20} />
          </button>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{userData.FullName}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{userData.role || 'User'}</span>
          </div>

          <button onClick={handleLogout} className="btn" style={{ 
            padding: '0.5rem 1rem', 
            fontSize: '0.85rem',
            backgroundColor: 'var(--surface-200)',
            color: 'var(--text-main)',
            border: '1px solid var(--surface-300)'
          }}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="layout-sidebar">
        <nav>
          <ul className="nav-list">
            {menuItems.map((item) => (
              <li key={item.name}>
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div style={{ padding: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Environment: Local
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="layout-main">
        {children}
      </main>

      {/* Footer */}
      <footer className="layout-footer">
        <span>© 2026 Forensic Medicine Department. All Rights Reserved.</span>
        <span>System Status: <strong style={{ color: 'var(--success)' }}>Online</strong></span>
      </footer>
    </div>
  );
};

export default Layout;
