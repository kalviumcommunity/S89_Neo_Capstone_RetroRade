import React, { useEffect, useState } from 'react';
import styles from './FeedAndBlogs.module.css';


export default function FeedAndBlogs() {
  const [feed, setFeed] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Fetch Feed (Forum Posts)
      const feedRes = await fetch('http://localhost:7868/api/forum/posts');
      const feedData = await feedRes.json();
      setFeed(feedData.slice(0, 6)); // Show only 6 for now
      // Fetch Blogs (Library Guides)
      const blogRes = await fetch('http://localhost:7868/api/library/guides');
      const blogData = await blogRes.json();
      setBlogs(blogData.slice(0, 2)); // Show only 2 for now
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <div className={styles.loading}>Loading...</div>;

  // The orange vertical line is at about 120px from the left (based on your screenshot)
  // We'll use a wrapper with margin-left to align the content inside the orange line
  return (
    <div className={styles.outerWrapper}>
      <div className={styles.container}>
        <div className={styles.feedSection}>
          <div className={styles.sectionTitle}>Feed</div>
          <div className={styles.feedGrid}>
            {feed.map(post => (
              <a
                className={styles.feedItem}
                key={post._id}
                href={`/collection/${post._id}`}
                title={post.title}
              >
                <img src={post.images?.[0] || '/assets/default-feed.png'} alt={post.title} className={styles.feedImg} />
              </a>
            ))}
          </div>
        </div>
        <div className={styles.blogsSection}>
          <div className={styles.sectionTitle}>Blogs</div>
          {blogs.map(blog => (
            <div className={styles.blogCard} key={blog._id}>
              <img src={blog.coverImage || '/assets/default-blog.png'} alt={blog.title} className={styles.blogImg} />
              <div className={styles.blogContent}>
                <div className={styles.blogTitle}>{blog.title}</div>
                <div className={styles.blogDesc}>{blog.description}</div>
              </div>
              <span className={styles.readMoreIcon}>&#8594;</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
