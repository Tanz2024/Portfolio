import React, { useState, useEffect, useRef } from 'react';
import emailjs from 'emailjs-com';
import './Contact.css';

// Import Firestore-related functions and DB from your Firebase config
import { db } from '../firebaseConfig';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const Contact = () => {
  // Form state (includes a honeypot field for spam protection)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    botField: '',
  });
  const [status, setStatus] = useState(''); // 'sending' | 'success' | 'error' | 'invalid-email'
  const [charCount, setCharCount] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});
  const errorRef = useRef(null);

  // Helper function to validate email with a regex
  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // Field-level validation on blur
  const validateField = (name, value) => {
    let error;
    if (!value || value.trim() === '') {
      error = `${name.charAt(0).toUpperCase() + name.slice(1)} is required.`;
    } else if (name === 'email' && !isValidEmail(value)) {
      error = 'Please enter a valid email address.';
    }
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Handle changes in inputs and update the state; update character count for message field
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'message') setCharCount(value.length);
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for the field as the user types
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check honeypot field for bot submissions
    if (formData.botField.trim() !== '') {
      console.warn('Bot submission blocked.');
      return;
    }

    // Validate required fields and collect errors
    const errors = {};
    ['name', 'email', 'message'].forEach((field) => {
      if (!formData[field] || formData[field].trim() === '') {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`;
      } else if (field === 'email' && !isValidEmail(formData.email)) {
        errors.email = 'Please enter a valid email address.';
      }
    });

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setStatus('error');
      if (errorRef.current) {
        errorRef.current.focus();
      }
      return;
    }

    setStatus('sending');

    try {
      // Retrieve EmailJS keys from environment variables
      const serviceID = process.env.REACT_APP_EMAILJS_SERVICE;
      const templateID = process.env.REACT_APP_EMAILJS_TEMPLATE;
      const publicKey = process.env.REACT_APP_EMAILJS_USER;

      // Send the email via EmailJS
      await emailjs.send(
        serviceID,
        templateID,
        {
          name: formData.name,
          email: formData.email,
          message: formData.message,
        },
        publicKey
      );

      // Save submission data to Firestore in the "contacts" collection
      await addDoc(collection(db, 'contacts'), {
        name: formData.name,
        email: formData.email,
        message: formData.message,
        createdAt: serverTimestamp(),
      });

      console.log('SUCCESS! Email sent and data saved to Firestore.');
      setStatus('success');
      setFormData({ name: '', email: '', message: '', botField: '' });
      setCharCount(0);
      setFieldErrors({});
    } catch (error) {
      console.error('Submission failed:', error);
      setStatus('error');
    }
  };

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (['success', 'error', 'invalid-email'].includes(status)) {
      const timer = setTimeout(() => setStatus(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const isFormIncomplete =
    !formData.name ||
    !formData.email ||
    !formData.message ||
    status === 'sending';

  return (
    <div className="contact">
      <header className="contact-header">
        <h1>Contact Me</h1>
        <p>Feel free to reach out with questions, ideas, or collaborations.</p>
      </header>

      <main className="contact-main">
        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              autoComplete="name"
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={(e) => validateField('name', e.target.value)}
              required
              placeholder="Your full name"
              aria-label="Your full name"
            />
            {fieldErrors.name && (
              <span className="field-error" role="alert">
                {fieldErrors.name}
              </span>
            )}
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              autoComplete="email"
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={(e) => validateField('email', e.target.value)}
              required
              placeholder="you@example.com"
              aria-label="Your email address"
            />
            {fieldErrors.email && (
              <span className="field-error" role="alert">
                {fieldErrors.email}
              </span>
            )}
          </div>

          {/* Message Field */}
          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              autoComplete="off"
              name="message"
              id="message"
              value={formData.message}
              onChange={handleChange}
              onBlur={(e) => validateField('message', e.target.value)}
              rows="5"
              required
              placeholder="Write your message here..."
              maxLength={1000}
              aria-label="Your message"
            />
            <div className="char-count" aria-live="polite">
              {charCount}/1000
            </div>
            {fieldErrors.message && (
              <span className="field-error" role="alert">
                {fieldErrors.message}
              </span>
            )}
          </div>

          {/* Honeypot Field (hidden from users) */}
          <div style={{ display: 'none' }}>
            <label htmlFor="botField">Do not fill this field</label>
            <input
              type="text"
              name="botField"
              id="botField"
              value={formData.botField}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="submit-button" disabled={isFormIncomplete}>
            {status === 'sending' ? (
              <span className="spinner" aria-label="Loading"></span>
            ) : (
              'Send Message'
            )}
          </button>

          {/* Status and error messages */}
          <div
            className="form-messages"
            role="alert"
            tabIndex="-1"
            ref={errorRef}
            aria-live="assertive"
          >
            {status === 'success' && (
              <p className="form-success">✅ Message sent successfully!</p>
            )}
            {status === 'error' && (
              <p className="form-error">❌ Something went wrong. Please try again.</p>
            )}
            {status === 'invalid-email' && (
              <p className="form-error">❌ Please enter a valid email address.</p>
            )}
          </div>
        </form>
      </main>
    </div>
  );
};

export default Contact;
