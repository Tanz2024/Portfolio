import React, { useState, useEffect } from 'react';
import { FaGithub, FaLinkedin, FaEnvelope, FaArrowUp } from 'react-icons/fa';
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
            href="mailto:tanzimbinzahir2019@gmail.com"
            aria-label="Email Tanzim Bin Zahir"
          >
            <FaEnvelope />
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
