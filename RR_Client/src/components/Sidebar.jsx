import React, { useState } from "react";
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const [open, setOpen] = useState(false);

  // Listen for hamburger click (can be improved with context/global state)
  React.useEffect(() => {
    const btn = document.getElementById("hamburger");
    if (btn) {
      btn.onclick = () => setOpen((prev) => !prev);
    }
  }, []);

  return (
    <div
      className={open ? `${styles.sidebar} ${styles.sidebarOpen}` : `${styles.sidebar} ${styles.sidebarClosed}`}
      style={{ boxShadow: "2px 0 8px rgba(0,0,0,0.05)" }}
    ></div>
  );
};

export default Sidebar;
