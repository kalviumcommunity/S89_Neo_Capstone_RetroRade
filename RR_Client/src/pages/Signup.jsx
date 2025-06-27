// client/src/pages/Signup.js
import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // Import AuthContext
import styles from '../styling/Signup.module.css'; // Import styles for Signup page

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useContext(AuthContext); // Get login function from AuthContext
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    try {
      // Register user with email and password
      const response = await axios.post('/api/auth/register', {
        username,
        email,
        password,
      });

      setSuccess('Registration successful! Redirecting to login...');
      // Automatically log in the user after successful registration
      // Note: Backend /api/auth/register should return token and user data for this to work
      login(response.data.token, response.data.user);
      navigate('/'); // Redirect to Home page after successful registration and login
    } catch (err) {
      console.error('Signup error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  const handleOAuthLogin = (provider) => {
    // Redirect to backend OAuth initiation endpoint (use full backend URL)
    window.location.href = `http://localhost:7868/api/auth/${provider}`;
  };

  return (
    <div className={styles.signupContainer}>
      <div className={styles.leftPanel}>
        <div className={styles.leftPanelText}>
          JOIN THE COMMUNITY<br />NOW
        </div>
      </div>
      <div className={styles.rightPanel}>
        <div className={styles.logo}>RETRORADE</div>
        <h2 className={styles.heading}>Create your account</h2>
        <div style={{ marginBottom: '1rem' }}>
          Already have an account?{' '}
          <Link to="/login" className={styles.linkText}>Log in</Link>
        </div>
        <button
          onClick={() => handleOAuthLogin('google')}
          className={`${styles.oauthBtn} ${styles.googleBtn}`}
        >
          google
        </button>
        <button
          onClick={() => handleOAuthLogin('github')}
          className={`${styles.oauthBtn} ${styles.githubBtn}`}
        >
          <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}></span> GitHub
        </button>
        <form onSubmit={handleSubmit} className={styles.form} style={{ marginTop: '1.5rem' }}>
          <input
            type="text"
            id="username"
            className={styles.input}
            placeholder="First Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ marginBottom: '1rem' }}
          />
          <input
            type="email"
            id="email"
            className={styles.input}
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ marginBottom: '1rem' }}
          />
          <input
            type="password"
            id="password"
            className={styles.input}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ marginBottom: '1rem' }}
          />
          <input
            type="password"
            id="confirmPassword"
            className={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ marginBottom: '1rem' }}
          />
          <div className={styles.terms} style={{ marginBottom: '1rem' }}>
            <input type="checkbox" id="terms" required style={{ marginRight: '0.5rem' }} />
            I accept the <a href="#" className={styles.linkText}>Privacy Policy</a> and <a href="#" className={styles.linkText}>Terms of Service</a>
          </div>
          <button
            type="submit"
            className={styles.submitBtn}
            style={{ marginTop: '0.5rem' }}
          >
            Sign up
          </button>
        </form>
        {error && (
          <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>
        )}
        {success && (
          <div style={{ color: 'green', marginTop: '1rem' }}>{success}</div>
        )}
      </div>
    </div>
  );
}

export default Signup;
