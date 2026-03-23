import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  BookOpen, 
  X,
  Plus,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Check,
  Inbox
} from 'lucide-react';
import { api } from '../api';
import { getImageUrl } from '../utils/imageUrl';
import './Testimonies.css';

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
      <Check size={18} /> {message}
    </motion.div>
  );
};

const TRUNCATE_LIMIT = 320;

const TestimonyCard = ({ t, onReact, onShare, onToggleComments, isExpanded, comments, commentInput, onCommentChange, onCommentSubmit, getRandomColor }) => {
  const [readMore, setReadMore] = useState(false);
  const isLong = t.content?.length > TRUNCATE_LIMIT;
  const displayContent = isLong && !readMore ? t.content.slice(0, TRUNCATE_LIMIT) + '…' : t.content;

  const handleShare = () => {
    if (onShare) onShare(t.title);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="testimony-card"
    >
      <div className="testimony-badge">{t.category}</div>

      <div className="post-header mb-4">
        <div className="author-info">
          <div className="author-avatar" style={{ background: getRandomColor(t.user?.name || 'User'), overflow: 'hidden' }}>
            {t.user?.profilePicture ? (
              <img src={getImageUrl(t.user.profilePicture)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (t.user?.name || 'U').charAt(0)
            )}
          </div>
          <div className="author-details">
            <span className="name">{t.user?.name || 'Anonymous Believer'}</span>
            <span className="meta">{new Date(t.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <h3 className="testimony-title">{t.title}</h3>
      <div className="testimony-content">
        {displayContent}
        {isLong && (
          <button className="read-more-btn" onClick={() => setReadMore(r => !r)}>
            {readMore ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Read more</>}
          </button>
        )}
      </div>

      {t.scripture && (
        <div className="post-scripture-tag">
          <BookOpen size={16} />
          {t.scripture}
        </div>
      )}

      <div className="amen-section" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
          <button className={`amen-btn-big ${t.isAmened ? 'active' : ''}`} onClick={() => onReact(t.id, 'amen')} title="Amen" style={{ padding: '6px 12px' }}>
            <Heart size={18} /> <span className="count">{t.amenCount || 0}</span>
          </button>
          <button className={`amen-btn-big ${t.isPraiseed ? 'active' : ''}`} onClick={() => onReact(t.id, 'praise')} title="Praise" style={{ padding: '6px 12px' }}>
            <Sparkles size={18} /> <span className="count">{t.praiseCount || 0}</span>
          </button>
          <button className={`amen-btn-big ${t.isPrayed ? 'active' : ''}`} onClick={() => onReact(t.id, 'pray')} title="Praying" style={{ padding: '6px 12px' }}>
            <span style={{ fontSize: '16px', lineHeight: 1 }}>🙏</span> <span className="count">{t.prayCount || 0}</span>
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="action-btn" onClick={() => onToggleComments(t.id)}>
            <MessageCircle size={18} />
            <span>({t.commentsCount || comments?.length || 0})</span>
          </button>
          <button className="action-btn" onClick={handleShare}>
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="comments-section"
          >
            <div className="comment-list">
              {comments?.length > 0 ? (
                comments.map(comment => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-header">
                      <div className="author-avatar small" style={{ background: getRandomColor(comment.user?.name || 'User'), overflow: 'hidden' }}>
                        {comment.user?.profilePicture ? (
                          <img src={getImageUrl(comment.user.profilePicture)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          (comment.user?.name || 'U').charAt(0)
                        )}
                      </div>
                      <span className="comment-author">{comment.user?.name || 'Anonymous'}</span>
                      <span className="comment-date">{new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="comment-text">{comment.content}</p>
                  </div>
                ))
              ) : (
                <p className="no-comments-msg">Be the first to respond to this testimony! 🙏</p>
              )}
            </div>
            <div className="comment-input-box">
              <input
                type="text"
                placeholder="Write an encouraging comment..."
                value={commentInput || ''}
                onChange={(e) => onCommentChange(t.id, e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && onCommentSubmit(t.id)}
              />
              <button className="btn-primary btn-sm" onClick={() => onCommentSubmit(t.id)}>
                Reply
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Testimonies = () => {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [testimonies, setTestimonies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionNotice, setSubmissionNotice] = useState('');
  const [toast, setToast] = useState('');
  const [formData, setFormData] = useState({ title: '', category: 'healing', content: '', scripture: '' });
  const [expandedComments, setExpandedComments] = useState({});
  const [testimonyComments, setTestimonyComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  const showToast = useCallback((msg) => setToast(msg), []);

  const toggleComments = async (id) => {
    const isExpanding = !expandedComments[id];
    setExpandedComments(prev => ({ ...prev, [id]: isExpanding }));
    if (isExpanding && !testimonyComments[id]) {
      try {
        const data = await api.get(`/comments/testimony/${id}`);
        setTestimonyComments(prev => ({ ...prev, [id]: data }));
      } catch (err) {
        console.error('Failed to load comments:', err);
      }
    }
  };

  const handleCommentSubmit = async (testimonyId) => {
    const content = commentInputs[testimonyId];
    if (!content?.trim()) return;
    try {
      const newComment = await api.post(`/comments/testimony/${testimonyId}`, { content });
      setTestimonyComments(prev => ({ ...prev, [testimonyId]: [...(prev[testimonyId] || []), newComment] }));
      setCommentInputs(prev => ({ ...prev, [testimonyId]: '' }));
    } catch (err) {
      showToast('Please log in to comment!');
    }
  };

  useEffect(() => { loadTestimonies(); }, []);

  const loadTestimonies = async () => {
    setLoading(true);
    try {
      const data = await api.get('/testimonies');
      setTestimonies(data);
    } catch (err) {
      console.error('Failed to load testimonies:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: '✨ All' },
    { id: 'healing', label: '💊 Healing' },
    { id: 'provision', label: '🌾 Provision' },
    { id: 'salvation', label: '✝️ Salvation' },
    { id: 'faith', label: '🙏 Faith' },
    { id: 'family', label: '👨‍👩‍👧 Family' }
  ];

  const handleReact = async (id, type) => {
    try {
      const updatedTestimony = await api.post(`/testimonies/${id}/react`, { type });
      setTestimonies(testimonies.map(t => {
        if (t.id === id) {
          const uiStateKey = `is${type.charAt(0).toUpperCase() + type.slice(1)}ed`;
          return {
            ...t,
            amenCount: updatedTestimony.amenCount,
            praiseCount: updatedTestimony.praiseCount,
            prayCount: updatedTestimony.prayCount,
            [uiStateKey]: !t[uiStateKey]
          };
        }
        return t;
      }));
    } catch (err) {
      showToast('Please log in to react! 🙏');
    }
  };

  const handleShare = (title) => {
    const url = `${window.location.origin}/testimonies`;
    const text = `"${title}" — ${url}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => showToast('Link copied to clipboard! 🔗'));
    } else {
      showToast('Link: ' + url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;
    setSubmitting(true);
    try {
      const result = await api.post('/testimonies', formData);
      setFormData({ title: '', category: 'healing', content: '', scripture: '' });
      setShowModal(false);
      setSubmissionNotice(result.message || 'Your testimony has been submitted and is awaiting admin approval!');
      setTimeout(() => setSubmissionNotice(''), 8000);
    } catch (err) {
      showToast('Please log in to share your testimony!');
    } finally {
      setSubmitting(false);
    }
  };

  const getRandomColor = (name) => {
    const colors = ['#4a6fa5', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'];
    return colors[name.length % colors.length];
  };

  const filtered = testimonies.filter(t => filter === 'all' || t.category === filter);

  return (
    <div className="testimonies-page container">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="testimony-hero"
      >
        <Sparkles size={48} className="mb-4" />
        <h2>God is doing amazing things!</h2>
        <p>Your story has the power to encourage someone else. Share what God has done in your life and give Him the glory.</p>
        <button className="share-btn-large" onClick={() => setShowModal(true)}>
          <Plus size={24} /> Share Your Testimony
        </button>
      </motion.div>

      {/* Submission notice banner */}
      <AnimatePresence>
        {submissionNotice && (
          <motion.div
            className="submission-notice"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <span>🙏</span>
            <div>
              <strong>Testimony Submitted!</strong>
              <p>{submissionNotice}</p>
            </div>
            <button className="notice-close" onClick={() => setSubmissionNotice('')}><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category filter */}
      <div className="testimonies-filter mb-5">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`filter-btn ${filter === cat.id ? 'active' : ''}`}
            onClick={() => setFilter(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Testimonies list */}
      <div className="testimonies-list">
        {loading ? (
          <div className="text-center p-5">
            <Loader2 className="animate-spin mx-auto" size={40} />
            <p className="mt-2">Loading testimonies of praise...</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            className="empty-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Inbox size={56} />
            <h3>No testimonies here yet</h3>
            <p>{filter !== 'all' ? `No ${filter} testimonies have been shared yet.` : 'Be the first to share how God has moved in your life!'}</p>
            <button className="share-btn-large" style={{ marginTop: '1rem' }} onClick={() => setShowModal(true)}>
              <Plus size={20} /> Share First Testimony
            </button>
          </motion.div>
        ) : (
          <AnimatePresence>
            {filtered.map(t => (
              <TestimonyCard
                key={t.id}
                t={t}
                onReact={handleReact}
                onShare={handleShare}
                onToggleComments={toggleComments}
                isExpanded={expandedComments[t.id]}
                comments={testimonyComments[t.id]}
                commentInput={commentInputs[t.id]}
                onCommentChange={(id, val) => setCommentInputs(prev => ({ ...prev, [id]: val }))}
                onCommentSubmit={handleCommentSubmit}
                getRandomColor={getRandomColor}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Share Testimony Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            />
            <motion.div
              className="modal-content"
              initial={{ opacity: 0, x: "-50%", y: "-40%", scale: 0.9 }}
              animate={{ opacity: 1, x: "-50%", y: "-50%", scale: 1 }}
              exit={{ opacity: 0, x: "-50%", y: "-40%", scale: 0.9 }}
            >
              <button className="close-modal" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>

              <div className="modal-hero py-4" style={{ borderRadius: '24px 24px 0 0', margin: 0 }}>
                <h2 className="text-white mb-0">Share Your Story</h2>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
                  Your testimony will be reviewed by an admin before publishing
                </p>
              </div>

              <form onSubmit={handleSubmit} className="testimony-modal-body">
                <label>Title</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="A short title for your testimony"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    maxLength={100}
                  />
                  <div style={{ textAlign: 'right', fontSize: '0.7rem', color: '#888', marginTop: '-12px', marginBottom: '10px' }}>
                    {formData.title.length}/100
                  </div>
                </div>

                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.slice(1).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>

                <label>Your Testimony</label>
                <div className="relative">
                  <textarea
                    rows="5"
                    placeholder="What did God do? Share in detail — your story matters!"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                    maxLength={1000}
                  />
                  <div style={{ textAlign: 'right', fontSize: '0.7rem', color: '#888', marginTop: '-12px', marginBottom: '10px' }}>
                    {formData.content.length}/1000
                  </div>
                </div>

                <label>Scripture Reference <span style={{ fontWeight: 400, color: '#888' }}>(Optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Philippians 4:13"
                  value={formData.scripture}
                  onChange={(e) => setFormData({ ...formData, scripture: e.target.value })}
                />

                <div className="modal-footer px-0 pt-4" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? <><Loader2 className="animate-spin" size={16} /> Submitting...</> : '🙏 Share Testimony'}
                  </button>
                </div>
              </form>
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

export default Testimonies;
