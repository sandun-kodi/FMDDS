import React, { useState } from 'react';
import { Plus, Trash2, AlertCircle, List, FileText } from 'lucide-react';

const CauseOfDeathForm = () => {
  const [causes, setCauses] = useState([
    { id: 1, type: 'Final', category: 'Immediate', description: '' }
  ]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddCause = () => {
    const newId = causes.length > 0 ? Math.max(...causes.map(c => c.id)) + 1 : 1;
    setCauses([
      ...causes,
      { id: newId, type: 'Final', category: 'Antecedent', description: '' }
    ]);
  };

  const handleRemoveCause = (id) => {
    if (causes.length === 1) {
      setError('At least one cause of death record must be present.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setCauses(causes.filter(c => c.id !== id));
  };

  const handleChange = (id, field, value) => {
    setCauses(causes.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    // Validate
    for (let c of causes) {
      if (!c.description.trim()) {
        setError('Description cannot be empty for any cause of death record.');
        setTimeout(() => setError(''), 3000);
        return;
      }
    }
    
    try {
      const caseId = 1; // Hardcoded for demo
      const payload = causes.map(c => ({
        recordType: c.type,
        category: c.category,
        description: c.description
      }));
      
      const token = localStorage.getItem('fmdds_token');
      await fetch(`http://localhost:5200/api/v1/cases/${caseId}/postmortem-exam/causes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      setSuccess('Cause of Death records saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save cause of death records.');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-panel animate-in" style={{ padding: '2.5rem' }}>
        
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--surface-200)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <List size={24} style={{ color: 'var(--primary-500)' }} />
              <span>Cause of Death (COD) Entry</span>
            </h2>
            <p>Record multi-part causes of death (SCR-006 Section 4)</p>
          </div>
          <button type="button" onClick={handleAddCause} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--surface-100)', color: 'var(--primary-600)', border: '1px solid var(--surface-200)' }}>
            <Plus size={16} /> Add Record
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} style={{ marginRight: '0.5rem', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="alert" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid #a7f3d0', marginBottom: '1.5rem' }}>
            <List size={18} style={{ marginRight: '0.5rem', flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
            {causes.map((cause, index) => (
              <div key={cause.id} style={{ 
                backgroundColor: 'var(--surface-50)', 
                border: '1px solid var(--surface-200)', 
                borderRadius: '0.5rem', 
                padding: '1.5rem',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem' }}>Record #{index + 1}</h4>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveCause(cause.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title="Remove Record"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label">Record Type</label>
                    <select 
                      className="input-field" 
                      value={cause.type} 
                      onChange={(e) => handleChange(cause.id, 'type', e.target.value)}
                    >
                      <option value="Provisional">Provisional</option>
                      <option value="Final">Final</option>
                    </select>
                  </div>
                  
                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label">Category</label>
                    <select 
                      className="input-field" 
                      value={cause.category} 
                      onChange={(e) => handleChange(cause.id, 'category', e.target.value)}
                    >
                      <option value="Immediate">Immediate</option>
                      <option value="Antecedent">Antecedent</option>
                      <option value="Underlying">Underlying</option>
                      <option value="Manner of Death">Manner of Death</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Description</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '14px', left: '12px', color: 'var(--surface-300)' }}>
                      <FileText size={18} />
                    </div>
                    <textarea 
                      className="input-field" 
                      rows="2"
                      placeholder="Enter detailed description of the cause..."
                      value={cause.description}
                      onChange={(e) => handleChange(cause.id, 'description', e.target.value)}
                      style={{ paddingLeft: '2.5rem', resize: 'vertical' }}
                    />
                  </div>
                </div>

              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">
              Save All Records
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default CauseOfDeathForm;
