// Home page component
import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import SideMenu from '../../components/SideMenu';
import HeaderSection from '../../components/HeaderSection';
import WelcomeSection from '../../components/WelcomeSection';
import FeedAndBlogs from '../../components/FeedAndBlogs';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  // TODO: Replace with real user logic
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch user profile if logged in (replace with real auth logic)
    async function fetchUser() {
      try {
        const res = await fetch('http://localhost:3000/api/users/profile', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} isMobile={isMobile} user={user} />
      <Navbar
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        isMobile={isMobile}
        user={user}
      />
      <HeaderSection slideLine={menuOpen && !isMobile} />
      <WelcomeSection user={user} />
      <FeedAndBlogs />
    </>
  );
}
