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
  
    useEffect(() => {
        const fetchDashboardData = async () => {
          try {
            const [userRes, statsRes, booksRes] = await Promise.all([
              api.get('/auth/me'),
              api.get('/bible/stats'),
              api.get('/books')
            ]);
            setUserData(userRes);
            setBibleStats(statsRes);
            setLatestBooks(booksRes.slice(0, 3));
            
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
    { label: "Prayers Shared", value: userData.postsCount || 0, icon: <MessageSquare />, color: "#e9c46a" },
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
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="stat-card"
          >
            <div className="stat-icon" style={{ color: stat.color }}>{stat.icon}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="dashboard-grid">
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
                <p className="text-center p-3 text-muted">You haven't joined any plans yet.</p>
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
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="mins" fill="#4a6fa5" radius={[4, 4, 0, 0]} />
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
      </div>
    </div>
  );
};

export default Dashboard;
