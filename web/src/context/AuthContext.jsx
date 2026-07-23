import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';
import { extractJwtUserData, isTokenExpired } from '../utils/jwtUtils';

const AuthContext = createContext(null);

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes inactivity

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    const savedToken = sessionStorage.getItem('fmdds_token') || localStorage.getItem('fmdds_token');
    if (savedToken && !isTokenExpired(savedToken)) {
      return savedToken;
    }
    // Clear stale or expired token
    sessionStorage.removeItem('fmdds_token');
    sessionStorage.removeItem('fmdds_user');
    localStorage.removeItem('fmdds_token');
    localStorage.removeItem('fmdds_user');
    return null;
  });

  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem('fmdds_user') || localStorage.getItem('fmdds_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [permissions, setPermissions] = useState(() => {
    const savedToken = sessionStorage.getItem('fmdds_token') || localStorage.getItem('fmdds_token');
    if (savedToken) {
      const decoded = extractJwtUserData(savedToken);
      return decoded?.permissions || [];
    }
    return [];
  });

  const [healthStatus, setHealthStatus] = useState({ isHealthy: true, message: 'Online' });

  // Update permissions when token changes
  useEffect(() => {
    if (token) {
      const decoded = extractJwtUserData(token);
      setPermissions(decoded?.permissions || []);
    } else {
      setPermissions([]);
    }
  }, [token]);

  // Logout method
  const logout = useCallback(async () => {
    try {
      if (token) {
        await apiClient.post('/auth/logout');
      }
    } catch (e) {
      // Client cleanup even if backend logout throws
    } finally {
      sessionStorage.removeItem('fmdds_token');
      sessionStorage.removeItem('fmdds_user');
      localStorage.removeItem('fmdds_token');
      localStorage.removeItem('fmdds_user');
      setUser(null);
      setToken(null);
      setPermissions([]);
    }
  }, [token]);

  // Login method
  const login = async (username, password) => {
    const res = await apiClient.post('/auth/login', { username, password });
    const { token: jwtToken, user: userData } = res.data;

    const decoded = extractJwtUserData(jwtToken);
    const userWithJwtData = {
      ...userData,
      userID: decoded?.userID || userData.userID,
      role: decoded?.role || userData.role
    };

    sessionStorage.setItem('fmdds_token', jwtToken);
    sessionStorage.setItem('fmdds_user', JSON.stringify(userWithJwtData));

    setToken(jwtToken);
    setUser(userWithJwtData);
    setPermissions(decoded?.permissions || []);

    return userWithJwtData;
  };

  // Listen for session expired events from apiClient
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setToken(null);
      setPermissions([]);
    };
    window.addEventListener('fmdds:session_expired', handleSessionExpired);
    return () => window.removeEventListener('fmdds:session_expired', handleSessionExpired);
  }, []);

  // 15-minute inactivity timeout timer
  useEffect(() => {
    if (!token) return;

    let timeoutId;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
      }, INACTIVITY_TIMEOUT_MS);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [token, logout]);

  // Poll system health periodically
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await apiClient.get('/health');
        setHealthStatus({
          isHealthy: res.data.status === 'Healthy',
          message: res.data.database?.status === 'Connected' ? 'System Online' : 'Database Degraded'
        });
      } catch (e) {
        setHealthStatus({ isHealthy: false, message: 'Backend Unavailable' });
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Permission authorization helper (authoritative check against JWT claims)
  const hasPermission = useCallback((permKey) => {
    if (!token || isTokenExpired(token)) return false;
    return permissions.includes(permKey);
  }, [token, permissions]);

  const hasAnyPermission = useCallback((...permKeys) => {
    if (!token || isTokenExpired(token)) return false;
    return permKeys.some((key) => permissions.includes(key));
  }, [token, permissions]);

  // Role fallback helper
  const hasRole = useCallback((...allowedRoles) => {
    if (!user || !user.role) return false;
    if (allowedRoles.includes('*') || allowedRoles.includes('All')) return true;
    const currentRole = user.role.toLowerCase();
    return allowedRoles.some((r) => r.toLowerCase() === currentRole);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      permissions,
      isAuthenticated: !!token && !!user && !isTokenExpired(token),
      role: user?.role || 'Guest',
      login,
      logout,
      hasPermission,
      hasAnyPermission,
      hasRole,
      healthStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
