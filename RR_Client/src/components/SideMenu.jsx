


import React from 'react';
import styles from './SideMenu.module.css';
import { FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export default function SideMenu({ open, onClose, isMobile }) {
  if (!open) return null;
  const menuClass = isMobile ? styles.menuMobile : `${styles.menuDesktop} ${open ? styles.open : ''}`;

  return (
    <aside className={menuClass} onClick={e => e.stopPropagation()}>
      {isMobile ? (
        <>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close menu">
            <FaTimes />
          </button>
          <div className={styles.menuLinks}>
            <Link to="/collection" className={styles.menuLink} onClick={onClose}>Collection</Link>
            <Link to="/library" className={styles.menuLink} onClick={onClose}>Library</Link>
            <Link to="/community" className={styles.menuLink} onClick={onClose}>Community</Link>
            <Link to="/marketplace" className={styles.menuLink} onClick={onClose}>Marketplace</Link>
          </div>
          <div className={styles.profileMenu}>
            <div className={styles.profileAvatar}>
              <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span className={styles.profileName}>User Name</span>
          </div>
        </>
      ) : (
        <div className={styles.desktopContent}>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close menu">
            <FaTimes />
          </button>
          <h3>Latest Release Notes</h3>
          <ul className={styles.releaseNotes}>
            <li>v1.2.0 - New marketplace features</li>
            <li>v1.1.0 - Improved community section</li>
            <li>v1.0.0 - Initial release</li>
          </ul>
          <h3>Notifications</h3>
          <ul className={styles.notifications}>
            <li>No new notifications</li>
          </ul>
          <button className={styles.retroButton}>
            <span style={{fontSize: '1.5rem', display: 'flex', alignItems: 'center'}}>&#x21B8;</span> Logout
          </button>
        </div>
      )}
    </aside>
  );
}
