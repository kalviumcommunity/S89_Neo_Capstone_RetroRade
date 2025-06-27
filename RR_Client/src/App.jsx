// client/src/App.js
                import React, { useContext, useEffect } from 'react'; // Import useEffect
                import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
                import { AuthProvider, AuthContext } from './context/AuthContext'; // Import AuthProvider and AuthContext

                // Import your page components
                import Signup from './pages/Signup';
                import Login from './pages/Login';
                import Home from './pages/Home';
                // ... other page imports

                const PrivateRoute = ({ children }) => {
                  const { isAuthenticated, isLoading } = useContext(AuthContext);

                  if (isLoading) {
                    return <div className="min-h-screen flex items-center justify-center text-xl">Loading authentication...</div>;
                  }

                  return isAuthenticated ? children : <Navigate to="/login" />;
                };

                // Component to handle OAuth success redirect
                function OAuthSuccessRedirect() {
                  const { login } = useContext(AuthContext);
                  const navigate = useNavigate();
                  const location = useLocation(); // Hook to access URL parameters

                  useEffect(() => {
                    const params = new URLSearchParams(location.search);
                    const token = params.get('token');
                    const username = params.get('username'); // Or whatever user data you pass

                    if (token && username) {
                      // Call your login context function
                      login(token, { username }); // Pass user object to login
                      window.location.replace('/'); // Force hard redirect to home
                    } else {
                      console.warn("OAuthSuccessRedirect: Token or username missing from URL.");
                      navigate('/login'); // If no token, redirect to login
                    }
                  }, [location, login, navigate]); // Dependencies for useEffect

                  return (
                    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-inter">
                      <p className="text-xl">Authentication successful. Redirecting...</p>
                    </div>
                  );
                }


                function NotFound() {
                  return (
                    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-inter">
                      <h1 className="text-4xl font-bold text-gray-800">404 - Page Not Found</h1>
                    </div>
                  );
                }

                function AppRoutes() {
                  const { isLoading } = useContext(AuthContext);
                  if (isLoading) {
                    return (
                      <div className="min-h-screen flex items-center justify-center text-xl">
                        Loading authentication...
                      </div>
                    );
                  }
                  return (
                    <Routes>
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/" element={<Home />} />

                      <Route path="/auth/success" element={<OAuthSuccessRedirect />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  );
                }

                function App() {
                  return (
                    <AuthProvider>
                      <Router>
                        <AppRoutes />
                      </Router>
                    </AuthProvider>
                  );
                }

                export default App;
