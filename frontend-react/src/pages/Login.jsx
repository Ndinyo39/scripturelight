import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
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
      const data = await api.post('/auth/login', { email, password });
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
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="auth-card"
      >
        <div className="auth-header">
          <div className="auth-icon">
            <LogIn size={40} />
          </div>
          <h2>Welcome Back</h2>
          <p>Continue your spiritual journey</p>
        </div>

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

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label><Mail size={16} /> Email Address</label>
            <input 
              type="email" 
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label><Lock size={16} /> Password</label>
            <div className="password-wrapper">
              <input 
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Register here</Link></p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
