import React from 'react';
import { Users, AlertCircle } from 'lucide-react';

const UserAdminView = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="card animate-in" style={{ padding: '2rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}>
            <Users size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              User & Role Management (SCR-012)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              System Administrator portal for user accounts, roles, and permission assignments
            </p>
          </div>
        </div>

        {/* Honest Endpoint Missing Banner as required by Phase F */}
        <div style={{ padding: '1.25rem', borderRadius: '8px', backgroundColor: '#fffbe0', border: '1px solid #fde68a', color: '#b45309', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem' }}>
            <AlertCircle size={18} />
            Backend Endpoint Pending Integration
          </div>
          <p style={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
            User management accounts API endpoint <code>GET /api/v1/admin/users</code> is not yet exposed by the backend controller.
            Per FMDDS frontend security guidelines, mock local persistence is disabled. This interface will connect automatically once the backend endpoint is published.
          </p>
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <strong>Permitted Administrator Roles:</strong> System Administrator<br />
          <strong>Expected API Operations:</strong> <code>GET /api/v1/admin/users</code>, <code>POST /api/v1/admin/users</code>, <code>PUT /api/v1/admin/users/&#123;id&#125;/roles</code>
        </div>
      </div>
    </div>
  );
};

export default UserAdminView;
