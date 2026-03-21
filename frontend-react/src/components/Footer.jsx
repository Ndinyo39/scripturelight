import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = ({ stats }) => {
  return (
    <footer className="main-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src="/Logo.png" alt="Logo" />
              <h3>ScriptureLight</h3>
            </div>
            <p className="footer-tagline">
              A faith-based platform for Bible study, spiritual growth, and community.
            </p>
          </div>
          
          <div className="footer-links">
            <h4>Explore</h4>
            <nav>
              <Link to="/bible">Read Bible</Link>
              <Link to="/community">Library & Groups</Link>
              <Link to="/testimonies">Testimonies</Link>
            </nav>
          </div>
          
          <div className="footer-contact">
            <h4>Contact Us</h4>
            <div className="contact-info">
              <span className="phone">📞 0795459080 / 0752 787 123</span>
              <a href="mailto:douglasndinyo5@gmail.com" className="email">📧 douglasndinyo5@gmail.com</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="footer-stats">
            Join {(stats?.users || 0).toLocaleString()}+ believers growing in faith with ScriptureLight 🙏
          </p>
          <p className="footer-copyright">© 2026 ScriptureLight. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
