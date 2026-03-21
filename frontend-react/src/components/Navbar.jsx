import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Book, Menu, X, LayoutDashboard, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUrl';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { isLoggedIn, user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  // Robust check for admin role (handles case and whitespace)
  const userRole = (user?.role || '').toString().toLowerCase().trim();
  const isAdmin = isLoggedIn && userRole === 'admin';

  // Build nav links fresh on every render so React always picks up role changes
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Study Plans', path: '/study-plans' },
    { name: 'Read Bible', path: '/bible' },
    { name: 'Community', path: '/community' },
    { name: 'Testimonies', path: '/testimonies' },
    ...(isLoggedIn ? [{ name: 'Support', path: '/support' }] : []),
    ...(isAdmin ? [{ name: '🛡️ Admin Panel', path: '/admin' }] : []),
  ];


  return (
    <nav className={`navbar ${scrolled ? 'scrolled shadow' : ''}`}>
      <div className="container navbar-container">
        <Link to="/" className="nav-brand">
          <img src="/Logo.png" alt="ScriptureLight Logo" style={{ height: '48px', width: 'auto' }} />
          <h1>ScriptureLight</h1>
        </Link>

        {/* Desktop Links */}
        <div className="nav-links-desktop">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.name}
            </Link>
          ))}
          
          <div className="auth-btns">
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Link to="/profile" className="nav-user-profile">
                  <div className="user-avatar-sm">
                    {user?.profilePicture ? (
                      <img src={getImageUrl(user.profilePicture)} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      (user?.name || 'U').charAt(0)
                    )}
                  </div>
                  <span className="user-name">{user?.name}</span>
                </Link>
                <button onClick={handleLogout} className="btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.4rem 0.8rem' }}>
                  <LogOut size={20} /> Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="nav-link" style={{ marginRight: '1rem' }}>Login</Link>
                <Link to="/register" className="btn-primary">Get Started</Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mobile-menu"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
              >
                {link.name}
              </Link>
            ))}
            <div className="flex flex-col gap-3 mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1rem' }}>
              {isLoggedIn ? (
                <>
                  <div className="mobile-user-info" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderTop: '1px solid #eee' }}>
                    <div className="user-avatar-sm" style={{ 
                      width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden'
                    }}>
                      {user?.profilePicture ? (
                        <img src={getImageUrl(user.profilePicture)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        (user?.name || 'U').charAt(0)
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'var(--dark)' }}>{user?.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>{user?.email}</div>
                    </div>
                  </div>
                  <Link to="/profile" onClick={() => setIsOpen(false)} className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Settings size={18} /> Profile Settings
                  </Link>
                  <Link to="/dashboard" onClick={() => setIsOpen(false)} className="btn-primary text-center">Dashboard</Link>
                  <button onClick={handleLogout} className="btn-outline">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsOpen(false)} className="btn-outline text-center">Login</Link>
                  <Link to="/register" onClick={() => setIsOpen(false)} className="btn-primary text-center">Get Started</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
