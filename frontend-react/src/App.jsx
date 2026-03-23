import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import PWAInstallBanner from './components/PWAInstallBanner';
import { api } from './api';

import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';
import OnlineNotifier from './components/OnlineNotifier';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const BibleReader = lazy(() => import('./pages/BibleReader'));
const StudyPlans = lazy(() => import('./pages/StudyPlans'));
const Community = lazy(() => import('./pages/Community'));
const Testimonies = lazy(() => import('./pages/Testimonies'));
const Support = lazy(() => import('./pages/Support'));
const Admin = lazy(() => import('./pages/Admin'));
const Profile = lazy(() => import('./pages/Profile'));
const UserProfile = lazy(() => import('./pages/UserProfile'));

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
        <Suspense fallback={
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="animate-spin" style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid var(--secondary)', borderTopColor: 'transparent' }} />
          </div>
        }>
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
        </Suspense>
        
        <Footer stats={stats} />
      </div>
    </Router>
  );
}

export default App;
