import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const handleToggleMenu = () => {
    setMenuOpen((prevOpen) => !prevOpen);
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main Navigation">
      <div className="nav-container">
        <h1 className="nav-logo">MyPortfolio</h1>

        {/* Hamburger Menu Toggle (visible on mobile) */}
        <button
          className="nav-toggle"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={handleToggleMenu}
        >
          {/* You might replace this with an icon from a library like react-icons */}
          ☰
        </button>

        <ul className={`nav-menu ${menuOpen ? 'open' : ''}`}>
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              aria-current={({ isActive }) => isActive ? "page" : undefined}
              tabIndex={0}
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/work"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              aria-current={({ isActive }) => isActive ? "page" : undefined}
              tabIndex={0}
            >
              Works
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/blogs"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              aria-current={({ isActive }) => isActive ? "page" : undefined}
              tabIndex={0}
            >
              Blogs
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/achievements"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              aria-current={({ isActive }) => isActive ? "page" : undefined}
              tabIndex={0}
            >
              Achievements
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/contact"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              aria-current={({ isActive }) => isActive ? "page" : undefined}
              tabIndex={0}
            >
              Contact
            </NavLink>
          </li>
          
          {isAuthenticated && (
            <li>
              <button 
                className="nav-link logout-btn" 
                onClick={handleLogout}
                tabIndex={0}
              >
                Logout
              </button>
            </li>
          )}
          {isAdmin && (
            <li>
              <NavLink
                to="/admin/dashboard"
                className="nav-link"
                tabIndex={0}
              >
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
