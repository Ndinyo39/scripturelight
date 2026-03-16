import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  BookOpen, 
  X,
  Plus,
  Sparkles,
  Loader2
} from 'lucide-react';
import { api } from '../api';
import { getImageUrl } from '../utils/imageUrl';
import './Testimonies.css';

const Testimonies = () => {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [testimonies, setTestimonies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    category: 'healing',
    content: '',
    scripture: ''
  });
  const [expandedComments, setExpandedComments] = useState({});
  const [testimonyComments, setTestimonyComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});


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
      setTestimonyComments(prev => ({
        ...prev,
        [testimonyId]: [...(prev[testimonyId] || []), newComment]
      }));
      setCommentInputs(prev => ({ ...prev, [testimonyId]: '' }));
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert('Please login to comment!');
    }
  };

  useEffect(() => {
    loadTestimonies();
  }, []);

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
    { id: 'all', label: 'All' },
    { id: 'healing', label: 'Healing' },
    { id: 'provision', label: 'Provision' },
    { id: 'salvation', label: 'Salvation' },
    { id: 'faith', label: 'Faith' },
    { id: 'family', label: 'Family' }
  ];

  const handleAmen = async (id) => {
    try {
      const updatedTestimony = await api.post(`/testimonies/${id}/amen`);
      setTestimonies(testimonies.map(t => 
        t.id === id ? { ...t, amenCount: updatedTestimony.amenCount, isAmened: !t.isAmened } : t
      ));
    } catch (err) {
      console.error('Failed to amen testimony:', err);
      alert('Please login to send an Amen!');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    try {
      const newTestimony = await api.post('/testimonies', formData);
      setTestimonies([newTestimony, ...testimonies]);
      setFormData({ title: '', category: 'healing', content: '', scripture: '' });
      setShowModal(false);
    } catch (err) {
      console.error('Failed to post testimony:', err);
      alert('Please login to share your testimony!');
    }
  };

  const getRandomColor = (name) => {
    const colors = ['#4a6fa5', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'];
    const index = name.length % colors.length;
    return colors[index];
  };

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

      <div className="testimonies-list">
        {loading ? (
          <div className="text-center p-5">
            <Loader2 className="animate-spin mx-auto" size={40} />
            <p className="mt-2">Loading testimonies of praise...</p>
          </div>
        ) : (
          <AnimatePresence>
            {testimonies
              .filter(t => filter === 'all' || t.category === filter)
              .map(t => (
              <motion.div 
                key={t.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="testimony-card"
              >
                <div className="testimony-badge">{t.category}</div>
                
                <div className="post-header mb-4">
                  <div className="author-info">
                    <div className="author-avatar" style={{ 
                      background: getRandomColor(t.user?.name || 'User'),
                      overflow: 'hidden'
                    }}>
                      {t.user?.profilePicture ? (
                        <img src={getImageUrl(t.user.profilePicture)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        (t.user?.name || 'U').charAt(0)
                      )}
                    </div>
                    <div className="author-details">
                      <span className="name">{t.user?.name || 'Anonymous Believer'}</span>
                      <span className="meta">{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <h3 className="testimony-title">{t.title}</h3>
                <div className="testimony-content">
                  {t.content}
                </div>

                {t.scripture && (
                  <div className="post-scripture-tag">
                    <BookOpen size={16} />
                    {t.scripture}
                  </div>
                )}

                <div className="amen-section">
                  <button 
                    className={`amen-btn-big ${t.isAmened ? 'active' : ''}`}
                    onClick={() => handleAmen(t.id)}
                  >
                    <Heart size={20} />
                    <span>Amen</span>
                    <span className="count">{t.amenCount || 0}</span>
                  </button>
                  <button className="action-btn" onClick={() => toggleComments(t.id)}>
                    <MessageCircle size={20} />
                    <span>Comments ({testimonyComments[t.id]?.length || 0})</span>
                  </button>
                  <button className="action-btn">
                    <Share2 size={20} />
                    <span>Share</span>
                  </button>
                </div>

                {/* Comments Section */}
                <AnimatePresence>
                  {expandedComments[t.id] && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="comments-section"
                    >
                      <div className="comment-list">
                        {testimonyComments[t.id]?.length > 0 ? (
                          testimonyComments[t.id].map(comment => (
                            <div key={comment.id} className="comment-item p-3 border-bottom">
                              <div className="d-flex align-items-center mb-2">
                                <div className="author-avatar small mr-2" style={{ 
                                  background: getRandomColor(comment.user?.name || 'User'), 
                                  width: '24px', 
                                  height: '24px', 
                                  fontSize: '10px',
                                  overflow: 'hidden'
                                }}>
                                  {comment.user?.profilePicture ? (
                                    <img src={getImageUrl(comment.user.profilePicture)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    (comment.user?.name || 'U').charAt(0)
                                  )}
                                </div>
                                <span className="font-weight-bold" style={{ fontSize: '0.85rem' }}>{comment.user?.name || 'Anonymous'}</span>
                                <span className="text-muted ml-2" style={{ fontSize: '0.75rem' }}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="mb-0" style={{ fontSize: '0.9rem' }}>{comment.content}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted p-3 text-center" style={{ fontSize: '0.9rem' }}>Be the first to comment!</p>
                        )}
                      </div>
                      <div className="comment-input-box">
                        <input 
                          type="text" 
                          placeholder="Write a comment..." 
                          value={commentInputs[t.id] || ''}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [t.id]: e.target.value }))}
                          onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit(t.id)}
                        />
                        <button 
                          className="btn-primary btn-sm"
                          onClick={() => handleCommentSubmit(t.id)}
                        >
                          Reply
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
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
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
            >
              <button className="close-modal" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
              
              <div className="modal-hero py-4" style={{ borderRadius: '24px 24px 0 0', margin: 0 }}>
                <h2 className="text-white mb-0">Share Your Story</h2>
              </div>

              <form onSubmit={handleSubmit} className="testimony-modal-body">
                <label>Title</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="A short title for your testimony"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  {categories.slice(1).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>

                <label>Your Testimony</label>
                <div className="relative">
                  <textarea 
                    rows="5"
                    placeholder="What did God do?"
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    required
                    maxLength={1000}
                  />
                  <div style={{ textAlign: 'right', fontSize: '0.7rem', color: '#888', marginTop: '-12px', marginBottom: '10px' }}>
                    {formData.content.length}/1000
                  </div>
                </div>

                <label>Scripture Reference (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Philippians 4:13"
                  value={formData.scripture}
                  onChange={(e) => setFormData({...formData, scripture: e.target.value})}
                />

                <div className="modal-footer px-0 pt-4" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Share Testimony</button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Testimonies;
