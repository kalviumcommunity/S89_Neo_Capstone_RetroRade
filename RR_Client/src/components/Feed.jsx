import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from './Feed.module.css';

const Feed = () => {
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    axios.get("/api/feed")
      .then(res => setFeed(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className={styles.feed}>
      <h2 className={styles.feedTitle}>Feed</h2>
      <div className={styles.feedGrid}>
        {feed.length === 0 ? (
          <div>No feed available.</div>
        ) : (
          feed.map((item, idx) => (
            <div key={idx} className={styles.feedItem}>
              <img src={item.image} alt={item.title} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Feed;
