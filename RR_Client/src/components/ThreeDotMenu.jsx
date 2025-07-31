import React from "react";
import styles from './ThreeDotMenu.module.css';

const ThreeDotMenu = () => (
  <div className={styles.threeDotMenu}>
    <div className={styles.dot}></div>
    <div className={styles.dot}></div>
    <div className={styles.dot}></div>
  </div>
);

export default ThreeDotMenu;
