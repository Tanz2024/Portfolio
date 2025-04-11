import React, { useState, useEffect } from 'react';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');
  const [charCount, setCharCount] = useState(0);

  // Helper function to validate email format
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleChange = e => {
    const { name, value } = e.target;
    if (name === 'message') setCharCount(value.length);
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // Client-side email validation
    if (!isValidEmail(formData.email)) {
      setStatus('invalid-email');
      return;
    }

    setStatus('sending');

    try {
      const res = await fetch('https://portfolio-1-716m.onrender.com/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();

      if (result.success) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '' });
        setCharCount(0);
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  // Auto-dismiss success, error, or invalid-email messages after 5 seconds
  useEffect(() => {
    if (status === 'success' || status === 'error' || status === 'invalid-email') {
      const timer = setTimeout(() => setStatus(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Disable submit if any field is empty or if we're sending
  const isFormIncomplete = !formData.name || !formData.email || !formData.message;

  return (
    <div className="contact">
      <header className="contact-header">
        <h1>Contact Me</h1>
        <p>Feel free to reach out with questions, ideas, or collaborations.</p>
      </header>

      <main className="contact-main">
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              name="message"
              id="message"
              value={formData.message}
              onChange={handleChange}
              rows="5"
              required
              placeholder="Write your message here..."
              maxLength={1000}
            />
            <div className="char-count">{charCount}/1000</div>
          </div>

          <button type="submit" className="submit-button" disabled={isFormIncomplete || status === 'sending'}>
            {status === 'sending' ? 'Sending...' : 'Send Message'}
          </button>

          {status === 'success' && (
            <p className="form-success" role="alert">✅ Message sent successfully!</p>
          )}
          {status === 'error' && (
            <p className="form-error" role="alert">❌ Something went wrong. Please try again.</p>
          )}
          {status === 'invalid-email' && (
            <p className="form-error" role="alert">❌ Please enter a valid email address.</p>
          )}
        </form>
      </main>
    </div>
  );
};

export default Contact;
