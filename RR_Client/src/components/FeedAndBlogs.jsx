import React, { useEffect, useState } from 'react';
import styles from './FeedAndBlogs.module.css';

const categories = [
  { name: 'Cameras', img: 'assets/vintage-camera.jpg' },
  { name: 'Headphones', img: 'assets/vintage-headphones.jpg' },
  { name: 'Games', img: 'assets/vintage-games.jpg' },
  { name: 'Consoles', img: 'assets/vintage-console.jpg' },
  { name: 'Watches', img: 'assets/vintage-watch.jpg' },
  { name: 'Phones', img: 'assets/vintage-phone.jpg' },
  { name: 'Bizarre Tech', img: 'assets/vintage-bizarre.jpg' },
  { name: 'Laptops', img: 'assets/vintage-laptop.jpg' },
  { name: 'PC Components', img: 'assets/vintage-pc.jpg' },
  { name: 'Emulations', img: 'assets/vintage-emulation.jpg' },
];

export default function FeedAndBlogs({ feedClassName = '', blogsClassName = '' }) {
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
        <div className={styles.sectionTitle}>Categories</div>
        <div className={styles.feedScrollContainer}>
          <div className={styles.feedGrid}>
            {Array(10).fill(categories).flat().map((category, idx) => (
              <div className={styles.feedItem} key={category.name + idx}>
                <img src={category.img} alt={category.name} className={styles.feedImg} />
                <div className={styles.categoryTextOverlay}>{category.name}</div>
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
