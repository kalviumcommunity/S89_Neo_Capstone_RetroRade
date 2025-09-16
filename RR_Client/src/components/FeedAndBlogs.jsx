import React, { useEffect, useState, useRef } from 'react';
import styles from './FeedAndBlogs.module.css';
import cameraImg from '../assets/vintage-camera.png';
import headphonesImg from '../assets/vintage-headphones.png';
import gamesImg from '../assets/vintage-games.png';
import consoleImg from '../assets/vintage-console.png';
import watchImg from '../assets/vintage-watch.png';
import phoneImg from '../assets/vintage-phone.png';
import bizarreImg from '../assets/vintage-bizzare.png';
import laptopImg from '../assets/vintage-laptop.png';
import pcImg from '../assets/vintage-pc.png';
import emulationImg from '../assets/vintage-emulation.png';

const categories = [
  { name: 'Cameras', img: cameraImg },
  { name: 'Headphones', img: headphonesImg },
  { name: 'Games', img: gamesImg },
  { name: 'Consoles', img: consoleImg },
  { name: 'Watches', img: watchImg },
  { name: 'Phones', img: phoneImg },
  { name: 'Bizarre Tech', img: bizarreImg },
  { name: 'Laptops', img: laptopImg },
  { name: 'PC Components', img: pcImg },
  { name: 'Emulations', img: emulationImg },
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

  const feedGridRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Automated vertical scroll logic
    const feedGrid = feedGridRef.current;
    if (!feedGrid) return;
    function startScroll() {
      scrollIntervalRef.current = setInterval(() => {
        if (!isPaused) {
          feedGrid.scrollTop += 1;
          // Reset scroll to top for infinite effect
          if (feedGrid.scrollTop + feedGrid.clientHeight >= feedGrid.scrollHeight) {
            feedGrid.scrollTop = 0;
          }
        }
      }, 16); // ~60fps
    }
    startScroll();
    return () => clearInterval(scrollIntervalRef.current);
  }, [isPaused]);

  // Pause scroll on hover
  function handleFeedItemMouseEnter() {
    setIsPaused(true);
  }
  function handleFeedItemMouseLeave() {
    setIsPaused(false);
  }

  return (
    <>
      <div className={feedClassName || styles.feedSection}>
        <div className={styles.sectionTitle}>Categories</div>
        <div className={styles.feedScrollContainer}>
          <div className={styles.feedGrid} ref={feedGridRef}>
            {Array(10).fill(categories).flat().map((category, idx) => (
              <div
                className={styles.feedItem}
                key={category.name + idx}
                onMouseEnter={handleFeedItemMouseEnter}
                onMouseLeave={handleFeedItemMouseLeave}
              >
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
