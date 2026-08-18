import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';

const ProtectedUserRoute = () => {
  const { loggedInUser } = useContext(UserContext);
  const token = localStorage.getItem('finai_auth_token');

  if (!token && !loggedInUser) {
    return <Navigate to="/login" replace />;
  }

  if (loggedInUser && loggedInUser.role === 'admin') {
    // Admin trying to access normal user application -> Redirect to Admin dashboard
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default ProtectedUserRoute;
