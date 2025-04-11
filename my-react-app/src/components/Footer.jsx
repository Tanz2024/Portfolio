import React, { useState, useEffect } from 'react';
import { FaGithub, FaLinkedin, FaTwitter, FaArrowUp } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () =>
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

  return (
    <>
      <footer className="footer" role="contentinfo">
        <p>&copy; {new Date().getFullYear()} Tanzim Bin Zahir. All Rights Reserved.</p>

        <div className="social-links">
          <a
            href="https://github.com/Tanz2024"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Profile"
          >
            <FaGithub />
          </a>
          <a
            href="https://linkedin.com/in/tanz2023"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn Profile"
          >
            <FaLinkedin />
          </a>
          <a
            href="https://twitter.com/@Heytanz100"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter Profile"
          >
            <FaTwitter />
          </a>
        </div>
      </footer>

      {showScrollButton && (
        <button className="scroll-to-top" onClick={scrollToTop} aria-label="Scroll to top">
          <FaArrowUp />
        </button>
      )}
    </>
  );
};

export default Footer;
