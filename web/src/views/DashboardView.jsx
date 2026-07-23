import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { caseService } from '../services/caseService';
import { adminService } from '../services/adminService';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  FolderOpen,
  Stethoscope,
  Skull,
  FileCheck,
  PlusCircle,
  UserPlus,
  ArrowRight,
  Activity,
  CheckCircle,
  Clock,
  BarChart2
} from 'lucide-react';

const DashboardView = () => {
  const { user, role, hasPermission, healthStatus } = useAuth();
  const navigate = useNavigate();

  const [cases, setCases] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError('');
      try {
        if (hasPermission('case:view_all')) {
          const caseData = await caseService.getAllCases();
          setCases(caseData || []);
        }

        if (hasPermission('admin:stats')) {
          const statsData = await adminService.getDashboardStats().catch(() => null);
          setAdminStats(statsData);
        }
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [hasPermission]);

  const totalCases = cases.length;
  const clinicalCases = cases.filter((c) => c.caseType?.toLowerCase().includes('clinical')).length;
  const postmortemCases = cases.filter((c) => c.caseType?.toLowerCase().includes('postmortem')).length;
  const approvedReports = cases.filter((c) => c.status === 'Report Approved').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Welcome Banner */}
      <div className="card animate-in" style={{
        padding: '1.5rem',
        backgroundColor: 'var(--surface-0, #ffffff)',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle, #e2e8f0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: 'var(--text-main)' }}>
            Welcome back, {user?.fullName || user?.username || 'User'}
          </h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Authenticated Role: <strong style={{ color: 'var(--primary-600)' }}>{role}</strong> | Medico-Legal System Portal
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {hasPermission('case:create') && (
            <Link to="/patients/register" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <UserPlus size={16} /> Patient Intake
            </Link>
          )}
          {hasPermission('case:create') && (
            <Link to="/cases/register" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <PlusCircle size={16} /> Register Case
            </Link>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Cases</span>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <FolderOpen size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {isLoading ? '...' : adminStats?.totalCases ?? totalCases}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Registered in database</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Clinical Cases</span>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#d97706' }}>
              <Stethoscope size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {isLoading ? '...' : adminStats?.clinicalCases ?? clinicalCases}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Living patient exams</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Postmortem Cases</span>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#fae8ff', color: '#c026d3' }}>
              <Skull size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {isLoading ? '...' : adminStats?.postmortemCases ?? postmortemCases}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Autopsy examinations</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Approved Reports</span>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#16a34a' }}>
              <FileCheck size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {isLoading ? '...' : adminStats?.approvedReports ?? approvedReports}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Signed & locked reports</div>
        </div>
      </div>

      {/* Grid for Cases Overview and System Health */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        {hasPermission('case:view_all') && (
          <div className="card" style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Recent Medico-Legal Cases</h3>
              <Link to="/cases" style={{ fontSize: '0.85rem', color: 'var(--primary-600)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View Directory <ArrowRight size={14} />
              </Link>
            </div>

            {isLoading ? (
              <LoadingSpinner message="Fetching cases..." />
            ) : error ? (
              <div style={{ padding: '1rem', color: '#b91c1c', backgroundColor: '#fef2f2', borderRadius: '8px', fontSize: '0.85rem' }}>
                {error}
              </div>
            ) : cases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No cases currently recorded in database.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '8px 12px' }}>Case Number</th>
                      <th style={{ padding: '8px 12px' }}>Patient Name</th>
                      <th style={{ padding: '8px 12px' }}>Case Type</th>
                      <th style={{ padding: '8px 12px' }}>Registration Date</th>
                      <th style={{ padding: '8px 12px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.slice(0, 5).map((c) => (
                      <tr key={c.caseID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--primary-600)' }}>
                          <Link to="/cases" style={{ color: 'inherit', textDecoration: 'none' }}>
                            {c.caseNumber}
                          </Link>
                        </td>
                        <td style={{ padding: '10px 12px' }}>{c.patientName || 'N/A'}</td>
                        <td style={{ padding: '10px 12px' }}>{c.caseType}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                          {c.registrationDate ? new Date(c.registrationDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <StatusBadge status={c.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* System Health Card */}
        <div className="card" style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 1rem 0' }}>System Status</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} style={{ color: 'var(--primary-600)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>API Web Service</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={14} /> Healthy
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} style={{ color: 'var(--primary-600)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>PostgreSQL DB</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: healthStatus?.isHealthy ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={14} /> {healthStatus?.message || 'Connected'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} style={{ color: 'var(--primary-600)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Inactivity Auto-Logout</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>15 Minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
