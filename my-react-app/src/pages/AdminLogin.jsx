import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext"; // Adjust path if needed
import "./AdminLogin.css";

const AdminLogin = () => {
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/login/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies
        body: JSON.stringify({
          username: adminUsername,
          password: adminPassword,
        }),
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

  const handleGuestView = async () => {
    try {
      const response = await fetch("http://localhost:5000/login/user", {
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
      // Delay navigation slightly so the toast can be noticed
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      console.error("Error during guest view:", error);
      setErrorMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div className="admin-login-container">
      {/* Left side agenda/portfolio panel */}
      <div className="info-panel">
        <div className="overlay" />
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

      {/* Right side login form */}
      <div className="login-card" role="form">
        <h2 className="login-title">Administrator Access</h2>

        {errorMessage && <p className="error" role="alert">{errorMessage}</p>}

        <form onSubmit={handleAdminLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="admin-username">Username</label>
            <input
              id="admin-username"
              type="text"
              aria-label="Admin username"
              value={adminUsername}
              placeholder="Enter your username"
              onChange={(e) => setAdminUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              aria-label="Admin password"
              value={adminPassword}
              placeholder="Enter your password"
              onChange={(e) => setAdminPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn admin-login-btn"
            aria-label="Login as Admin"
          >
            Login as Admin
          </button>
        </form>

        <div className="separator">
          <span>OR</span>
        </div>

        <div className="guest-login">
          <button
            onClick={handleGuestView}
            className="btn guest-login-btn"
            aria-label="Continue as Guest"
          >
            Continue as Guest
          </button>
          <span className="guest-badge" aria-label="Guest Mode">
            🔒 Guest Mode
          </span>
          <p className="guest-note">(View-only mode – some features may be disabled)</p>
        </div>
      </div>

      {toastMessage && <div className="toast">{toastMessage}</div>}
    </div>
  );
};

export default AdminLogin;
