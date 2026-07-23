import React from 'react';
import { useAuth } from '../../context/AuthContext';
import ForbiddenView from '../../views/ForbiddenView';

const RoleGuard = ({ requiredPermission, requiredPermissions = [], allowedRoles = [], children }) => {
  const { hasPermission, hasAnyPermission, hasRole } = useAuth();

  if (requiredPermission) {
    if (!hasPermission(requiredPermission)) {
      return <ForbiddenView />;
    }
  } else if (requiredPermissions && requiredPermissions.length > 0) {
    if (!hasAnyPermission(...requiredPermissions)) {
      return <ForbiddenView />;
    }
  } else if (allowedRoles && allowedRoles.length > 0) {
    if (!hasRole(...allowedRoles)) {
      return <ForbiddenView />;
    }
  }

  return children;
};

export default RoleGuard;
