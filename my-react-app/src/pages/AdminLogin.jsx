import { FaEye, FaEyeSlash } from "react-icons/fa";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext"; // Adjust path if needed
import "./AdminLogin.css";

const AdminLogin = () => {
  // States for admin credentials and feedback messages
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Toggle for password visibility

  const navigate = useNavigate();
  const { login } = useAuth();

  // Display toast notification for 3 seconds
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Toggle password field type
  const handleTogglePassword = () => {
    setShowPassword((prevState) => !prevState);
  };

  // Handle admin login API call
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Clear previous errors

    try {
      const response = await fetch("https://portfolio-1-716m.onrender.com/login/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });

      if (!response.ok) {
        let errData = {};
        try {
          errData = await response.json();
        } catch {
          errData.error = "Admin login failed.";
        }
        setErrorMessage(errData.error || "Admin login failed.");
        return;
      }

      await login();
      navigate("/");
    } catch (error) {
      console.error("Error during admin login:", error);
      setErrorMessage("An error occurred. Please try again.");
    }
  };

  // Handle guest view login with toast message
  const handleGuestView = async () => {
    setErrorMessage("");

    try {
      const response = await fetch("https://portfolio-1-716m.onrender.com/login/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        let errData = {};
        try {
          errData = await response.json();
        } catch {
          errData.error = "Guest view failed.";
        }
        setErrorMessage(errData.error || "Guest view failed.");
        return;
      }

      await login(); // Update auth context for guest
      showToast("You're viewing as a guest. Some features may be disabled.");
      setTimeout(() => navigate("/"), 1000);
    } catch (error) {
      console.error("Error during guest view:", error);
      setErrorMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div className="admin-login-container">
      {/* Info Panel: Logo, welcome message */}
      <div className="info-panel">
        <div className="overlay" aria-hidden="true" />
        <div className="info-content">
          <h1 className="brand-title">Portfolio</h1>
          <p className="brand-subtitle">
            Welcome to My Portfolio – Explore My Work and Projects!
          </p>
          <p className="guest-info">
            Access My Portfolio – No Login Needed, Just Explore!
          </p>
        </div>
      </div>

      {/* Login Card */}
      <div className="login-card" role="form" aria-label="Administrator Login Form">
        <h2 className="login-title">Administrator Access</h2>
        {errorMessage && <p className="error" role="alert">{errorMessage}</p>}

        <form onSubmit={handleAdminLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="admin-username">Username</label>
            <input
              id="admin-username"
              type="text"
              aria-label="Admin username"
              placeholder="Enter your username"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group password-group">
            <label htmlFor="admin-password">Password</label>
            <div className="password-input-container">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                aria-label="Admin password"
                placeholder="Enter your password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={handleTogglePassword}
                className="toggle-password-btn"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn admin-login-btn" aria-label="Login as Admin">
            Login as Admin
          </button>
        </form>

        <div className="separator" aria-hidden="true">
          <span>OR</span>
        </div>

        <div className="guest-login">
          <button onClick={handleGuestView} className="btn guest-login-btn" aria-label="Continue as Guest">
            Continue as Guest
          </button>
          <span className="guest-badge" aria-label="Guest Mode">🔒 Guest Mode</span>
          <p className="guest-note">(View-only mode – some features may be disabled)</p>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && <div className="toast" role="status">{toastMessage}</div>}
    </div>
  );
};

export default AdminLogin;
