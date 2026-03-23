import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Trophy, 
  Play, 
  Info,
  X,
  Lock,
  Loader2,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import './StudyPlans.css';

const Toast = ({ message, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="toast-notification"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
    >
      <Check size={18} color="var(--success)" /> {message}
    </motion.div>
  );
};

const StudyPlans = () => {
  const { user, updateUser } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [userStats, setUserStats] = useState({
    streak: 0,
    completedPlans: 0,
    totalChapters: 0,
    totalHours: 0
  });
  
  useEffect(() => {
    loadPlans();
    loadUserStats();
  }, [user]);

  const loadUserStats = async () => {
    if (!user) return;
    try {
      const statsData = await api.get('/bible/stats');
      setUserStats(statsData);
    } catch (err) {
      console.error('Failed to load user stats:', err);
    }
  };

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await api.get('/study');
      setPlans(data.length > 0 ? data : [
        {
          id: 1,
          title: "Foundations of Faith",
          category: "faith",
          description: "A 30-day journey through the core beliefs of Christianity, from creation to salvation.",
          durationDays: 30,
          difficulty: "Beginner",
          color: "#4a6fa5"
        },
        {
          id: 2,
          title: "The Psalms of David",
          category: "worship",
          description: "Explore the poetry, prayers, and praises of King David across 21 selected Psalms.",
          durationDays: 21,
          difficulty: "Intermediate",
          color: "#2a9d8f"
        },
        {
          id: 3,
          title: "The Gospel of John",
          category: "gospel",
          description: "A deep dive into the Gospel of John — the book of believing and eternal life.",
          durationDays: 28,
          difficulty: "Intermediate",
          color: "#e9c46a"
        }
      ]);
    } catch (err) {
      console.error('Failed to load study plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Plans' },
    { id: 'faith', label: 'Faith' },
    { id: 'worship', label: 'Worship' },
    { id: 'gospel', label: 'Gospel' },
    { id: 'prayer', label: 'Prayer' },
    { id: 'leadership', label: 'Leadership' }
  ];

  const filteredPlans = plans.filter(plan => {
    const matchesCategory = activeCategory === 'all' || plan.category === activeCategory;
    const matchesSearch = plan.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (plan.description && plan.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const showToast = (msg) => setToast(msg);

  const handleStartPlan = async (id) => {
    try {
      const updatedUser = await api.post('/study/join', { planId: id });
      updateUser(updatedUser);
      showToast('Plan joined successfully! Check your dashboard for progress.');
    } catch (err) {
      console.error('Failed to join plan:', err);
      showToast(err.message || 'Failed to join study plan. Please try again.');
    }
  };

  const stats = [
    { label: "Day Streak", value: userStats.streak, icon: <Flame size={20} color="#ff9800" /> },
    { label: "Plans Completed", value: userStats.completedPlans, icon: <Trophy size={20} color="#fbc02d" /> },
    { label: "Chapters Read", value: userStats.totalChapters, icon: <BookOpen size={20} color="#4a6fa5" /> },
    { label: "Hours of Study", value: userStats.totalHours, icon: <Clock size={20} color="#2a9d8f" /> }
  ];

  return (
    <div className="study-plans-page container">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Study Plans</h1>
        <p className="header-desc">Structured Bible reading plans for your spiritual journey.</p>
      </motion.div>

      {/* Stats Quick View */}
      <div className="stats-grid mb-5">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            className="stat-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="filters-bar">
        <div className="categories-section">
          <div className="filter-scroll">
            {categories.map(cat => (
              <button 
                key={cat.id}
                className={`filter-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search study plans..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="search-icon" size={20} />
        </div>
      </div>

      {/* Plans List */}
      <div className="plan-grid">
        {loading ? (
          <div className="text-center p-5 grid-full" style={{ gridColumn: '1 / -1' }}>
            <Loader2 className="animate-spin mx-auto" size={40} />
            <p className="mt-2">Loading study plans...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredPlans.map((plan) => {
              const isActive = user?.activePlanId === plan.id || user?.activePlan?.id === plan.id;
              const color = plan.color || '#4a6fa5';
              
              return (
                <motion.div 
                  key={plan.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`plan-card ${isActive ? 'active' : ''}`}
                  style={{ 
                    border: isActive ? `2px solid ${color}` : '1px solid var(--gray-lighter)',
                    boxShadow: isActive ? `0 12px 32px ${color}30` : ''
                  }}
                >
                  <div className="plan-header">
                    <div className="plan-title-wrapper">
                      <div className="plan-icon-box" style={{ background: `${color}15`, color: color }}>
                        <BookOpen size={24} />
                      </div>
                      <h3 className="plan-title">{plan.title}</h3>
                    </div>
                    {isActive && <span className="status-badge in-progress" style={{ margin: 0 }}>Active</span>}
                  </div>

                  <p className="plan-description">{plan.description}</p>

                  <div className="plan-meta">
                    <span>{plan.difficulty || 'Beginner'}</span>
                    <span>{plan.durationDays} Days</span>
                  </div>

                  <div className="plan-actions mt-auto" style={{ marginTop: 'auto' }}>
                    {isActive ? (
                      <Link 
                        to="/bible" 
                        className="btn-primary" 
                        style={{ background: color, width: '100%', textDecoration: 'none', textAlign: 'center' }}
                      >
                        Continue Reading
                      </Link>
                    ) : (
                      <button 
                        className="btn-primary" 
                        style={{ background: color, width: '100%' }}
                        onClick={() => handleStartPlan(plan.id)}
                      >
                        Start Plan
                      </button>
                    )}
                    <button className="btn-outline" onClick={() => setSelectedPlan(plan)}>
                      <Info size={18} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Empty State */}
      {!loading && filteredPlans.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-5 mt-5"
          style={{ background: 'var(--white)', borderRadius: '20px', border: '1px dashed var(--gray-lighter)' }}
        >
          <Search size={48} color="var(--gray-light)" />
          <h3 className="mt-3">No study plans found</h3>
          <p className="text-muted">Try adjusting your filters or search keywords.</p>
        </motion.div>
      )}

      {/* Modal Detail View */}
      <AnimatePresence>
        {selectedPlan && (
          <>
            <motion.div 
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPlan(null)}
            />
            <motion.div 
              className="modal-content"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <button className="close-modal" onClick={() => setSelectedPlan(null)}>
                <X size={20} />
              </button>
              
              <div className="modal-hero">
                <div className="plan-title-wrapper mb-3">
                  <div className="plan-icon-box" style={{ background: `${selectedPlan.color || '#4a6fa5'}15`, color: selectedPlan.color || '#4a6fa5' }}>
                    <BookOpen size={32} />
                  </div>
                  <h2 style={{ fontSize: '1.75rem', margin: 0 }}>{selectedPlan.title}</h2>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span className="badge">{selectedPlan.difficulty || 'Beginner'}</span>
                  <span className="badge">{selectedPlan.durationDays} Days</span>
                </div>
              </div>

              <div className="modal-details">
                <h3>About this Plan</h3>
                <p style={{ color: 'var(--gray)', lineHeight: '1.7' }}>{selectedPlan.description}</p>
                
                <div className="reading-highlight">
                  <h4 className="mb-2">Plan Overview</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ color: 'var(--dark)' }}>
                      Complete this plan to earn the <strong>"{selectedPlan.title} Enthusiast"</strong> badge!
                    </div>
                    {user?.activePlanId !== selectedPlan.id && user?.activePlan?.id !== selectedPlan.id ? (
                      <button className="btn-primary btn-sm" style={{ background: selectedPlan.color || '#4a6fa5' }} onClick={() => { handleStartPlan(selectedPlan.id); setSelectedPlan(null); }}>
                        <Play size={16} fill="white" /> Join Plan
                      </button>
                    ) : (
                      <Link to="/bible" className="btn-primary btn-sm" style={{ background: selectedPlan.color || '#4a6fa5', textDecoration: 'none' }}>
                        <BookOpen size={16} /> Continue Reading
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast('')} />}
      </AnimatePresence>
    </div>
  );
};

export default StudyPlans;
