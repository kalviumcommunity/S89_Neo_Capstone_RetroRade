// client/src/pages/Login.js
import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import styles from '../styling/Login.module.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useContext(AuthContext); // Get login function from AuthContext
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });

      // Assuming backend returns token and user data on successful login
      login(response.data.token, response.data.user);
      setSuccess('Login successful! Redirecting to home...');
      navigate('/'); // Redirect to Home page or dashboard after login
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleOAuthLogin = (provider) => {
    // Redirect to backend OAuth initiation endpoint (use full backend URL)
    window.location.href = `http://localhost:7868/api/auth/${provider}`;
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.leftPanel}>
        <div className={styles.logo}>RETRORADE</div>
        <h2 className={styles.heading}>Log in to your account</h2>
        <div style={{ marginBottom: '1rem' }}>
          Don't have an account?{' '}
          <Link to="/signup" className={styles.linkText}>Sign up</Link>
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
            style={{ marginBottom: '1rem' }}
          />
          <button
            type="submit"
            className={styles.submitBtn}
            style={{ marginTop: '0.5rem' }}
          >
            Next
          </button>
        </form>
        {error && (
          <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>
        )}
        {success && (
          <div style={{ color: 'green', marginTop: '1rem' }}>{success}</div>
        )}
      </div>
      <div className={styles.rightPanel}>
        <div className={styles.rightPanelText}>
          Back to the Future<br />made real
        </div>
      </div>
    </div>
  );
}

export default Login;
