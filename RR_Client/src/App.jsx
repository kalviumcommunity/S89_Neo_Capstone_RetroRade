import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeaderSection from './components/HeaderSection';
import SideMenu from './components/SideMenu';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
    <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} isMobile={isMobile} />
      <Navbar
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        isMobile={isMobile}
      />
      <HeaderSection slideLine={menuOpen && !isMobile} />
      
    </>
  );
}

export default App;
