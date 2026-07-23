import React, { useState, useEffect } from 'react';
import { Shield, Key, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { adminService } from '../services/adminService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const UserAdminView = () => {
  const [rolesPermissions, setRolesPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const allPermissions = [
    'user:manage',
    'admin:audit',
    'admin:stats',
    'case:create',
    'case:view_all',
    'case:edit',
    'exam:record_clinical',
    'exam:record_postmortem',
    'lab:request',
    'lab:result_write',
    'evidence:manage',
    'report:approve',
    'report:print'
  ];

  const fetchRolesPermissions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await adminService.getRolesPermissions();
      setRolesPermissions(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load roles and permissions matrix.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesPermissions();
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '2rem' }}>
      <div className="card animate-in" style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}>
              <Shield size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Role & Permissions Management (SCR-012)
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                System Access Control Matrix — Live Role to Permission Mappings
              </p>
            </div>
          </div>
          <button className="btn btn-outline" onClick={fetchRolesPermissions} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} /> Refresh Matrix
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Fetching role and permission mappings..." />
      ) : error ? (
        <div style={{ padding: '1.25rem', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={20} /> {error}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Roles Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {rolesPermissions.map((role) => (
              <div key={role.roleID || role.roleName} className="card" style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
                  <Key size={18} style={{ color: 'var(--primary-600)' }} />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                    {role.roleName}
                  </h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.4 }}>
                  {role.description || 'System Role'}
                </p>

                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Assigned Permissions ({role.permissions?.length || 0}):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {role.permissions && role.permissions.length > 0 ? (
                    role.permissions.map((perm) => (
                      <span key={perm} style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe'
                      }}>
                        {perm}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', italic: true }}>No permissions assigned</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Role-Permission Matrix Table */}
          <div className="card" style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
              Full Authorization Matrix
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '10px', color: 'var(--text-main)' }}>Permission Key</th>
                  {rolesPermissions.map((r) => (
                    <th key={r.roleID} style={{ textAlign: 'center', padding: '10px', color: 'var(--text-main)' }}>
                      {r.roleName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allPermissions.map((permKey, idx) => (
                  <tr key={permKey} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>
                      {permKey}
                    </td>
                    {rolesPermissions.map((r) => {
                      const hasPerm = r.permissions?.includes(permKey);
                      return (
                        <td key={r.roleID} style={{ textAlign: 'center', padding: '8px 10px' }}>
                          {hasPerm ? (
                            <CheckCircle size={16} style={{ color: '#16a34a', display: 'inline' }} />
                          ) : (
                            <span style={{ color: '#cbd5e1' }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAdminView;
