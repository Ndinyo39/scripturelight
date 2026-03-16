import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  PlayCircle, 
  ArrowRight, 
  Book, 
  TrendingUp, 
  Users, 
  Heart,
  Star,
  ChevronRight,
  Quote
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import './Home.css';

const verseOfTheDay = {
  text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
  ref: "Jeremiah 29:11 (NIV)"
};



const features = [
  {
    icon: <Book size={36} />,
    title: "Guided Study Plans",
    description: "Follow structured daily and weekly Bible reading plans with clear milestones and reflection questions.",
    link: "/study-plans",
    color: "#4a6fa5"
  },
  {
    icon: <TrendingUp size={36} />,
    title: "Track Your Growth",
    description: "Monitor your reading streaks, progress, and spiritual milestones over time with beautiful analytics.",
    link: "/dashboard",
    color: "#2a9d8f"
  },
  {
    icon: <Users size={36} />,
    title: "Community & Groups",
    description: "Join fellowship groups, share prayer requests, and grow side-by-side in faith with believers worldwide.",
    link: "/community",
    color: "#e9c46a"
  },
  {
    icon: <Heart size={36} />,
    title: "Share Testimonies",
    description: "Encourage others by sharing how God is working in your life. Your story matters and can spark someone's faith.",
    link: "/testimonies",
    color: "#e76f51"
  }
];

const testimonialSnippets = [
  {
    text: "ScriptureLight transformed my daily devotion. The structured plans keep me focused!",
    author: "Grace M.", 
    role: "Member since 2025"
  },
  {
    text: "Sharing my testimony here helped me realize so many others were praying for me.",
    author: "David K.", 
    role: "Community Leader"
  },
  {
    text: "I've read more Bible this year than in the past decade combined. God is faithful!",
    author: "Mary J.", 
    role: "Faithful Reader"
  }
];

const Home = () => {
  const { isLoggedIn, user } = useAuth();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [realStats, setRealStats] = useState({
    users: 0,
    testimonies: 0,
    prayers: 0,
    groups: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get('/stats');
        setRealStats(data);
      } catch (err) {
        console.error('Failed to fetch home stats:', err);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { value: realStats.users.toLocaleString(), label: "Scripture Readers" },
    { value: realStats.groups > 0 ? `${realStats.groups}+` : "0", label: "Fellowship Groups" },
    { value: realStats.testimonies.toLocaleString(), label: "Testimonies Shared" },
    { value: realStats.prayers.toLocaleString(), label: "Prayer Requests" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonialSnippets.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="home-page">
      
      {/* ── HERO ── */}
      <section className="hero">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="hero-content text-center"
          >
            {isLoggedIn && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="welcome-chip"
              >
                👋 Welcome back, {user?.name}!
              </motion.div>
            )}
            <h1>Grow Deeper in <span className="gradient-text">God's Word</span></h1>
            <p className="hero-subtitle">Your daily companion for spiritual growth & community</p>
            <p className="hero-description">
              A faith-based platform for Bible study, spiritual growth tracking, and building 
              community through scripture-based encouragement.
            </p>
            <div className="hero-cta">
              <Link to="/bible" className="cta-button cta-primary">
                <PlayCircle size={22} /> Start Reading
              </Link>
              {isLoggedIn ? (
                <Link to="/dashboard" className="cta-button cta-secondary">
                  <TrendingUp size={22} /> My Dashboard
                </Link>
              ) : (
                <Link to="/register" className="cta-button cta-secondary">
                  <BookOpen size={22} /> Join Free
                </Link>
              )}
            </div>
            <p className="hero-footnote">No subscription required · Free forever · Join {realStats.users.toLocaleString()}+ believers</p>
          </motion.div>
        </div>

        {/* Floating Bible cards visual */}
        <div className="hero-cards-bg" aria-hidden="true">
          <div className="hero-float-card fc1">
            <Star size={16} fill="#e9c46a" color="#e9c46a" />
            <span>"The Lord is my shepherd" · Ps 23:1</span>
          </div>
          <div className="hero-float-card fc2">
            <Book size={16} color="#4a6fa5" />
            <span>Foundations of Faith · Day 12 ✓</span>
          </div>
          <div className="hero-float-card fc3">
            <Heart size={16} color="#e76f51" />
            <span>87 Amens on your testimony</span>
          </div>
        </div>
      </section>

      {/* ── VERSE OF THE DAY ── */}
      <section className="verse-section">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="verse-card"
          >
            <Quote size={32} className="verse-quote-icon" />
            <p className="verse-text">{verseOfTheDay.text}</p>
            <p className="verse-reference">— {verseOfTheDay.ref}</p>
            <Link to="/bible" className="verse-cta">
              Read Today's Chapter <ChevronRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="stats-section">
        <div className="container stats-grid-home">
          {stats.map((s, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="stat-home-card"
            >
              <div className="stat-home-value">{s.value}</div>
              <div className="stat-home-label">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="features-section">
        <div className="container">
          <motion.h2 
            className="text-center section-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Everything for Your Spiritual Journey
          </motion.h2>
          <p className="text-center section-desc">
            Tools and community designed to help you grow in faith — consistently and joyfully.
          </p>
          
          <div className="feature-grid">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="feature-card"
              >
                <div className="feature-icon" style={{ color: feature.color, background: `${feature.color}18` }}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <Link to={feature.link} className="feature-link">
                  Explore <ArrowRight size={16} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS CAROUSEL ── */}
      <section className="testimonials-section">
        <div className="container">
          <motion.h2 
            className="text-center section-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            What Believers Are Saying
          </motion.h2>

          <div className="testimonial-carousel">
            {testimonialSnippets.map((t, i) => (
              <motion.div 
                key={i}
                className={`testimonial-slide ${i === activeTestimonial ? 'active' : ''}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: i === activeTestimonial ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <Quote size={36} className="t-quote-icon" />
                <p className="t-text">"{t.text}"</p>
                <div className="t-author">
                  <div className="t-avatar">{t.author.charAt(0)}</div>
                  <div>
                    <strong>{t.author}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              </motion.div>
            ))}
            <div className="carousel-dots">
              {testimonialSnippets.map((_, i) => (
                <button 
                  key={i} 
                  className={`dot ${i === activeTestimonial ? 'active' : ''}`}
                  onClick={() => setActiveTestimonial(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="bottom-cta section">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2>Begin Your Journey Today</h2>
            <p>
              Join a growing community of believers dedicated to studying God's Word together 
              and encouraging one another in faith.
            </p>
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/study-plans" className="cta-button cta-primary">
                Explore Study Plans <ArrowRight size={20} />
              </Link>
              <Link to="/testimonies" className="cta-button cta-secondary">
                <Heart size={20} /> Read Testimonies
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
