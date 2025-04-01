import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  // Debug logs:
  console.log("Navbar - isAuthenticated:", isAuthenticated);
  console.log("Navbar - isAdmin:", isAdmin);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <h1 className="nav-logo">MyPortfolio</h1>
        <ul className="nav-menu">
          <li>
            <NavLink to="/" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/work" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Works
            </NavLink>
          </li>
          <li>
            <NavLink to="/blogs" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Blogs
            </NavLink>
          </li>
          <li>
            <NavLink to="/achievements" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Achievements
            </NavLink>
          </li>
          <li>
            <NavLink to="/contact" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Contact
            </NavLink>
          </li>
          {/* Show Logout for any authenticated user */}
          {isAuthenticated && (
            <li>
              <button className="nav-link logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </li>
          )}
          {isAdmin && (
            <li>
              <NavLink to="/admin/dashboard" className="nav-link">
                Admin Panel
              </NavLink>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
