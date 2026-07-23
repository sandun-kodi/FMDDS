import React, { useState } from 'react';
import { evidenceService } from '../services/evidenceService';
import { useNotification } from '../context/NotificationContext';
import Modal from '../components/common/Modal';
import { PackageCheck, ArrowRightLeft, Plus, History, Shield } from 'lucide-react';

const EvidenceView = () => {
  const { notifySuccess, notifyError } = useNotification();

  const [caseIdInput, setCaseIdInput] = useState('1');
  const [evidenceType, setEvidenceType] = useState('Weapon');
  const [description, setDescription] = useState('');
  const [storageLocation, setStorageLocation] = useState('Safe Locker C-2');

  const [registeredItems, setRegisteredItems] = useState([
    { evidenceID: 1, caseID: 1, evidenceType: 'Weapon', description: 'Metallic knife retrieved at crime scene', storageLocation: 'Safe Locker C-2' },
    { evidenceID: 2, caseID: 1, evidenceType: 'Toxicology Sample', description: 'Blood vial 5ml', storageLocation: 'Refrigerated Vault R-1' }
  ]);

  const [isRegistering, setIsRegistering] = useState(false);

  // Transfer Custody Modal
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [receivingOfficerId, setReceivingOfficerId] = useState('3');
  const [newLocation, setNewLocation] = useState('Toxicology Laboratory');
  const [transferReason, setTransferReason] = useState('Chemical & Blood Alcohol Analysis');
  const [isTransferring, setIsTransferring] = useState(false);

  // Custody Log Ledger
  const [custodyLogs, setCustodyLogs] = useState({});

  const handleRegisterEvidence = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsRegistering(true);
    try {
      const item = await evidenceService.registerEvidence(parseInt(caseIdInput), {
        officerID: 1,
        evidenceType,
        description: description.trim(),
        storageLocation
      });
      setRegisteredItems(prev => [item, ...prev]);
      notifySuccess(`Evidence Item #${item.evidenceID} registered in Safe Locker ${item.storageLocation}!`);
      setDescription('');
    } catch (err) {
      notifyError(err.message || 'Failed to register physical evidence item.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleOpenTransferModal = async (item) => {
    setSelectedEvidence(item);
    try {
      const logs = await evidenceService.getCustodyLog(item.evidenceID);
      setCustodyLogs(prev => ({ ...prev, [item.evidenceID]: logs }));
    } catch (e) {
      // Use client fallback if not fetched
    }
  };

  const handleExecuteTransfer = async () => {
    if (!selectedEvidence) return;
    setIsTransferring(true);
    try {
      const custody = await evidenceService.transferCustody(selectedEvidence.evidenceID, {
        transferringOfficerID: 1,
        receivingOfficerID: parseInt(receivingOfficerId),
        newLocation,
        reason: transferReason
      });

      notifySuccess(`Chain of Custody transfer logged! Custody ID: #${custody.custodyID}`);
      setSelectedEvidence(null);
    } catch (err) {
      notifyError(err.message || 'Failed to execute custody transfer.');
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
          Evidence Management & Custody Ledger (SCR-008)
        </h2>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Track physical evidence lockers, sample custody transfers, and immutable custody audit trails
        </p>
      </div>

      {/* Registration Form Card */}
      <div className="card" style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} style={{ color: 'var(--primary-600)' }} /> Register Physical Evidence Item
        </h3>
        <form onSubmit={handleRegisterEvidence} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Target Case ID *</label>
            <input
              type="number"
              value={caseIdInput}
              onChange={(e) => setCaseIdInput(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Evidence Type *</label>
            <select
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value="Weapon">Weapon</option>
              <option value="Toxicology Sample">Toxicology Sample</option>
              <option value="DNA Swab">DNA Swab</option>
              <option value="Clothing Item">Clothing Item</option>
              <option value="Histology Specimen">Histology Specimen</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Storage Locker *</label>
            <input
              type="text"
              placeholder="e.g. Safe Locker C-2"
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              required
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Description *</label>
            <input
              type="text"
              placeholder="Detailed description of item..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              required
            />
          </div>

          <div>
            <button type="submit" className="btn btn-primary" disabled={isRegistering} style={{ width: '100%', padding: '0.55rem' }}>
              {isRegistering ? 'Logging Evidence...' : 'Log Evidence Item'}
            </button>
          </div>
        </form>
      </div>

      {/* Registered Evidence Items Table */}
      <div className="card" style={{ padding: '1.25rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PackageCheck size={18} style={{ color: 'var(--primary-600)' }} /> Registered Case Evidence
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px' }}>Item ID</th>
                <th style={{ padding: '10px' }}>Case ID</th>
                <th style={{ padding: '10px' }}>Evidence Type</th>
                <th style={{ padding: '10px' }}>Description</th>
                <th style={{ padding: '10px' }}>Storage Location</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registeredItems.map(item => (
                <tr key={item.evidenceID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px', fontWeight: 700, color: 'var(--primary-600)' }}>#{item.evidenceID}</td>
                  <td style={{ padding: '10px' }}>Case #{item.caseID}</td>
                  <td style={{ padding: '10px' }}>{item.evidenceType}</td>
                  <td style={{ padding: '10px' }}>{item.description}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', fontSize: '0.75rem', fontWeight: 600 }}>
                      {item.storageLocation}
                    </span>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    <button
                      className="btn btn-outline"
                      onClick={() => handleOpenTransferModal(item)}
                      style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <ArrowRightLeft size={14} /> Transfer Custody
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custody Transfer Modal */}
      {selectedEvidence && (
        <Modal
          isOpen={!!selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
          title={`Initiate Chain of Custody Transfer — Item #${selectedEvidence.evidenceID}`}
          maxWidth="560px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
              <div><strong>Item:</strong> {selectedEvidence.evidenceType} ({selectedEvidence.description})</div>
              <div><strong>Current Vault Location:</strong> {selectedEvidence.storageLocation}</div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Receiving Officer ID *</label>
              <input
                type="number"
                value={receivingOfficerId}
                onChange={(e) => setReceivingOfficerId(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>New Custody Location *</label>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Reason for Custody Transfer *</label>
              <textarea
                rows={2}
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setSelectedEvidence(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleExecuteTransfer} disabled={isTransferring}>
                {isTransferring ? 'Logging Transfer...' : 'Sign & Execute Transfer'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EvidenceView;
