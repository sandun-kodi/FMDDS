import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';

const AuditLogView = () => {
  const { hasPermission } = useAuth();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const fetchAuditLogs = async () => {
    if (!hasPermission('admin:audit')) {
      setError('Access Denied: Only administrators with `admin:audit` permission can view audit logs.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const data = await adminService.getAuditLogs(page, 100);
      setLogs(data || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve system audit logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page]);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="card animate-in" style={{ padding: '2rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Audit Log Viewer (SCR-013)
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Immutable audit ledger tracking system operations and security events from backend
              </p>
            </div>
          </div>

          <button className="btn btn-outline" onClick={fetchAuditLogs} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {isLoading ? (
          <LoadingSpinner message="Fetching live audit logs..." />
        ) : error ? (
          <div style={{ padding: '1rem', color: '#b91c1c', backgroundColor: '#fef2f2', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
            No audit log entries recorded in database.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 12px' }}>Log ID</th>
                  <th style={{ padding: '10px 12px' }}>Action</th>
                  <th style={{ padding: '10px 12px' }}>User ID</th>
                  <th style={{ padding: '10px 12px' }}>Timestamp (UTC)</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.auditLogID || log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--primary-600)' }}>
                      #{log.auditLogID || log.id}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{log.action}</td>
                    <td style={{ padding: '10px 12px' }}>{log.userID ? `User #${log.userID}` : 'System / Anonymous'}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogView;
