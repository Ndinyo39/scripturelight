import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import './Auth.css';

/* ── Decorative SVG graphic (phone + hand + bell) ── */
const AuthGraphic = () => (
  <div className="auth-left-graphic">
    {/* Thumbs-up hand */}
    <svg className="auth-hand-svg" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="38" width="14" height="30" rx="4" fill="rgba(255,255,255,0.85)"/>
      <path d="M22 52 Q24 38 32 34 L38 32 Q44 30 44 38 L44 50 Q44 54 40 56 L28 58 Q22 60 22 56 Z" fill="rgba(255,255,255,0.85)"/>
      <path d="M32 34 L34 22 Q34 16 40 18 Q44 20 42 28 L38 32" fill="rgba(255,255,255,0.75)"/>
    </svg>

    {/* Phone */}
    <svg className="auth-phone-svg" viewBox="0 0 90 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="2" width="80" height="146" rx="14" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.7)" strokeWidth="3"/>
      <rect x="10" y="16" width="70" height="112" rx="6" fill="rgba(255,255,255,0.12)"/>
      <circle cx="45" cy="140" r="5" fill="rgba(255,255,255,0.5)"/>
      <rect x="30" y="6" width="30" height="4" rx="2" fill="rgba(255,255,255,0.4)"/>
      {/* app icons */}
      <circle cx="28" cy="50" r="6" fill="rgba(255,255,255,0.3)"/>
      <circle cx="45" cy="50" r="6" fill="rgba(255,255,255,0.3)"/>
      <circle cx="62" cy="50" r="6" fill="rgba(255,255,255,0.3)"/>
      <rect x="18" y="66" width="54" height="3" rx="1.5" fill="rgba(255,255,255,0.2)"/>
      <rect x="18" y="74" width="40" height="3" rx="1.5" fill="rgba(255,255,255,0.15)"/>
      <rect x="18" y="90" width="54" height="3" rx="1.5" fill="rgba(255,255,255,0.2)"/>
      <rect x="18" y="98" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.15)"/>
    </svg>

    {/* Bell */}
    <svg className="auth-bell-svg" viewBox="0 0 60 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 6 Q30 2 34 2 Q38 2 38 6 L40 10 Q52 18 52 34 L52 46 L8 46 L8 34 Q8 18 20 10 Z" fill="#4db6ac" stroke="rgba(255,255,255,0.6)" strokeWidth="2"/>
      <path d="M8 46 L52 46 L56 52 L4 52 Z" fill="#4db6ac"/>
      <ellipse cx="30" cy="54" rx="6" ry="4" fill="rgba(255,255,255,0.6)"/>
      <circle cx="49" cy="14" r="7" fill="#ef5350" stroke="white" strokeWidth="2"/>
      <text x="49" y="18" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">3</text>
    </svg>
  </div>
);

const Login = () => {
  const [activeTab, setActiveTab] = useState('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api.post('/auth/login', { identifier, password });
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      if (err.message.toLowerCase().includes('pending')) {
        setIsPending(true);
        setError('');
      } else if (err.message.toLowerCase().includes('suspended')) {
        setIsPending(false);
        setError('Your account has been suspended. Please contact support.');
      } else {
        setIsPending(false);
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="auth-split-card"
      >
        {/* ── Left Panel ── */}
        <div className="auth-left-panel">
          <p className="auth-left-tagline">Free Bible study,<br />prayers &amp; community!</p>
          <AuthGraphic />
        </div>

        {/* ── Right Panel ── */}
        <div className="auth-right-panel">
          <h2>Login</h2>

          {error && <div className="auth-error">{error}</div>}
          {isPending && (
            <div className="auth-pending-banner">
              <span>⏳</span>
              <div>
                <strong>Account Pending Approval</strong>
                <p>Your account is awaiting admin review. You'll be able to log in once approved. Questions? <a href="mailto:admin@scripturelight.com">Contact admin</a>.</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${activeTab === 'phone' ? 'active' : ''}`}
              onClick={() => setActiveTab('phone')}
            >
              Phone
            </button>
            <button
              type="button"
              className={`auth-tab ${activeTab === 'email' ? 'active' : ''}`}
              onClick={() => setActiveTab('email')}
            >
              Username or email
            </button>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
            <input
                type="text"
                className="form-control"
                placeholder={activeTab === 'phone' ? 'Phone number' : 'Email or username'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                id="login-identifier"
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  id="login-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <Link to="/forgot-password" className="forgot-link">I forgot my password?</Link>

            <button type="submit" className="btn-submit" disabled={loading} id="login-submit">
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Log In'}
            </button>
          </form>

          <p className="auth-first-time">First-time User?</p>
          <Link to="/register" className="btn-submit-outline" id="goto-signup">
            Sign Up
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
