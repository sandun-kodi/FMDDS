import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  UserPlus,
  FilePlus,
  FolderOpen,
  Skull,
  PackageCheck,
  FlaskConical,
  FileCheck,
  Users,
  ShieldCheck,
  Settings
} from 'lucide-react';

const Sidebar = ({ isCollapsed }) => {
  const { role, hasPermission, hasAnyPermission } = useAuth();

  // All potential nav items with required JWT permissions
  const allNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, isAllowed: () => true },
    { path: '/patients/register', label: 'Patient Intake', icon: UserPlus, isAllowed: () => hasPermission('case:create') },
    { path: '/cases/register', label: 'Case Registration', icon: FilePlus, isAllowed: () => hasPermission('case:create') },
    { path: '/cases', label: 'Cases Directory', icon: FolderOpen, isAllowed: () => hasPermission('case:view_all') },
    { path: '/exams/postmortem', label: 'Postmortem Exams', icon: Skull, isAllowed: () => hasPermission('exam:record_postmortem') },
    { path: '/evidence', label: 'Evidence Ledger', icon: PackageCheck, isAllowed: () => hasPermission('evidence:manage') },
    { path: '/lab-requests', label: 'Lab Queue', icon: FlaskConical, isAllowed: () => hasAnyPermission('lab:request', 'lab:result_write') },
    { path: '/reports', label: 'Reports Queue', icon: FileCheck, isAllowed: () => hasAnyPermission('case:view_all', 'report:approve', 'report:print') },
    { path: '/admin/audit', label: 'Audit Logs', icon: ShieldCheck, isAllowed: () => hasPermission('admin:audit') },
    { path: '/admin/users', label: 'User Management', icon: Users, isAllowed: () => hasPermission('user:manage') },
    { path: '/admin/settings', label: 'System Settings', icon: Settings, isAllowed: () => hasAnyPermission('admin:stats', 'user:manage') },
  ];

  const allowedNavItems = allNavItems.filter((item) => item.isAllowed());

  return (
    <aside style={{
      width: isCollapsed ? '72px' : '250px',
      backgroundColor: 'var(--surface-0, #ffffff)',
      borderRight: '1px solid var(--border-subtle, #e2e8f0)',
      transition: 'width 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none'
    }}>
      <div style={{ padding: '1rem 0.75rem', flex: 1 }}>
        <div style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          padding: '0 0.5rem 0.5rem 0.5rem',
          display: isCollapsed ? 'none' : 'block'
        }}>
          Navigation ({role})
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  color: isActive ? 'var(--primary-600, #0284c7)' : 'var(--text-main, #334155)',
                  backgroundColor: isActive ? 'var(--primary-50, #f0f9ff)' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  transition: 'background 0.15s ease'
                })}
                title={item.label}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div style={{
        padding: '0.75rem',
        borderTop: '1px solid var(--border-subtle, #e2e8f0)',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        textAlign: isCollapsed ? 'center' : 'left'
      }}>
        {!isCollapsed && <div>FMDDS v1.0.0</div>}
      </div>
    </aside>
  );
};

export default Sidebar;
