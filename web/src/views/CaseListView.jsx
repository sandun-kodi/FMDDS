import React, { useState, useEffect } from 'react';
import { caseService } from '../services/caseService';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { FolderOpen, Search, RefreshCw, Filter, Eye, Edit, Stethoscope, Skull } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CaseListView = () => {
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useNotification();
  const { hasRole } = useAuth();

  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter state
  const [statusFilter, setStatusFilter] = useState('');
  const [caseTypeFilter, setCaseTypeFilter] = useState('');
  const [nicFilter, setNicFilter] = useState('');

  // Selected case modal
  const [selectedCase, setSelectedCase] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchCases = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await caseService.getAllCases({
        status: statusFilter,
        caseType: caseTypeFilter,
        nic: nicFilter
      });
      setCases(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load case records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleClearFilters = () => {
    setStatusFilter('');
    setCaseTypeFilter('');
    setNicFilter('');
    caseService.getAllCases({}).then(data => setCases(data || []));
  };

  const handleOpenDetailModal = (c) => {
    setSelectedCase(c);
    setNewStatus(c.status || 'Registered');
  };

  const handleUpdateStatus = async () => {
    if (!selectedCase || !newStatus) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await caseService.updateCaseStatus(selectedCase.caseID, newStatus);
      notifySuccess(`Status for Case ${selectedCase.caseNumber} updated to ${updated.status}!`);
      setSelectedCase(null);
      fetchCases();
    } catch (err) {
      notifyError(err.message || 'Failed to update case status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Case Directory & Advanced Search (SCR-010)
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Search, filter, and inspect registered medico-legal incident records
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchCases} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={16} /> Refresh Table
        </button>
      </div>

      {/* Filter Bar Card */}
      <div className="card" style={{ padding: '1.25rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={16} style={{ color: 'var(--primary-600)' }} /> Search Filters
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Case Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            >
              <option value="">All Statuses</option>
              <option value="Registered">Registered</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending Lab">Pending Lab</option>
              <option value="Report Drafted">Report Drafted</option>
              <option value="Report Approved">Report Approved</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Case Type</label>
            <select
              value={caseTypeFilter}
              onChange={(e) => setCaseTypeFilter(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            >
              <option value="">All Types</option>
              <option value="Clinical Forensic">Clinical Forensic</option>
              <option value="Postmortem">Postmortem</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Patient NIC</label>
            <input
              type="text"
              placeholder="e.g. 941234567V"
              value={nicFilter}
              onChange={(e) => setNicFilter(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={fetchCases} style={{ flex: 1, padding: '0.55rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Search size={15} /> Apply
            </button>
            <button className="btn btn-outline" onClick={handleClearFilters} style={{ padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}>
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Cases Data Table */}
      <div className="card" style={{ padding: '1.25rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        {isLoading ? (
          <LoadingSpinner message="Searching case database..." />
        ) : error ? (
          <div style={{ padding: '1rem', color: '#b91c1c', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
            {error}
          </div>
        ) : cases.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <FolderOpen size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>No Matching Cases Found</h3>
            <p style={{ fontSize: '0.85rem', margin: 0 }}>Try clearing search filters or registering a new case.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 12px' }}>Case Number</th>
                  <th style={{ padding: '10px 12px' }}>Patient Name</th>
                  <th style={{ padding: '10px 12px' }}>Case Type</th>
                  <th style={{ padding: '10px 12px' }}>Registration Date</th>
                  <th style={{ padding: '10px 12px' }}>Assigned Officer</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map(c => (
                  <tr key={c.caseID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: 700, color: 'var(--primary-600)' }}>
                      {c.caseNumber}
                    </td>
                    <td style={{ padding: '12px' }}>{c.patientName || 'N/A'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        backgroundColor: c.caseType?.includes('Clinical') ? '#eff6ff' : '#fdf4ff',
                        color: c.caseType?.includes('Clinical') ? '#1d4ed8' : '#a21caf'
                      }}>
                        {c.caseType}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                      {c.registrationDate ? new Date(c.registrationDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '12px' }}>{c.assignedOfficerName || `Officer #${c.assignedOfficerID || 'Unassigned'}`}</td>
                    <td style={{ padding: '12px' }}>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleOpenDetailModal(c)}
                        style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={14} /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Case Detail & Workflow Status Modal */}
      {selectedCase && (
        <Modal
          isOpen={!!selectedCase}
          onClose={() => setSelectedCase(null)}
          title={`Case Folder: ${selectedCase.caseNumber}`}
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Patient Name</div>
                <div style={{ fontWeight: 600 }}>{selectedCase.patientName || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Case Type</div>
                <div style={{ fontWeight: 600 }}>{selectedCase.caseType}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registration Date</div>
                <div>{selectedCase.registrationDate ? new Date(selectedCase.registrationDate).toLocaleString() : 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Status</div>
                <StatusBadge status={selectedCase.status} />
              </div>
            </div>

            {/* Workflow Quick Links */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>Examination Workflows</div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {selectedCase.caseType?.includes('Clinical') && (
                  <button className="btn btn-outline" onClick={() => { setSelectedCase(null); navigate(`/exams/clinical`, { state: { caseItem: selectedCase } }); }}>
                    <Stethoscope size={16} style={{ marginRight: '6px' }} /> Clinical Exam (SCR-005)
                  </button>
                )}
                {selectedCase.caseType?.includes('Postmortem') && (
                  <button className="btn btn-outline" onClick={() => { setSelectedCase(null); navigate(`/exams/postmortem`, { state: { caseItem: selectedCase } }); }}>
                    <Skull size={16} style={{ marginRight: '6px' }} /> Postmortem Autopsy (SCR-006)
                  </button>
                )}
              </div>
            </div>

            {/* Status Update Form */}
            {hasRole('JMO', 'Medical Officer', 'Clerk', 'Admin') && selectedCase.status !== 'Report Approved' && (
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Update Case Status Workflow
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Registered">Registered</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending Lab">Pending Lab</option>
                    <option value="Report Drafted">Report Drafted</option>
                    <option value="Closed">Closed</option>
                  </select>
                  <button
                    className="btn btn-primary"
                    onClick={handleUpdateStatus}
                    disabled={isUpdatingStatus || newStatus === selectedCase.status}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Edit size={16} />
                    {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CaseListView;
