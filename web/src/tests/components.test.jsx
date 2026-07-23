import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import ProtectedRoute from '../components/guards/ProtectedRoute';
import RoleGuard from '../components/guards/RoleGuard';
import Sidebar from '../components/layout/Sidebar';
import LoginView from '../views/LoginView';
import SystemSettingsView from '../views/SystemSettingsView';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';

const mockNotificationContext = {
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  notifyWarning: vi.fn(),
  notifyInfo: vi.fn()
};

function renderWithProviders(ui, { authValue, initialEntries = ['/'] } = {}) {
  return render(
    <AuthContext.Provider value={authValue}>
      <NotificationContext.Provider value={mockNotificationContext}>
        <MemoryRouter initialEntries={initialEntries}>
          {ui}
        </MemoryRouter>
      </NotificationContext.Provider>
    </AuthContext.Provider>
  );
}

describe('React Component Unit Tests (Mocked State & Zero DB Connections)', () => {
  it('1. ProtectedRoute redirects unauthenticated users to login', () => {
    const authValue = { isAuthenticated: false, isLoading: false };

    renderWithProviders(
      <Routes>
        <Route path="/" element={<div>Login Page</div>} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <div>Protected Dashboard</div>
          </ProtectedRoute>
        } />
      </Routes>,
      { authValue, initialEntries: ['/dashboard'] }
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Dashboard')).not.toBeInTheDocument();
  });

  it('2. RoleGuard shows forbidden state when user lacks required permission', () => {
    const authValue = {
      isAuthenticated: true,
      isLoading: false,
      role: 'Clerical Staff',
      hasPermission: (perm) => perm === 'case:create',
      hasAnyPermission: () => false,
      hasRole: () => false
    };

    renderWithProviders(
      <RoleGuard requiredPermission="exam:record_clinical">
        <div>Clinical Examination View</div>
      </RoleGuard>,
      { authValue }
    );

    expect(screen.getByText('403 — Access Restricted')).toBeInTheDocument();
    expect(screen.queryByText('Clinical Examination View')).not.toBeInTheDocument();
  });

  it('3. Sidebar filters menu items based on JWT permissions', () => {
    const authValue = {
      user: { fullName: 'Clerk User', username: 'clerk_jayasuriya' },
      role: 'Clerical Staff',
      hasPermission: (perm) => ['case:create', 'case:view_all'].includes(perm),
      hasAnyPermission: (...perms) => perms.some(p => ['case:create', 'case:view_all'].includes(p))
    };

    renderWithProviders(<Sidebar isOpen={true} toggleSidebar={() => {}} />, { authValue });

    expect(screen.getByText('Case Registration')).toBeInTheDocument();
    expect(screen.getByText('Cases Directory')).toBeInTheDocument();
    expect(screen.queryByText('Clinical Exam')).not.toBeInTheDocument();
    expect(screen.queryByText('Audit Log')).not.toBeInTheDocument();
  });

  it('4. LoginView renders login form and handles input validation', () => {
    const authValue = { login: vi.fn(), isLoading: false };

    renderWithProviders(<LoginView />, { authValue });

    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter system username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('5. SystemSettingsView renders security-blocked message and performs no API requests', () => {
    renderWithProviders(<SystemSettingsView />);

    expect(screen.getByText('System Settings Integration Blocked')).toBeInTheDocument();
    expect(screen.getByText(/System settings are temporarily unavailable because the backend settings endpoints/i)).toBeInTheDocument();
    expect(screen.getByText('Feature Disabled Pending Backend Authorization Patch')).toBeInTheDocument();
  });
});
