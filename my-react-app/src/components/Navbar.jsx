import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
    setMenuOpen(false); // also close the menu on logout
  };

  const handleToggleMenu = () => {
    setMenuOpen(prevOpen => !prevOpen);
  };

  // When a link is clicked, close the mobile menu
  const handleLinkClick = () => {
    setMenuOpen(false);
  };

  // Click outside detection: on mobile, if the user clicks outside of the navbar, close the menu.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar" role="navigation" aria-label="Main Navigation" ref={navRef}>
      <div className="nav-container">
        <h1 className="nav-logo">MyPortfolio</h1>
        {/* Hamburger Menu Toggle (visible on mobile) */}
        <button
          className="nav-toggle"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={handleToggleMenu}
        >
          ☰
        </button>
        <ul className={`nav-menu ${menuOpen ? 'open' : ''}`}>
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              onClick={handleLinkClick}
              tabIndex={0}
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/work"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              onClick={handleLinkClick}
              tabIndex={0}
            >
              Works
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/blogs"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              onClick={handleLinkClick}
              tabIndex={0}
            >
              Blogs
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/achievements"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              onClick={handleLinkClick}
              tabIndex={0}
            >
              Achievements
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/contact"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              onClick={handleLinkClick}
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
                onClick={handleLinkClick}
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
