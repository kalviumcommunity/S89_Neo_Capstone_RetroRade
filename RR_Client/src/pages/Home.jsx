// client/src/pages/Home.js
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function Home() {
  const { user, isAuthenticated, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-inter">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to RetroRade!
        </h1>
        {isAuthenticated ? (
          <>
            <p className="text-xl text-gray-700 mb-6">
              Hello, <span className="font-semibold text-blue-600">{user.username}</span>! You are logged in.
            </p>
            <div className="flex flex-col space-y-4">
              <Link
                to="/profile" // This route will be created for EditProfile page later
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-md transition duration-200 text-lg"
              >
                Go to My Profile
              </Link>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-md transition duration-200 text-lg"
              >
                Log Out
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xl text-gray-700 mb-6">
              Your ultimate hub for all things retro tech.
            </p>
            <div className="flex flex-col space-y-4">
              <Link
                to="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md transition duration-200 text-lg"
              >
                Sign Up Now
              </Link>
              <Link
                to="/login"
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-md transition duration-200 text-lg"
              >
                Log In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Home;
