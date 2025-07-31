import React from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import RedLine from "../../components/RedLine";
import Feed from "../../components/Feed";
import Blogs from "../../components/Blogs";
import ThreeDotMenu from "../../components/ThreeDotMenu";


const Home = () => {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#FFFBEA' }}>
      <div style={{position: 'absolute', top: 10, left: 10, zIndex: 9999, background: '#fffbea', color: '#222', padding: '8px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>DEBUG: Home page rendered</div>
      <Navbar />
      <Sidebar />
      <RedLine />
      <div style={{ paddingTop: '8rem', paddingLeft: '6rem', paddingRight: '2rem', display: 'flex', flexDirection: 'column' }}>
        <section style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 300 }}>Welcome Back, <span style={{ fontWeight: 900 }}>NEZAREEEN</span></h1>
          <p style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>What are we looking for today</p>
        </section>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <Feed />
          <Blogs />
        </div>
      </div>
      <ThreeDotMenu />
    </div>
  );
};

export default Home;
