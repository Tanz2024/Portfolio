// AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // We'll store role as "admin", "viewer", or "guest"
  const [role, setRole] = useState("guest");
  const [loading, setLoading] = useState(true);

  const isAdmin = role === "admin";
  const isAuthenticated = role === "admin" || role === "viewer";
  const checkAuth = async () => {
    try {
      const res = await fetch("https://tanzimportfolio.web.app/authenticate", {
        credentials: "include",
      });
  
      if (!res.ok) {
        throw new Error("Auth failed");
      }
  
      // Defensive check
      if (res.bodyUsed) {
        console.warn("Response body already used — skipping parse");
        return;
      }
  
      const data = await res.json();
      if (data.role_id === 1) {
        localStorage.setItem("role", "admin");
        setRole("admin");
      } else if (data.role_id === 2) {
        localStorage.setItem("role", "viewer");
        setRole("viewer");
      } else {
        localStorage.setItem("role", "guest");
        setRole("guest");
      }
    } catch (err) {
      console.warn("Auth check failed:", err);
      localStorage.setItem("role", "guest");
      setRole("guest");
    } finally {
      setLoading(false);
    }
  };
  

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Call this after a login action to update auth state immediately
  const login = async () => {
    await checkAuth();
  };

  // Logout clears the role
  const logout = () => {
    localStorage.setItem("role", "guest");
    setRole("guest");
  };

  // Sync auth across tabs
  useEffect(() => {
    const handleStorage = () => {
      setRole(localStorage.getItem("role") || "guest");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ role, isAdmin, isAuthenticated, login, logout }}>
      {/* Only render children once loading is false */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
