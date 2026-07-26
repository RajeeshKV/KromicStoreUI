import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Redirect non-authenticated users to login, keeping track of where they wanted to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      // User is authenticated but lacks required role
      return (
        <div className="access-denied-container">
          <div className="card text-center">
            <h1 className="text-danger">Access Denied</h1>
            <p>You do not have permission to view this section.</p>
            <p className="subtext">Required: {allowedRoles.join(', ')}</p>
            <Navigate to="/" replace />
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
