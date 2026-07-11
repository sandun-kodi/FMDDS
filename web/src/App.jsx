import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import Layout from './Layout';
import PatientRegistration from './PatientRegistration';

import LabInvestigations from './LabInvestigations';
import SystemSettings from './SystemSettings';
import CauseOfDeathForm from './CauseOfDeathForm';
import AttachmentUploader from './AttachmentUploader';

// Placeholder components for routing completeness
const Placeholder = ({ title }) => (
  <div style={{ padding: '1rem' }}>
    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{title}</h2>
    <p style={{ color: 'var(--text-muted)' }}>This component is currently being developed and integrated. Check back soon.</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Protected routes wrapped in Layout */}
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/patients/register" element={<Layout><PatientRegistration /></Layout>} />
        <Route path="/cases/register" element={<Layout><Placeholder title="Register Case (SCR-004)" /></Layout>} />
        <Route path="/exams/clinical" element={<Layout><Placeholder title="Clinical Examination (SCR-005)" /></Layout>} />
        <Route path="/exams/postmortem" element={<Layout><CauseOfDeathForm /></Layout>} />
        <Route path="/lab" element={<Layout><LabInvestigations /></Layout>} />
        <Route path="/search" element={<Layout><Placeholder title="Search Cases (SCR-010)" /></Layout>} />
        <Route path="/documents" element={<Layout><AttachmentUploader /></Layout>} />
        <Route path="/settings" element={<Layout><SystemSettings /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
