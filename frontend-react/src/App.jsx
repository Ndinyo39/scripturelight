import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import BibleReader from './pages/BibleReader';
import StudyPlans from './pages/StudyPlans';
import Community from './pages/Community';
import Testimonies from './pages/Testimonies';
import Support from './pages/Support';
import Admin from './pages/Admin';
import PWAInstallBanner from './components/PWAInstallBanner';
import Profile from './pages/Profile';
import { api } from './api';
import UserProfile from './pages/UserProfile';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [stats, setStats] = useState({ users: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get('/stats');
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch footer stats:', err);
      }
    };
    fetchStats();
  }, []);
  return (
    <Router>
      <div className="app">
        <PWAInstallBanner />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route 
            path="/study-plans" 
            element={
              <ProtectedRoute>
                <StudyPlans />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bible" 
            element={
              <ProtectedRoute>
                <BibleReader />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/community" 
            element={
              <ProtectedRoute>
                <Community />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/testimonies" 
            element={
              <ProtectedRoute>
                <Testimonies />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/support" 
            element={
              <ProtectedRoute>
                <Support />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly={true}>
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/:id" 
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } 
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
        
        <footer style={{ 
          padding: '2.5rem 0 1.5rem', 
          background: '#0f1b2d', 
          marginTop: '0',
          color: 'rgba(255,255,255,0.6)'
        }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                    <img src="/Logo.png" alt="Logo" style={{ height: '40px', width: 'auto' }} />
                    <h3 style={{ color: 'white', margin: 0, fontSize: '1.1rem' }}>ScriptureLight</h3>
                </div>
                <p style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                  A faith-based platform for Bible study, spiritual growth, and community.
                </p>
              </div>
              <div>
                <h4 style={{ color: 'white', marginBottom: '0.75rem', fontSize: '0.9rem' }}>Explore</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                  <Link to="/bible" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Read Bible</Link>
                  <Link to="/community" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Library & Groups</Link>
                  <Link to="/testimonies" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Testimonies</Link>
                </div>
              </div>
              <div>
                <h4 style={{ color: 'white', marginBottom: '0.75rem', fontSize: '0.9rem' }}>Contact Us</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'white' }}>📞 0795459080 / 0752 787 123</span>
                  <a href="mailto:douglasndinyo5@gmail.com" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>📧 douglasndinyo5@gmail.com</a>
                </div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem' }}>
              <p style={{ marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>
                Join {(stats?.users || 0).toLocaleString()}+ believers growing in faith with ScriptureLight 🙏
              </p>
              <p>© 2026 ScriptureLight. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
