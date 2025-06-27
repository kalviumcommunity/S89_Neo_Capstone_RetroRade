
import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Create the AuthContext
export const AuthContext = createContext();

// AuthProvider component to wrap your application
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token')); // Load token from local storage
  const [user, setUser] = useState(null); // Store user object (username, email, id, etc.)
  const [isLoading, setIsLoading] = useState(true); // To indicate if auth state is being loaded

  // Function to save token and user info
  const login = useCallback((newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  }, []);

  // Function to clear token and user info
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    // You might want to also hit a backend logout endpoint if you had session-based logout
    // For JWT, mostly client-side token removal is sufficient.
    console.log('Logged out successfully.');
  }, []);

  // Effect to verify token and fetch user data on app load/token change
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        // Configure axios to send the token with every request
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          // Fetch user profile to verify token and get up-to-date user data
          const res = await axios.get('/api/users/profile');
          setUser(res.data);
        } catch (error) {
          console.error('Failed to load user or token invalid:', error.response?.data || error.message);
          logout(); // Invalidate token if it's no longer valid
        }
      } else {
        delete axios.defaults.headers.common['Authorization']; // Remove header if no token
        setUser(null);
      }
      setIsLoading(false); // Auth state loaded
    };

    loadUser();
  }, [token, logout]); // Rerun if token changes or logout function changes

  // Provide the context values to children components
  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
