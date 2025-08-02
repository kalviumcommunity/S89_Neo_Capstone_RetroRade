import styles from './HeaderSection.module.css';

export default function HeaderSection() {
  return (
    <div className={styles.headerWrapper}>
      <div className={styles.verticalLine}></div>
      <div className={styles.headerContent}>
        <h1 className={styles.retrorade}>RETRORADE</h1>
        <div className={styles.redLine}></div>
      </div>
    </div>
  );
}
