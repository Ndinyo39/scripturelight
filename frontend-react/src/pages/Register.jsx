import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import './Auth.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [stats, setStats] = useState({ users: 0 });
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get('/stats');
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await api.post('/auth/register', {
        name,
        email,
        password
      });

      if (data.status === 'pending') {
        setSuccess(data.message);
      } else {
        login(data.user, data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
            <UserPlus size={40} />
          </div>
          <h2>Join ScriptureLight</h2>
          <p>Start your faith journey with us alongside {(stats?.users || 0).toLocaleString()}+ other believers</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {success ? (
          <div className="text-center py-4">
             <div className="auth-success-alert mb-4" style={{ background: 'var(--primary-transparent)', padding: '2rem', borderRadius: 'var(--radius)', color: 'var(--primary)' }}>
                <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 0 }}>{success}</p>
             </div>
             <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
               Back to Login
             </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-group">
                <label><User size={16} /> Full Name</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

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
                    placeholder="Create a password (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
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

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Create Account'}
              </button>
            </form>

            <div className="auth-footer">
              <p>Already have an account? <Link to="/login">Login here</Link></p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Register;
