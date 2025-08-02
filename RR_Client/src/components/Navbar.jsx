import { FaBars } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      {/* Hamburger menu */}
      <button className={styles.hamburger}>
        <FaBars />
      </button>
      {/* Center navigation links */}
      <div className={styles.centerNav}>
        <div className={styles.navLinks}>
          <Link to="/collection" className={styles.link}>Collection</Link>
          <Link to="/library" className={styles.link}>Library</Link>
          <Link to="/community" className={styles.link}>Community</Link>
          <Link to="/marketplace" className={styles.link}>Marketplace</Link>
        </div>
      </div>
      {/* Profile avatar */}
      <div className={styles.avatar}>
        <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    </nav>
  );
}
