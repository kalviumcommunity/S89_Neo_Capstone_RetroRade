import React from 'react';
import styles from './SearchBar.module.css';
import { FaSearch } from 'react-icons/fa';

export default function SearchBar({ placeholder = "Search...", onSearch }) {
  return (
    <form className={styles.searchBar} onSubmit={e => { e.preventDefault(); onSearch && onSearch(e); }}>
      <span className={styles.icon}><FaSearch /></span>
      <input
        className={styles.input}
        type="text"
        placeholder={placeholder}
        aria-label="Search"
      />
    </form>
  );
}
