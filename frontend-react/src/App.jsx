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
import Footer from './components/Footer';

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
        <OnlineNotifier />
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
        
        <Footer stats={stats} />
      </div>
    </Router>
  );
}

export default App;
