// Home page component
import React, { useState, useEffect } from 'react';
import './no-scroll.css';
import Navbar from '../../components/Navbar';
import SideMenu from '../../components/SideMenu';
import HeaderSection from '../../components/HeaderSection';
import WelcomeSection from '../../components/WelcomeSection';
import FeedAndBlogs from '../../components/FeedAndBlogs';
import styles from './Home.module.css';

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
    // Prevent scrolling on Home mount
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('resize', checkMobile);
      document.body.style.overflow = '';
    };
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
      <div className={styles.mainContentContainer}>
        <HeaderSection slideLine={menuOpen && !isMobile} />
        <div className={styles.centralContent}>
          <WelcomeSection user={user} />
          <div className={styles.feedBlogsLayout}>
            <FeedAndBlogs
              feedClassName={styles.feedColumn}
              blogsClassName={styles.blogsColumn}
            />
          </div>
        </div>
      </div>
    </>
  );
}
