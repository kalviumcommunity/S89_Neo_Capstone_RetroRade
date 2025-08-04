import styles from './HeaderSection.module.css';

export default function HeaderSection({ slideLine }) {
  return (
    <div className={styles.headerWrapper}>
      <div className={slideLine ? `${styles.verticalLine} ${styles.slideMenu}` : styles.verticalLine}></div>
      <div className={styles.headerContent}>
        <h1 className={styles.retrorade}>RETRORADE</h1>
        <div className={styles.redLine}></div>
      </div>
    </div>
  );
}
