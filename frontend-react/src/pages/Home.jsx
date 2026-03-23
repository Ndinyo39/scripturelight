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
import { getImageUrl } from '../utils/imageUrl';
import './Home.css';

const inspirationalVerses = [
  { text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.", ref: "Jeremiah 29:11 (NIV)" },
  { text: "I can do all this through him who gives me strength.", ref: "Philippians 4:13 (NIV)" },
  { text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.", ref: "Proverbs 3:5-6 (NIV)" },
  { text: "But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.", ref: "Galatians 5:22-23 (NIV)" },
  { text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", ref: "Joshua 1:9 (NIV)" },
  { text: "The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters.", ref: "Psalm 23:1-2 (NIV)" },
  { text: "Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!", ref: "2 Corinthians 5:17 (NIV)" },
  { text: "Cast all your anxiety on him because he cares for you.", ref: "1 Peter 5:7 (NIV)" },
  { text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.", ref: "Romans 8:28 (NIV)" },
  { text: "Let all that you do be done in love.", ref: "1 Corinthians 16:14 (ESV)" },
  { text: "The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness.", ref: "Lamentations 3:22-23 (ESV)" },
  { text: "For God gave us a spirit not of fear but of power and love and self-control.", ref: "2 Timothy 1:7 (ESV)" }
];



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
  const [isPaused, setIsPaused] = useState(false);
  const [fetchedTestimonies, setFetchedTestimonies] = useState([]);
  const [currentVerse, setCurrentVerse] = useState(inspirationalVerses[0]);
  const [realStats, setRealStats] = useState({
    users: 0,
    testimonies: 0,
    prayers: 0,
    groups: 0
  });

  useEffect(() => {
    // Function to calculate which verse should be shown based on current hour
    const updateVerse = () => {
      // Use the current hour (since epoch) to determine the verse index.
      // This ensures all users see the same verse during the same hour, 
      // and it persists across page reloads within that hour.
      const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
      const verseIndex = currentHour % inspirationalVerses.length;
      setCurrentVerse(inspirationalVerses[verseIndex]);
    };

    // Set initial verse
    updateVerse();

    // Check every minute if the hour has changed to update the verse
    // (We use 1 minute instead of 1 hour interval so it updates exactly when the clock rolls over to the next hour)
    const interval = setInterval(updateVerse, 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get('/stats');
        setRealStats(data);
      } catch (err) {
        console.error('Failed to fetch home stats:', err);
      }
    };
    const fetchTestimonies = async () => {
      try {
        const data = await api.get('/testimonies');
        if (data && data.length > 0) {
          setFetchedTestimonies(data.slice(0, 6)); // Top 6 recent
        }
      } catch (err) {
        console.error('Failed to fetch testimonies for home:', err);
      }
    };
    fetchStats();
    fetchTestimonies();
  }, []);

  const displayTestimonials = fetchedTestimonies.length > 0 
    ? fetchedTestimonies.map(t => ({
        text: t.content.length > 150 ? t.content.substring(0, 150) + '...' : t.content,
        author: t.user?.name || 'Anonymous',
        role: t.category || 'Member',
        avatar: t.user?.profilePicture
      }))
    : testimonialSnippets;

  const stats = [
    { value: (realStats?.users || 0).toLocaleString(), label: "Registered Users" },
    { value: (realStats?.groups || 0) > 0 ? `${realStats.groups}+` : "0", label: "Fellowship Groups" },
    { value: (realStats?.testimonies || 0).toLocaleString(), label: "Testimonies Shared" },
    { value: (realStats?.prayers || 0).toLocaleString(), label: "Prayer Requests" }
  ];

  useEffect(() => {
    if (isPaused) return;
    const len = fetchedTestimonies.length > 0 ? fetchedTestimonies.length : testimonialSnippets.length;
    const timer = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % len);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused, fetchedTestimonies.length]);

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
            <p className="hero-footnote">No subscription required · Free forever · Join {(realStats?.users || 0).toLocaleString()}+ believers</p>
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
            <motion.div
              key={currentVerse.ref} // This forces a re-render animation when the verse changes
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="verse-text">{currentVerse.text}</p>
              <p className="verse-reference">— {currentVerse.ref}</p>
            </motion.div>
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

          <div 
            className="testimonial-carousel"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {displayTestimonials.map((t, i) => (
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
                  {t.avatar ? (
                    <img src={getImageUrl(t.avatar)} alt={t.author} className="t-avatar" style={{ objectFit: 'cover' }} />
                  ) : (
                    <div className="t-avatar">{t.author.charAt(0)}</div>
                  )}
                  <div>
                    <strong>{t.author}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              </motion.div>
            ))}
            <div className="carousel-dots">
              {displayTestimonials.map((_, i) => (
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
