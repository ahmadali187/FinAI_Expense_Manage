import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const isAuthenticated = !!localStorage.getItem('loggedInUser');

  if (!isAuthenticated) {
    // If not authenticated, redirect to the login page
    // Pass the current location to redirect back after login (optional)
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the child components (the protected page)
  return <Outlet />;
};

export default ProtectedRoute;