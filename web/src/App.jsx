import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/guards/ProtectedRoute';
import RoleGuard from './components/guards/RoleGuard';
import Layout from './components/layout/Layout';

import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import PatientRegisterView from './views/PatientRegisterView';
import CaseRegisterView from './views/CaseRegisterView';
import CaseListView from './views/CaseListView';
import ClinicalExamView from './views/ClinicalExamView';
import PostmortemExamView from './views/PostmortemExamView';
import EvidenceView from './views/EvidenceView';
import LabQueueView from './views/LabQueueView';
import ReportsQueueView from './views/ReportsQueueView';
import UserAdminView from './views/UserAdminView';
import AuditLogView from './views/AuditLogView';
import SystemSettingsView from './views/SystemSettingsView';
import NotFoundView from './views/NotFoundView';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LoginView />} />
            <Route path="/login" element={<Navigate to="/" replace />} />

            {/* Authenticated Protected Routes wrapped in Layout */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout><DashboardView /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/patients/register" element={
              <ProtectedRoute>
                <RoleGuard requiredPermission="case:create">
                  <Layout><PatientRegisterView /></Layout>
                </RoleGuard>
              </ProtectedRoute>
            } />

            <Route path="/cases/register" element={
              <ProtectedRoute>
                <RoleGuard requiredPermission="case:create">
                  <Layout><CaseRegisterView /></Layout>
                </RoleGuard>
              </ProtectedRoute>
            } />

            <Route path="/cases" element={
              <ProtectedRoute>
                <RoleGuard requiredPermission="case:view_all">
                  <Layout><CaseListView /></Layout>
                </RoleGuard>
              </ProtectedRoute>
            } />

            <Route path="/cases/clinical/:caseId" element={
              <ProtectedRoute>
                <RoleGuard requiredPermission="exam:record_clinical">
                  <Layout><ClinicalExamView /></Layout>
                </RoleGuard>
              </ProtectedRoute>
            } />

            <Route path="/exams/clinical" element={
              <ProtectedRoute>
                <RoleGuard requiredPermission="exam:record_clinical">
                  <Layout><ClinicalExamView /></Layout>
                </RoleGuard>
              </ProtectedRoute>
            } />

            <Route path="/cases/autopsy/:caseId" element={
              <ProtectedRoute>
                <RoleGuard requiredPermission="exam:record_postmortem">
                  <Layout><PostmortemExamView /></Layout>
                </RoleGuard>
              </ProtectedRoute>
            } />

            <Route path="/exams/postmortem" element={
              <ProtectedRoute>
                <RoleGuard requiredPermission="exam:record_postmortem">
                  <Layout><PostmortemExamView /></Layout>
                </RoleGuard>
              </ProtectedRoute>
            } />

            <Route path="/evidence" element={
              <ProtectedRoute>
                <RoleGuard requiredPermission="evidence:manage">
                  <Layout><EvidenceView /></Layout>
                </RoleGuard>
              </ProtectedRoute>
            } />

            <Route path="/lab-requests" element={
              <ProtectedRoute>
                <RoleGuard requiredPermissions={['lab:request', 'lab:result_write']}>
                  <Layout><LabQueueView /></Layout>
                </RoleGuard>
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute>
                <RoleGuard requiredPermissions={['case:view_all', 'report:approve', 'report:print']}>
                  <Layout><ReportsQueueView /></Layout>
                </RoleGuard>
              </ProtectedRoute>
            } />

            <Route path="/admin/users" element={
              <ProtectedRoute>
                <RoleGuard requiredPermission="user:manage">
                  <Layout><UserAdminView /></Layout>
                </RoleGuard>
              </ProtectedRoute>
            } />

            <Route path="/admin/audit" element={
              <ProtectedRoute>
                <RoleGuard requiredPermission="admin:audit">
                  <Layout><AuditLogView /></Layout>
                </RoleGuard>
              </ProtectedRoute>
            } />

            <Route path="/admin/settings" element={
              <ProtectedRoute>
                <RoleGuard requiredPermissions={['admin:stats', 'user:manage']}>
                  <Layout><SystemSettingsView /></Layout>
                </RoleGuard>
              </ProtectedRoute>
            } />

            {/* 404 Fallback */}
            <Route path="*" element={
              <ProtectedRoute>
                <Layout><NotFoundView /></Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
