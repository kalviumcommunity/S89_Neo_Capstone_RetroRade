import React from 'react';
import styles from './WelcomeSection.module.css';
import SearchBar from './SearchBar';

export default function WelcomeSection({ user }) {
  return (
    <section className={styles.welcomeSection}>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', width: '100%' }}>
        <div className={styles.welcomeCol}>
          <span className={user ? styles.welcomeMontserratUser : styles.welcomeMontserrat}>
            {user ? 'Welcome Back,' : 'Welcome,'}
            {user && (
              <span style={{ fontWeight: 900, marginLeft: 8 }}>
                {user.username ? user.username.toUpperCase() : ''}
              </span>
            )}
          </span>
          <div className={styles.subtext}>What are we looking for today</div>
        </div>
        <div className={styles.searchBarContainer} style={{ marginLeft: '5rem', alignSelf: 'flex-end' }}>
          <SearchBar placeholder="Search..." />
        </div>
      </div>
    </section>
  );
}
