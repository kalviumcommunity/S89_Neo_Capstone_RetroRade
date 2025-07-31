import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from './Blogs.module.css';

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    axios.get("/api/blogs")
      .then(res => setBlogs(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className={styles.blogs}>
      <h2 className={styles.blogsTitle}>Blogs</h2>
      <div className={styles.blogsList}>
        {blogs.length === 0 ? (
          <div>No blogs available.</div>
        ) : (
          blogs.map((blog, idx) => (
            <div key={idx} className={styles.blogItem}>
              <div className={styles.blogDot}></div>
              <img src={blog.image} alt={blog.title} />
              <div className={styles.blogTitle}>{blog.title}</div>
              <div className={styles.blogDesc}>{blog.description}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Blogs;
