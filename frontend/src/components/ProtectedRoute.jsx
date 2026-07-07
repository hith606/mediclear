import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  
  if (!token || !userString) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userString);

  // Check if account is pending approval (Regulators, Consumers, and approved partners bypass this)
  if (
    user.role !== 'Regulatory Authority' && 
    user.role !== 'Consumer' && 
    user.status === 'Pending Approval' &&
    window.location.pathname !== '/dashboard'
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check if role is allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
