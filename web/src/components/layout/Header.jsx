import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import HealthIndicator from '../common/HealthIndicator';
import { Activity, LogOut, Bell, User, Menu } from 'lucide-react';

const Header = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  return (
    <header className="header" style={{
      height: '64px',
      backgroundColor: 'var(--surface-0, #ffffff)',
      borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Brand & Menu Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onToggleSidebar}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: 'var(--primary-600, #0284c7)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Activity size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, lineHeight: 1.2, color: 'var(--text-main)' }}>
              FMDDS
            </h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Forensic Medicine Dept System</span>
          </div>
        </div>
      </div>

      {/* Right User Bar & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <HealthIndicator />

        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', position: 'relative' }} title="Notifications">
          <Bell size={18} />
        </button>

        {/* User Profile Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '4px 10px', borderRadius: '20px', backgroundColor: 'var(--surface-100, #f1f5f9)' }}>
          <User size={16} style={{ color: 'var(--primary-600)' }} />
          <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {user?.fullName || user?.username || 'Authenticated User'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {user?.role || 'Staff'}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => setShowConfirmLogout(true)}
          className="btn btn-outline"
          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
        >
          <LogOut size={15} style={{ marginRight: '6px' }} />
          Log Out
        </button>

        {/* Confirm Logout Modal */}
        {showConfirmLogout && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999
          }}>
            <div className="card animate-in" style={{ maxWidth: '380px', width: '90%', padding: '1.5rem', backgroundColor: '#fff', borderRadius: '12px' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>Confirm Sign Out</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Are you sure you want to log out of FMDDS? Your active session token will be invalidated on the server.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button className="btn btn-outline" onClick={() => setShowConfirmLogout(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={logout}>Sign Out</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
