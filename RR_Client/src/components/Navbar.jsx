import React from "react";
import profileImg from '../assets/profile.jpg';
import styles from './Navbar.module.css';

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.menu}>
        <button id="hamburger" className={styles.menu}>&#9776;</button>
        <div className={styles.navButtons}>
          <button className={styles.navButton}>Collection</button>
          <button className={styles.navButton}>Library</button>
          <button className={styles.navButton}>Community</button>
          <button className={styles.navButton}>Marketplace</button>
        </div>
      </div>
      <div className={styles.profile}>
        <img src={profileImg} alt="Profile" />
      </div>
    </nav>
  );
};

export default Navbar;
