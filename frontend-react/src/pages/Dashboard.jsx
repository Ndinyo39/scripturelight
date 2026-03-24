import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Clock, 
  MessageSquare, 
  Star, 
  Play, 
  Bookmark, 
  Share2, 
  PlusCircle,
  Loader2,
  ChevronRight,
  Download,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import './Dashboard.css';

const Dashboard = () => {
  const { user: authUser } = useAuth();
  const [userData, setUserData] = useState(authUser || {});
  const [loading, setLoading] = useState(true);
    const [bibleStats, setBibleStats] = useState({ totalChapters: 0, totalMinutes: 0 });
    const [latestBooks, setLatestBooks] = useState([]);
    const [dailyVerse, setDailyVerse] = useState({ text: "For I know the plans I have for you...", ref: "Jeremiah 29:11" });
    const [highlights, setHighlights] = useState([]);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
    };
  
    useEffect(() => {
        const fetchDashboardData = async () => {
          try {
            const [userRes, statsRes, booksRes, highlightsRes] = await Promise.all([
              api.get('/auth/me'),
              api.get('/bible/stats'),
              api.get('/books'),
              api.get('/bible/highlights')
            ]);
            setUserData(userRes);
            setBibleStats(statsRes);
            setLatestBooks(booksRes.slice(0, 3));
            setHighlights(highlightsRes.slice(0, 5)); // Show last 5 highlights
            
            // Try to fetch a real daily verse
            fetch('https://bible-api.com/jeremiah+29:11')
              .then(res => res.json())
              .then(data => {
                if (data.text) setDailyVerse({ text: data.text.trim(), ref: data.reference });
              })
              .catch(() => {}); // Fallback to default
          } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
          } finally {
            setLoading(false);
          }
        };
        fetchDashboardData();
    }, []);

  const stats = [
    { label: "Chapters Read", value: bibleStats.totalChapters || 0, icon: <BookOpen />, color: "#4a6fa5" },
    { label: "Hours with God", value: (bibleStats.totalMinutes / 60).toFixed(1), icon: <Clock />, color: "#2a9d8f" },
    { label: "Community Reach", value: userData.totalViewsCount || 0, icon: <Star />, color: "#e9c46a" },
    { label: "Testimonies", value: userData.testimoniesCount || 0, icon: <Star />, color: "#dc3545" }
  ];

  const chartData = bibleStats.chartData || [
    { name: 'Mon', mins: 0 },
    { name: 'Tue', mins: 0 },
    { name: 'Wed', mins: 0 },
    { name: 'Thu', mins: 0 },
    { name: 'Fri', mins: 0 },
    { name: 'Sat', mins: 0 },
    { name: 'Sun', mins: 0 },
  ];

  const activePlans = userData.activePlan ? [userData.activePlan] : [];

  if (loading) {
    return (
      <div className="dashboard-loading flex items-center justify-center p-20" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem' }}>
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="dashboard-page section container">
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="welcome-banner"
      >
        <div className="welcome-text">
          <h1>Welcome back, {userData.name}!</h1>
          <p>Here's your spiritual journey progress for today.</p>
          {(userData.role === 'admin' || authUser?.role === 'admin') && (
            <Link to="/admin" className="admin-status-badge mt-2" style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '8px', 
              background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', 
              padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem',
              border: '1px solid rgba(212, 175, 55, 0.3)', textDecoration: 'none',
              marginTop: '10px'
            }}>
              <ShieldCheck size={16} /> 🛡️ Admin Control Board Access Verified
            </Link>
          )}
        </div>
        <div className="streak-badge">
          <div className="streak-label">Current Streak</div>
          <div className="streak-value">{userData.streak || 0}</div>
          <div className="streak-unit">days</div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        className="stats-grid"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {stats.map((stat, index) => (
          <motion.div 
            key={stat.label}
            variants={itemVariants}
            className="stat-card"
          >
            <div className="stat-icon" style={{ color: stat.color, background: `${stat.color}15` }}>{stat.icon}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div 
        className="dashboard-grid"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Left Column */}
        <div className="dash-col">
          {/* Today's Reading */}
          <div className="card reading-card">
            <div className="card-header">
              <h3>Today's Reading</h3>
              <span className="badge">Day 1</span>
            </div>
            <div className="reading-content">
              {userData.activePlan ? (
                <>
                  <div className="reading-info">
                    <h4>{userData.activePlan.title}</h4>
                    <p>{userData.activePlan.description || 'Continue your journey today.'}</p>
                  </div>
                  <Link to="/bible" className="btn-primary btn-sm">
                    <Play size={16} /> Start
                  </Link>
                </>
              ) : (
                <div className="no-plan text-center p-4">
                  <p>No active study plan found.</p>
                  <Link to="/study-plans" className="btn-outline btn-sm mt-2" style={{ display: 'inline-block' }}>Find a Plan</Link>
                </div>
              )}
            </div>
          </div>

          {/* Active Plans */}
          <div className="card">
            <div className="card-header">
              <h3>Active Plans</h3>
              <PlusCircle size={20} className="clickable" />
            </div>
            <div className="plan-list">
              {activePlans.length > 0 ? activePlans.map(plan => (
                <div key={plan.id} className="plan-item">
                  <div className="plan-dot" style={{ backgroundColor: '#4a6fa5' }}></div>
                  <div className="plan-info">
                    <strong>{plan.title}</strong>
                    <span>Day 1 of {plan.durationDays}</span>
                  </div>
                  <div className="plan-percent">0%</div>
                </div>
              )) : (
                <div className="text-center p-4 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '150px', background: '#f8f9fa', borderRadius: '16px' }}>
                  <Bookmark size={40} color="rgba(74, 111, 165, 0.2)" className="mb-3" />
                  <p className="text-muted mb-3" style={{ fontSize: '0.9rem', fontWeight: 500 }}>You haven't joined any plans yet.</p>
                  <Link to="/study-plans" className="btn-primary" style={{ padding: '8px 20px', borderRadius: '24px', fontSize: '0.9rem' }}>Discover Plans</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="dash-col">
          {/* Weekly Chart */}
          <div className="card chart-card">
            <h3>Weekly Reading</h3>
            <div style={{ width: '100%', height: 200, marginTop: '1.5rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMins" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e3c72" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#2a5298" stopOpacity={0.4}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a0aec0', fontWeight: 600 }} dy={10} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 600 }}
                    itemStyle={{ color: '#1e3c72' }}
                  />
                  <Bar dataKey="mins" fill="url(#colorMins)" radius={[8, 8, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Verse of the Day */}
          <div className="card v-card">
            <div className="card-header">
              <h3><Star size={20} fill="#e9c46a" color="#e9c46a" /> Verse of the Day</h3>
            </div>
            <p className="v-text">"{dailyVerse.text}"</p>
            <p className="v-ref">— {dailyVerse.ref}</p>
            <div className="v-actions">
              <Link to="/bible" className="btn-outline btn-sm"><BookOpen size={14} /> Read More</Link>
              <button className="btn-primary btn-sm"><Share2 size={16} /> Share</button>
            </div>
          </div>

          {/* My Highlights */}
          <div className="card highlights-card mt-4">
            <div className="card-header d-flex justify-content-between">
              <h3><Bookmark size={20} color="var(--primary)" /> My Highlights</h3>
              <Link to="/bible" className="text-primary" style={{ fontSize: '0.8rem' }}>View All</Link>
            </div>
            <div className="mini-highlight-list mt-3">
              {highlights.length > 0 ? highlights.map(h => (
                <div key={h.id} className="highlight-item mb-3 p-3" style={{ 
                  borderLeft: `4px solid ${h.color || 'var(--primary)'}`,
                  background: 'rgba(0,0,0,0.02)',
                  borderRadius: '0 8px 8px 0'
                }}>
                  <div className="highlight-ref mb-1" style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--gray)' }}>
                    {h.book} {h.chapter}:{h.verseNumber}
                  </div>
                  <div className="highlight-text" style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--dark)' }}>
                    "{h.content.length > 80 ? h.content.substring(0, 80) + '...' : h.content}"
                  </div>
                </div>
              )) : (
                <p className="text-muted text-center py-3" style={{ fontSize: '0.85rem' }}>
                  Your favorite verses will appear here when you highlight them in the Bible Reader. 🙏
                </p>
              )}
            </div>
          </div>

          {/* New Books Preview */}
          <div className="card library-preview-card mt-4">
            <div className="card-header d-flex justify-content-between">
              <h3>Library Discoveries</h3>
              <Link to="/community" onClick={() => localStorage.setItem('communityTab', 'books')} className="text-primary" style={{ fontSize: '0.8rem' }}>View All</Link>
            </div>
            <div className="mini-book-list mt-3">
              {latestBooks.length > 0 ? latestBooks.map(book => (
                <div key={book.id} className="mini-book-item d-flex align-items-center mb-3">
                  <div className="mini-book-cover" style={{ backgroundColor: book.coverColor, width: '40px', height: '54px', borderRadius: '4px', marginRight: '12px' }}></div>
                  <div className="mini-book-info flex-1">
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', lineHeight: '1.2' }}>{book.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{book.author}</div>
                  </div>
                  <Link to="/community" className="text-muted"><ChevronRight size={18} /></Link>
                </div>
              )) : (
                <p className="text-muted text-center py-2" style={{ fontSize: '0.85rem' }}>Explore our growing community library!</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
