import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: 'customer' | 'worker';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const location = useLocation();

  if (!token) {
    // Redirec to login with state to return after
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role !== requiredRole) {
    // Role mismatch: redirect to their own dashboard
    const redirectPath = role === 'customer' ? '/dashboard/customer' : '/dashboard/worker';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
