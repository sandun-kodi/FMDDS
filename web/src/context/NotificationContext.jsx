import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', timeoutMs = 5000) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type }]);

    if (timeoutMs > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, timeoutMs);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const notifySuccess = useCallback((msg) => addNotification(msg, 'success'), [addNotification]);
  const notifyError = useCallback((msg) => addNotification(msg, 'error', 7000), [addNotification]);
  const notifyInfo = useCallback((msg) => addNotification(msg, 'info'), [addNotification]);

  return (
    <NotificationContext.Provider value={{ notifySuccess, notifyError, notifyInfo }}>
      {children}
      {/* Toast Notification Container */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '400px'
      }}>
        {notifications.map(n => (
          <div key={n.id} className={`alert alert-${n.type === 'error' ? 'error' : n.type === 'success' ? 'success' : 'info'} animate-in`} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-md)',
            margin: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {n.type === 'error' && <AlertCircle size={18} />}
              {n.type === 'success' && <CheckCircle size={18} />}
              {n.type === 'info' && <Info size={18} />}
              <span>{n.message}</span>
            </div>
            <button
              onClick={() => removeNotification(n.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '2px' }}
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return ctx;
};
