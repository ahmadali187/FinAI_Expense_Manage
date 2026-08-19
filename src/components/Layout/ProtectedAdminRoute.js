import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';
import Unauthorized from '../common/Unauthorized';
import SplashScreen from './SplashScreen';

const ProtectedAdminRoute = () => {
  const { loggedInUser, loading } = useContext(UserContext);
  const token = localStorage.getItem('finai_auth_token');

  if (loading) {
    return <SplashScreen />;
  }

  if (!token && !loggedInUser) {
    return <Navigate to="/login" replace />;
  }

  if (loggedInUser && loggedInUser.role !== 'admin') {
    // Normal user trying to access admin panel -> Show 403 Unauthorized page
    return <Unauthorized />;
  }

  return <Outlet />;
};

export default ProtectedAdminRoute;
