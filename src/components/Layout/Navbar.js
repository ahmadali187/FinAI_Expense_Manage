import React, { useContext } from 'react'; // Removed useState, useEffect. Added useContext
import { Link, useNavigate, useLocation } from 'react-router-dom';
// import * as storageService from '../../utils/storageService'; // No longer directly needed
import { UserContext } from '../../contexts/UserContext'; // Import UserContext

const Navbar = ({ toggleSidebar }) => { // Accept toggleSidebar prop
  const { loggedInUser, logout } = useContext(UserContext); // Use UserContext
  const navigate = useNavigate();
  const location = useLocation();

  // useEffect for checking auth is now handled within UserContext

  const handleLogout = () => {
    logout(); // Use logout from context
    navigate('/login');
  };

  return (
    <header className="navbar">
      {loggedInUser && ( /* Show toggle button only when logged in and sidebar is potentially visible */
        <button onClick={toggleSidebar} className="sidebar-toggle-btn">
          {/* Icon can be added here, e.g., ☰ or an SVG */}
          Menu
        </button>
      )}
      <Link to="/" className="navbar-brand">Expense Manager</Link>
      <nav className="navbar-links">
        {loggedInUser ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/settings">Settings</Link> {/* Add Settings Link */}
            <Link to="/profile">Profile</Link> {/* Add Profile Link */}
            <Link to="/report">Report</Link> {/* Add Report Link */}
            <a href="#!" onClick={handleLogout} style={{cursor: 'pointer'}}>Logout ({loggedInUser.name})</a>
          </>
        ) : (
          <>
            {/* Hide Login/Register links if on those pages, as per earlier requirement */}
            {location.pathname !== '/login' && location.pathname !== '/register' && location.pathname !== '/' && (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </>
        )}
      </nav>
    </header>
  );
};

export default Navbar;