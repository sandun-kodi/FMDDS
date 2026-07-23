import React, { useState, useEffect } from 'react';
import { labService } from '../services/labService';
import { useNotification } from '../context/NotificationContext';
import Modal from '../components/common/Modal';
import { FlaskConical, Plus, Edit, CheckCircle, Clock } from 'lucide-react';

const LabQueueView = () => {
  const { notifySuccess, notifyError } = useNotification();

  const [testTypes, setTestTypes] = useState([]);
  const [caseIdInput, setCaseIdInput] = useState('1');
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);

  const [labQueue, setLabQueue] = useState([
    { labRequestID: 1, caseID: 1, requestDate: '2026-07-05T12:22:00Z', status: 'Pending', testTypeName: 'Toxicology Screen' },
    { labRequestID: 2, caseID: 2, requestDate: '2026-07-06T09:15:00Z', status: 'Completed', testTypeName: 'DNA Profiling', result: 'Match confirmed with sample #A-9' }
  ]);

  // Selected request for results entry modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [resultText, setResultText] = useState('');
  const [isPostingResult, setIsPostingResult] = useState(false);

  useEffect(() => {
    labService.getTestTypes().then(types => setTestTypes(types || [])).catch(() => {});
  }, []);

  const handleCreateLabRequest = async (e) => {
    e.preventDefault();
    if (!caseIdInput) return;
    setIsCreatingRequest(true);
    try {
      const res = await labService.createLabRequest(parseInt(caseIdInput), 1);
      const newEntry = {
        labRequestID: res.labRequestID,
        caseID: res.caseID,
        requestDate: res.requestDate || new Date().toISOString(),
        status: res.status || 'Pending',
        testTypeName: 'Toxicology Screen'
      };
      setLabQueue(prev => [newEntry, ...prev]);
      notifySuccess(`Laboratory investigation request #${res.labRequestID} issued for Case #${res.caseID}!`);
    } catch (err) {
      notifyError(err.message || 'Failed to issue laboratory investigation request.');
    } finally {
      setIsCreatingRequest(false);
    }
  };

  const handlePostResult = async () => {
    if (!selectedRequest || !resultText.trim()) return;
    setIsPostingResult(true);
    try {
      const res = await labService.postLabResult(selectedRequest.labRequestID, 1, resultText.trim());
      notifySuccess(`Laboratory test result posted for Request #${selectedRequest.labRequestID}!`);

      setLabQueue(prev => prev.map(req => req.labRequestID === selectedRequest.labRequestID ? {
        ...req,
        status: 'Completed',
        result: resultText.trim()
      } : req));

      setSelectedRequest(null);
      setResultText('');
    } catch (err) {
      notifyError(err.message || 'Failed to post laboratory results.');
    } finally {
      setIsPostingResult(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
          Laboratory Investigation Queue & Results (SCR-007)
        </h2>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Issue diagnostic investigation orders and document laboratory findings
        </p>
      </div>

      {/* Request Creation Card */}
      <div className="card" style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} style={{ color: 'var(--primary-600)' }} /> Issue New Lab Investigation Request
        </h3>
        <form onSubmit={handleCreateLabRequest} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Case ID *</label>
            <input
              type="number"
              value={caseIdInput}
              onChange={(e) => setCaseIdInput(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={isCreatingRequest} style={{ padding: '0.55rem 1.25rem' }}>
            {isCreatingRequest ? 'Issuing Order...' : 'Issue Investigation Request'}
          </button>
        </form>
      </div>

      {/* Lab Queue Table */}
      <div className="card" style={{ padding: '1.25rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FlaskConical size={18} style={{ color: 'var(--primary-600)' }} /> Investigation Queue
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px' }}>Req ID</th>
                <th style={{ padding: '10px' }}>Case ID</th>
                <th style={{ padding: '10px' }}>Request Date</th>
                <th style={{ padding: '10px' }}>Status</th>
                <th style={{ padding: '10px' }}>Results Summary</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {labQueue.map(req => (
                <tr key={req.labRequestID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px', fontWeight: 700, color: 'var(--primary-600)' }}>#{req.labRequestID}</td>
                  <td style={{ padding: '10px' }}>Case #{req.caseID}</td>
                  <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{new Date(req.requestDate).toLocaleDateString()}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: req.status === 'Completed' ? '#dcfce7' : '#fef3c7',
                      color: req.status === 'Completed' ? '#15803d' : '#b45309'
                    }}>
                      {req.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px', maxWidth: '300px' }}>{req.result || 'Pending Analysis'}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    <button
                      className="btn btn-outline"
                      onClick={() => { setSelectedRequest(req); setResultText(req.result || ''); }}
                      style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Edit size={14} /> Enter Results
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Entry Modal */}
      {selectedRequest && (
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title={`Record Laboratory Test Findings — Request #${selectedRequest.labRequestID}`}
          maxWidth="560px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
              <div><strong>Target Case:</strong> Case #{selectedRequest.caseID}</div>
              <div><strong>Requested Date:</strong> {new Date(selectedRequest.requestDate).toLocaleString()}</div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Laboratory Analysis Result *</label>
              <textarea
                rows={5}
                placeholder="Enter detailed laboratory findings, toxicology levels, DNA loci matches..."
                value={resultText}
                onChange={(e) => setResultText(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setSelectedRequest(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePostResult} disabled={isPostingResult || !resultText.trim()}>
                {isPostingResult ? 'Submitting Result...' : 'Post Laboratory Result'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LabQueueView;
