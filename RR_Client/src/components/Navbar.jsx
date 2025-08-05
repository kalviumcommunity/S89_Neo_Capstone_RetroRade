
import { FaBars } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';
import defaultAvatar from '../assets/default-avatar.png';

export default function Navbar({ setMenuOpen, user }) {
  return (
    <nav className={styles.navbar}>
      {/* Hamburger menu (always visible) */}
      <button className={styles.hamburger} onClick={() => setMenuOpen(true)} aria-label="Open menu">
        <FaBars />
      </button>
      {/* Center navigation links (hidden on mobile) */}
      <div className={styles.centerNav}>
        <div className={styles.navLinks}>
          <Link to="/collection" className={styles.link}>Collection</Link>
          <Link to="/library" className={styles.link}>Library</Link>
          <Link to="/community" className={styles.link}>Community</Link>
          <Link to="/marketplace" className={styles.link}>Marketplace</Link>
        </div>
      </div>
      {/* Profile avatar (hidden on mobile, shown in menu) */}
      <div className={styles.avatar}>
        <img
          src={user && user.avatar ? user.avatar : defaultAvatar}
          alt="Profile"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    </nav>
  );
}
