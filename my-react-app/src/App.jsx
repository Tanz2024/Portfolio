// App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Work from "./pages/Works";
import Blogs from "./pages/Blogs";
import Contact from "./pages/Contact";
import Achievements from "./pages/Achievements";
import AdminLogin from "./pages/AdminLogin";

const AppLayout = () => {
  const location = useLocation();

  // For admin login, we want the mobile version—hide the navbar (and optionally the footer).
  const isAdminLogin = location.pathname === "/admin/login";

  return (
    <>
      {!isAdminLogin && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/work" element={<Work />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin/login" element={<AdminLogin />} />
        </Routes>
      </main>
      {!isAdminLogin && <Footer />}
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
};

export default App;
