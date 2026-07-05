import React, { useState } from 'react';
import { 
  FileText, 
  Users, 
  ClipboardList, 
  Hourglass, 
  FlaskConical, 
  AlertCircle, 
  PlusCircle, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';

const Dashboard = () => {
  const userData = JSON.parse(localStorage.getItem('fmdds_user')) || { FullName: 'Doctor', role: 'Medical Officer' };
  
  // Mock statistical data
  const stats = [
    { label: 'Total Active Cases', count: 142, icon: <FileText size={24} />, color: '#3197a4', bg: 'rgba(49, 151, 164, 0.1)' },
    { label: 'Pending Clinical Exams', count: 18, icon: <ClipboardList size={24} />, color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)' },
    { label: 'Pending Autopsies', count: 7, icon: <Hourglass size={24} />, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    { label: 'Pending Lab Reports', count: 24, icon: <FlaskConical size={24} />, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  ];

  // Mock Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New autopsy requested by Police Station - Colombo South (Case #PM-2026-089)", time: "10 mins ago", unread: true },
    { id: 2, message: "Histopathology result uploaded for Case #CL-2026-042", time: "1 hour ago", unread: true },
    { id: 3, message: "Court summons received for Dr. Perera (Case #CL-2026-015)", time: "2 hours ago", unread: false },
    { id: 4, message: "Medico-Legal Report approved and finalized for Case #PM-2026-031", time: "1 day ago", unread: false },
  ]);

  const handleDismissNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  // Role-based quick access configurations
  const getQuickLinks = () => {
    return [
      { label: 'Register New Patient', path: '/patients/register', desc: 'Add personal details first.' },
      { label: 'Create Case Folder', path: '/cases/register', desc: 'Initialize clinical or postmortem file.' },
      { label: 'Record Clinical Exam', path: '/exams/clinical', desc: 'Document live patient injuries.' },
      { label: 'Review Lab Requests', path: '/lab', desc: 'Check and update pending results.' },
    ];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title Greeting banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Overview Dashboard</h2>
          <p>Real-time system indicators and active queue telemetry</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.875rem', color: 'var(--primary-600)', background: 'var(--primary-50)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)' }}>
          <TrendingUp size={16} />
          <span>Queue Status: Normal</span>
        </div>
      </div>

      {/* Grid of Statistical Cards */}
      <div className="dashboard-grid">
        {stats.map((stat, i) => (
          <div key={i} className="glass-panel dashboard-card">
            <div className="card-icon-container" style={{ backgroundColor: stat.bg, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="card-info">
              <p style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
              <h3>{stat.count}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Dashboard body sections */}
      <div className="dashboard-sections">
        
        {/* Left Section: Quick Actions */}
        <div className="glass-panel animate-in" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PlusCircle size={20} style={{ color: 'var(--primary-500)' }} />
            <span>Quick Launch Actions</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {getQuickLinks().map((link, idx) => (
              <div 
                key={idx} 
                className="dashboard-card" 
                style={{ 
                  flexDirection: 'column', 
                  alignItems: 'flex-start', 
                  padding: '1.25rem',
                  border: '1px solid var(--surface-200)',
                  backgroundColor: 'var(--surface-0)',
                  cursor: 'pointer'
                }}
              >
                <h4 style={{ color: 'var(--primary-600)', display: 'flex', alignItems: 'center', gap: '0.25rem', width: '100%', justifyContent: 'space-between' }}>
                  <span>{link.label}</span>
                  <ArrowRight size={16} />
                </h4>
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{link.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section: Alerts & Notifications */}
        <div className="glass-panel animate-in" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} style={{ color: 'var(--primary-500)' }} />
            <span>Recent Alerts ({notifications.filter(n => n.unread).length})</span>
          </h3>
          
          {notifications.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No active alerts. All tasks updated.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  style={{ 
                    padding: '1rem', 
                    borderRadius: 'var(--radius-md)', 
                    backgroundColor: notif.unread ? 'var(--primary-50)' : 'var(--surface-0)',
                    borderLeft: `3px solid ${notif.unread ? 'var(--primary-500)' : 'var(--surface-300)'}`,
                    position: 'relative'
                  }}
                >
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', paddingRight: '1rem' }}>{notif.message}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{notif.time}</span>
                    <button 
                      onClick={() => handleDismissNotification(notif.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
