import React, { useEffect, useState } from 'react';
import styles from './FeedAndBlogs.module.css';

export default function FeedAndBlogs({ feedClassName = '', blogsClassName = '' }) {
  // Static images for vintage electronics
  const vintageImages = [
    '/assets/vintage-camera.jpg',
    '/assets/vintage-phone.jpg',
    '/assets/vintage-radio.jpg',
    '/assets/vintage-tv.jpg',
    '/assets/vintage-console.jpg',
    '/assets/vintage-laptop.jpg',
    '/assets/vintage-walkman.jpg',
    '/assets/vintage-camcorder.jpg',
    '/assets/vintage-pager.jpg',
    '/assets/vintage-cassette.jpg',
    '/assets/vintage-pc.jpg',
    '/assets/vintage-mac.jpg',
  ];

  // Blogs section remains dynamic (optional: keep as before or static)
  const [blogs, setBlogs] = useState([]);
  useEffect(() => {
    async function fetchBlogs() {
      try {
        const blogRes = await fetch('http://localhost:7868/api/library/guides');
        const blogData = await blogRes.json();
        setBlogs(blogData); // fetch all blogs
      } catch {
        setBlogs([]);
      }
    }
    fetchBlogs();
  }, []);

  return (
    <>
      <div className={feedClassName || styles.feedSection}>
        <div className={styles.sectionTitle}>Feed</div>
        <div className={styles.feedScrollContainer}>
          <div className={styles.feedGrid}>
            {vintageImages.map((img, idx) => (
              <div className={styles.feedItem} key={img} title="Vintage Electronics">
                <img src={img} alt="Vintage Electronics" className={styles.feedImg} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={blogsClassName || styles.blogsSection}>
        <div className={styles.sectionTitle}>Blogs</div>
        <div className={styles.blogsScrollContainer}>
          {blogs.map(blog => (
            <div className={styles.blogCard} key={blog._id}>
              <img src={blog.coverImage || '/assets/default-blog.png'} alt={blog.title} className={styles.blogImg} />
              <div className={styles.blogContent}>
                <div className={styles.blogTitle}>{blog.title || 'RESTORING YOUR FIRST GAME BOY'}</div>
                <div className={styles.blogDesc}>{blog.description || 'A step-by-step guide to bringing your classic handheld back to life. Learn the basics of cleaning, replacing parts, and troubleshooting common issues.'}</div>
              </div>
              <span className={styles.readMoreIcon} title="Read more">&#8594;</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
