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

  // We want to hide the Navbar & Footer if the path is "/admin/login"
  const hideNavAndFooter = location.pathname === "/admin/login";

  return (
    <>
      {/* Only render Navbar if not on admin login page */}
      {!hideNavAndFooter && <Navbar />}

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

      {/* Only render Footer if not on admin login page */}
      {!hideNavAndFooter && <Footer />}
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
