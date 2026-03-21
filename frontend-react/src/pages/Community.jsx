import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Heart, 
  MessageCircle, 
  Share2, 
  BookOpen, 
  Quote, 
  HelpCircle,
  MoreHorizontal,
  ArrowDown,
  Loader2,
  Users,
  Plus,
  X,
  Clock,
  ArrowLeft,
  ChevronRight,
  UserPlus,
  Search,
  Flame,
  CheckCircle,
  AlertCircle,
  SortAsc,
  Pin,
  TrendingUp,
  Star,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import BooksLibrary from '../components/BooksLibrary';
import { getImageUrl } from '../utils/imageUrl';
import './Community.css';

/* ─── TOAST SYSTEM ─────────────────────────────────── */
const Toast = ({ toasts, removeToast }) => (
  <div className="toast-container">
    <AnimatePresence>
      {toasts.map(t => (
        <motion.div
          key={t.id}
          className={`toast toast-${t.type}`}
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 80 }}
          onClick={() => removeToast(t.id)}
        >
          {t.type === 'success' && <CheckCircle size={18} />}
          {t.type === 'error' && <AlertCircle size={18} />}
          {t.type === 'info' && <Star size={18} />}
          <span>{t.message}</span>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  const removeToast = useCallback(id => setToasts(prev => prev.filter(t => t.id !== id)), []);
  return { toasts, addToast, removeToast };
}

/* ─── GROUP COLOUR SYSTEM ────────────────────────────── */
const TOPIC_THEMES = {
  prayer:      { gradient: 'linear-gradient(135deg, #4a6fa5 0%, #6c8fc7 100%)', icon: '🙏', label: 'Prayer' },
  worship:     { gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', icon: '🎶', label: 'Worship' },
  evangelism:  { gradient: 'linear-gradient(135deg, #059669 0%, #34d399 100%)', icon: '🌍', label: 'Evangelism' },
  prophecy:    { gradient: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)', icon: '✨', label: 'Prophecy' },
  fellowship:  { gradient: 'linear-gradient(135deg, #db2777 0%, #f472b6 100%)', icon: '❤️', label: 'Fellowship' },
  youth:       { gradient: 'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)', icon: '🔥', label: 'Youth' },
  devotional:  { gradient: 'linear-gradient(135deg, #0891b2 0%, #38bdf8 100%)', icon: '📖', label: 'Devotional' },
  default:     { gradient: 'linear-gradient(135deg, #4a6fa5 0%, #2a9d8f 100%)', icon: '📚', label: 'Bible Study' },
};

function getTopicTheme(topic = '') {
  if (!topic) return TOPIC_THEMES.default;
  const t = topic.toLowerCase();
  for (const key of Object.keys(TOPIC_THEMES)) {
    if (key !== 'default' && t.includes(key)) return TOPIC_THEMES[key];
  }
  return TOPIC_THEMES.default;
}

const REACTION_TYPES = [
  { key: 'pray',   emoji: '🙏', label: 'Pray',    api: true  },
  { key: 'amen',   emoji: '❤️', label: 'Amen',    api: false },
  { key: 'fire',   emoji: '🔥', label: 'Inspired', api: false },
  { key: 'peace',  emoji: '🕊️', label: 'Peace',   api: false },
];

/* ─── COMMUNITY COMPONENT ─────────────────────────────── */
const Community = () => {
  const { toasts, addToast, removeToast } = useToast();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostScripture, setNewPostScripture] = useState('');
  const [activeType, setActiveType] = useState('encouragement');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [expandedComments, setExpandedComments] = useState({});
  const [postComments, setPostComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [localReactions, setLocalReactions] = useState({}); // {postId: {amen:bool, fire:bool, peace:bool}}
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('communityTab');
    if (saved) { localStorage.removeItem('communityTab'); return saved; }
    return 'feed';
  });

  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupPosts, setGroupPosts] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupFilter, setGroupFilter] = useState('all');
  const [groupSearch, setGroupSearch] = useState('');
  const [newGroup, setNewGroup] = useState({ name: '', description: '', topic: '', meetingTime: '', pinnedVerse: '' });

  /* ── Data loading ── */
  useEffect(() => {
    if (activeTab === 'feed') loadPosts();
    else if (activeTab === 'groups' && !selectedGroup) loadGroups();
  }, [activeTab, selectedGroup]);

  useEffect(() => { 
    loadPosts(); 
    loadOnlineUsers(); 
    // refresh online users every 60 seconds
    const interval = setInterval(loadOnlineUsers, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadOnlineUsers = async () => {
    try {
      const data = await api.get('/users/online');
      setOnlineUsers(data);
    } catch (e) { console.error('Failed to load online users:', e); }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await api.get('/community');
      setPosts(data);
    } catch (err) {
      console.error('Failed to load posts:', err);
      addToast('Could not load the feed. Please refresh.', 'error');
    } finally { setLoading(false); }
  };

  const loadGroups = async () => {
    setGroupLoading(true);
    try {
      const [allGroups, userGroups] = await Promise.all([
        api.get('/groups'),
        api.get('/groups/my').catch(() => [])
      ]);
      setGroups(allGroups);
      setMyGroups(userGroups);
    } catch (err) {
      console.error('Failed to load groups:', err);
      addToast('Could not load groups.', 'error');
    } finally { setGroupLoading(false); }
  };

  /* ── Computed stats ── */
  const statsToday = posts.filter(p => {
    const d = new Date(p.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;
  const prayerGroupCount = groups.filter(g => getTopicTheme(g.topic).label === 'Prayer').length || myGroups.length;

  /* ── Sorted & filtered posts ── */
  const displayPosts = [...posts]
    .filter(p => filter === 'all' || p.type === filter)
    .sort((a, b) => {
      if (sortBy === 'prayed') return (b.prayCount || 0) - (a.prayCount || 0);
      if (sortBy === 'discussed') return (b.commentCount || 0) - (a.commentCount || 0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  /* ── Filtered groups ── */
  const displayGroups = groups
    .filter(g => groupFilter === 'all' || myGroups.some(mg => mg.id === g.id))
    .filter(g => {
      if (!groupSearch) return true;
      const q = groupSearch.toLowerCase();
      return (
        g.name?.toLowerCase().includes(q) ||
        g.topic?.toLowerCase().includes(q) ||
        g.description?.toLowerCase().includes(q)
      );
    });

  /* ── Post actions ── */
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    try {
      const newPost = await api.post('/community', { content: newPostContent, scripture: newPostScripture, type: activeType });
      setPosts([newPost, ...posts]);
      setNewPostContent('');
      setNewPostScripture('');
      addToast('Your post was shared with the community!', 'success');
    } catch (err) {
      addToast(err.message || 'Please login to share a post.', 'error');
    }
  };

  const togglePray = async (id) => {
    try {
      const updatedPost = await api.post(`/community/${id}/pray`);
      setPosts(posts.map(p => p.id === id ? { ...p, prayCount: updatedPost.prayCount, isPrayed: !p.isPrayed } : p));
    } catch (err) {
      addToast(err.message || 'Please login to react.', 'error');
    }
  };

  const toggleLocalReaction = (postId, reactionKey) => {
    setLocalReactions(prev => ({
      ...prev,
      [postId]: { ...(prev[postId] || {}), [reactionKey]: !(prev[postId]?.[reactionKey]) }
    }));
  };

  const handleShare = (postId) => {
    const url = `${window.location.origin}/community#post-${postId}`;
    navigator.clipboard.writeText(url).then(() => addToast('Link copied to clipboard!', 'success'));
  };

  const toggleComments = async (id) => {
    const isExpanding = !expandedComments[id];
    setExpandedComments(prev => ({ ...prev, [id]: isExpanding }));
    if (isExpanding && !postComments[id]) {
      try {
        const data = await api.get(`/comments/post/${id}`);
        setPostComments(prev => ({ ...prev, [id]: data }));
      } catch (err) { console.error('Failed to load comments:', err); }
    }
  };

  const handleCommentSubmit = async (postId) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;
    try {
      const newComment = await api.post(`/comments/post/${postId}`, { content });
      setPostComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), newComment] }));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      setPosts(posts.map(p => p.id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p));
    } catch (err) {
      addToast(err.message || 'Please login to comment.', 'error');
    }
  };

  /* ── Group actions ── */
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroup.name.trim()) return;
    try {
      const createdGroup = await api.post('/groups', newGroup);
      setGroups([createdGroup, ...groups]);
      setMyGroups([...myGroups, createdGroup]);
      setShowCreateModal(false);
      setNewGroup({ name: '', description: '', topic: '', meetingTime: '', pinnedVerse: '' });
      addToast(`"${createdGroup.name}" group created! 🎉`, 'success');
      loadGroupDetails(createdGroup.id);
    } catch (err) {
      addToast(err.message || 'Failed to create group.', 'error');
    }
  };

  const loadGroupDetails = async (groupId) => {
    setGroupLoading(true);
    try {
      const [details, posts] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/groups/${groupId}/posts`)
      ]);
      setSelectedGroup(details);
      setGroupPosts(posts);
      setGroupMembers(details.members || []);
    } catch (err) {
      console.error('Failed to load group details:', err);
      addToast('Could not load group details.', 'error');
    } finally { setGroupLoading(false); }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await api.post(`/groups/${groupId}/join`);
      const joinedGroup = groups.find(g => g.id === groupId);
      if (joinedGroup) {
        setMyGroups([...myGroups, joinedGroup]);
        setGroups(groups.map(g => g.id === groupId ? { ...g, memberCount: g.memberCount + 1 } : g));
        loadGroupDetails(groupId);
      }
      addToast('You joined the group! Welcome 🙌', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to join group.', 'error');
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      await api.post(`/groups/${groupId}/leave`);
      setMyGroups(myGroups.filter(g => g.id !== groupId));
      setGroups(groups.map(g => g.id === groupId ? { ...g, memberCount: Math.max(0, g.memberCount - 1) } : g));
      setSelectedGroup(null);
      addToast('You have left the group.', 'info');
    } catch (err) {
      addToast('Failed to leave group.', 'error');
    }
  };

  const handleCreateGroupPost = async () => {
    if (!newPostContent.trim() || !selectedGroup) return;
    try {
      const newPost = await api.post(`/groups/${selectedGroup.id}/posts`, { content: newPostContent, scripture: newPostScripture });
      setGroupPosts([newPost, ...groupPosts]);
      setNewPostContent('');
      setNewPostScripture('');
      addToast('Message sent to the group!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to send group post.', 'error');
    }
  };

  /* ── Helpers ── */
  const getRandomColor = (name) => {
    const colors = ['#4a6fa5', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#7c3aed', '#059669'];
    const index = (name || 'U').length % colors.length;
    return colors[index];
  };

  const isGroupNew = (group) => {
    const created = new Date(group.createdAt);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return created > sevenDaysAgo;
  };

  /* ── Reaction helper ── */
  const getLocalCount = (post, key) => {
    const r = localReactions[post.id];
    if (!r) return 0;
    return r[key] ? 1 : 0;
  };

  /* ────────────────────────────────────────────────────── */
  return (
    <div className="community-page container">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="community-header">
          <div>
            <h1 className="gold-heading">Community</h1>
            <p className="text-muted">A place to encourage, pray, and grow together.</p>
          </div>
          <div className="community-header-icon">✝️</div>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <motion.div 
        className="community-stats-bar"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="stat-pill">
          <span className="stat-dot green" />
          <strong>{onlineUsers.length || 0}</strong> believers connected
        </div>
        <div className="stat-pill">
          <span className="stat-dot blue" />
          <strong>{statsToday}</strong> posts shared today
        </div>
        <div className="stat-pill">
          <span className="stat-dot gold" />
          <strong>{groups.length}</strong> study groups active
        </div>
        <div className="stat-pill">
          <span className="stat-dot purple" />
          <strong>{posts.filter(p => p.type === 'prayer').length}</strong> prayer requests
        </div>
      </motion.div>

      {/* Online Users Row */}
      {onlineUsers.length > 0 && (
        <motion.div 
          className="online-users-container"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="online-users-header">
            <span className="live-dot" /> 
            <span className="online-text">Online Believers ({onlineUsers.length})</span>
          </div>
          <div className="online-users-scroll">
            {onlineUsers.map(u => (
               <Link to={`/profile/${u.id}`} key={u.id} className="online-user-avatar-wrap" title={u.name}>
                 <div className="online-user-avatar" style={{ background: getRandomColor(u.name) }}>
                   {u.profilePicture 
                     ? <img src={getImageUrl(u.profilePicture)} alt={u.name} /> 
                     : u.name.charAt(0)}
                   <span className="online-user-indicator" />
                 </div>
                 <span className="online-user-name">{u.name.split(' ')[0]}</span>
               </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Primary Tabs */}
      <div className="community-tabs">
        <button className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}>
          <MessageCircle size={16} /> Shared Feed
        </button>
        <button className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`} onClick={() => setActiveTab('groups')}>
          <Users size={16} /> Study Groups
          {myGroups.length > 0 && <span className="tab-badge">{myGroups.length}</span>}
        </button>
        <button className={`tab-btn ${activeTab === 'books' ? 'active' : ''}`} onClick={() => setActiveTab('books')}>
          <BookOpen size={16} /> Christian Books
        </button>
      </div>

      {/* ═══════════ FEED TAB ═══════════ */}
      {activeTab === 'feed' && (
        <>
          {/* Post Creation Form */}
          <motion.div className="post-form-card" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
            <h3>Share what's on your heart...</h3>
            <div className="relative">
              <textarea
                className="post-input"
                placeholder="I'm thinking about..."
                value={newPostContent}
                onChange={e => setNewPostContent(e.target.value)}
                maxLength={500}
              />
              <div className="char-count">{newPostContent.length}/500</div>
            </div>

            <div className="scripture-input-wrapper">
              <BookOpen className="scripture-icon" size={18} />
              <input
                type="text"
                className="scripture-input"
                placeholder="Related Scripture (optional)"
                value={newPostScripture}
                onChange={e => setNewPostScripture(e.target.value)}
              />
            </div>

            <div className="post-form-footer">
              <div className="post-type-selector">
                <button className={`post-type-btn ${activeType === 'encouragement' ? 'active' : ''}`} onClick={() => setActiveType('encouragement')}>
                  <Quote size={15} /> Encouragement
                </button>
                <button className={`post-type-btn ${activeType === 'prayer' ? 'active' : ''}`} onClick={() => setActiveType('prayer')}>
                  <Heart size={15} /> Prayer Request
                </button>
                <button className={`post-type-btn ${activeType === 'question' ? 'active' : ''}`} onClick={() => setActiveType('question')}>
                  <HelpCircle size={15} /> Question
                </button>
              </div>
              <button className="btn-primary" onClick={handleCreatePost} disabled={!newPostContent.trim()}>
                <Send size={17} /> Post
              </button>
            </div>
          </motion.div>

          {/* Feed Controls */}
          <div className="feed-controls">
            <div className="testimonies-filter">
              {['all', 'prayer', 'encouragement', 'question'].map(f => (
                <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                  {f === 'all' ? 'All Posts' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
                </button>
              ))}
            </div>
            <div className="sort-pills">
              <span className="sort-label"><SortAsc size={14} /> Sort:</span>
              {[
                { key: 'latest', label: 'Latest', icon: <Sparkles size={13} /> },
                { key: 'prayed', label: 'Most Prayed', icon: '🙏' },
                { key: 'discussed', label: 'Most Discussed', icon: <MessageCircle size={13} /> },
              ].map(s => (
                <button key={s.key} className={`sort-pill ${sortBy === s.key ? 'active' : ''}`} onClick={() => setSortBy(s.key)}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Posts Feed */}
          <div className="posts-feed">
            {loading ? (
              <div className="text-center p-5">
                <Loader2 className="animate-spin mx-auto" size={40} />
                <p className="mt-2">Loading fellow believers' posts...</p>
              </div>
            ) : displayPosts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🕊️</div>
                <h3>No posts here yet</h3>
                <p>Be the first to share something encouraging!</p>
              </div>
            ) : (
              <AnimatePresence>
                {displayPosts.map(post => (
                  <motion.div
                    key={post.id}
                    id={`post-${post.id}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="post-card"
                  >
                    {/* Post type accent bar */}
                    <div className={`post-type-bar type-${post.type || 'encouragement'}`} />

                    <div className="post-header">
                      <Link to={`/profile/${post.user?.id}`} className="author-info" style={{ textDecoration: 'none' }}>
                        <div className="author-avatar" style={{ background: getRandomColor(post.user?.name || 'User'), overflow: 'hidden' }}>
                          {post.user?.profilePicture
                            ? <img src={getImageUrl(post.user.profilePicture)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : (post.user?.name || 'U').charAt(0)}
                        </div>
                        <div className="author-details">
                          <span className="name" style={{ color: 'var(--dark)' }}>{post.user?.name || 'Anonymous Believer'}</span>
                          <span className="meta">
                            {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {' '}&bull;{' '}
                            <span className={`type-badge type-badge-${post.type || 'encouragement'}`}>
                              {post.type === 'prayer' ? '🙏 Prayer' : post.type === 'question' ? '❓ Question' : '💛 Encouragement'}
                            </span>
                          </span>
                        </div>
                      </Link>
                      <button className="action-btn more-btn" title="More options">
                        <MoreHorizontal size={20} />
                      </button>
                    </div>

                    <div className="post-content">{post.content}</div>

                    {post.scripture && (
                      <div className="post-scripture-tag">
                        <BookOpen size={15} /> {post.scripture}
                      </div>
                    )}

                    {/* Reaction Bar */}
                    <div className="reaction-bar">
                      {REACTION_TYPES.map(rt => {
                        const isActive = rt.key === 'pray' ? post.isPrayed : localReactions[post.id]?.[rt.key];
                        const count = rt.key === 'pray'
                          ? (post.prayCount || 0)
                          : getLocalCount(post, rt.key);
                        return (
                          <button
                            key={rt.key}
                            className={`reaction-btn ${isActive ? 'active' : ''}`}
                            onClick={() => rt.api ? togglePray(post.id) : toggleLocalReaction(post.id, rt.key)}
                            title={rt.label}
                          >
                            <span className="reaction-emoji">{rt.emoji}</span>
                            <span className="reaction-label">{rt.label}</span>
                            {count > 0 && <span className="reaction-count">{count}</span>}
                          </button>
                        );
                      })}

                      <div className="reaction-bar-right">
                        <button className="action-btn" onClick={() => toggleComments(post.id)}>
                          <MessageCircle size={18} />
                          <span>{post.commentCount || 0}</span>
                        </button>
                        <button className="action-btn" onClick={() => handleShare(post.id)} title="Copy link">
                          <Share2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Comments */}
                    <AnimatePresence>
                      {expandedComments[post.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="comments-section"
                        >
                          <div className="comment-list">
                            {postComments[post.id]?.length > 0 ? (
                              postComments[post.id].map(comment => (
                                <div key={comment.id} className="comment-item">
                                  <Link to={`/profile/${comment.user?.id}`} style={{ textDecoration: 'none' }}>
                                    <div className="comment-avatar" style={{
                                      background: getRandomColor(comment.user?.name || 'User'),
                                      overflow: 'hidden'
                                    }}>
                                      {comment.user?.profilePicture
                                        ? <img src={getImageUrl(comment.user.profilePicture)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : (comment.user?.name || 'U').charAt(0)}
                                    </div>
                                  </Link>
                                  <div className="comment-bubble">
                                    <div className="comment-meta">
                                      <span className="comment-user">{comment.user?.name || 'Anonymous'}</span>
                                      <span className="comment-time">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="comment-text">{comment.content}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-muted text-center" style={{ padding: '1rem' }}>Be the first to comment!</p>
                            )}
                          </div>
                          <div className="comment-input-box">
                            <input
                              type="text"
                              placeholder="Write a comment..."
                              value={commentInputs[post.id] || ''}
                              onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyPress={e => e.key === 'Enter' && handleCommentSubmit(post.id)}
                            />
                            <button className="btn-primary btn-sm" onClick={() => handleCommentSubmit(post.id)}>
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

          <div className="refresh-section">
            <button className="btn-outline" onClick={loadPosts} disabled={loading}>
              <ArrowDown size={18} /> Refresh Feed
            </button>
            <p className="text-muted text-sm">You've reached the end of the feed</p>
          </div>
        </>
      )}

      {/* ═══════════ GROUPS TAB ═══════════ */}
      {activeTab === 'groups' && (
        !selectedGroup ? (
          <div className="groups-view">
            {/* Groups Header */}
            <div className="groups-header">
              <div>
                <h2>Bible Study Groups</h2>
                <p className="text-muted">Connect, study, and grow with fellow believers.</p>
              </div>
              <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                <Plus size={18} /> Create Group
              </button>
            </div>

            {/* Search + Filter Row */}
            <div className="groups-search-row">
              <div className="group-search-bar">
                <Search size={18} className="group-search-icon" />
                <input
                  type="text"
                  placeholder="Search groups by name or topic..."
                  value={groupSearch}
                  onChange={e => setGroupSearch(e.target.value)}
                />
                {groupSearch && (
                  <button className="search-clear" onClick={() => setGroupSearch('')}><X size={15} /></button>
                )}
              </div>
              <div className="testimonies-filter">
                <button className={`filter-btn ${groupFilter === 'all' ? 'active' : ''}`} onClick={() => setGroupFilter('all')}>
                  All Groups
                </button>
                <button className={`filter-btn ${groupFilter === 'mine' ? 'active' : ''}`} onClick={() => setGroupFilter('mine')}>
                  My Groups {myGroups.length > 0 && `(${myGroups.length})`}
                </button>
              </div>
            </div>

            {/* Suggested Groups Banner (if user has no groups) */}
            {myGroups.length === 0 && groups.length > 0 && (
              <motion.div className="suggested-banner" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <TrendingUp size={18} />
                <span>You haven't joined any group yet. Explore the communities below and click <strong>Join</strong> to get started!</span>
              </motion.div>
            )}

            {groupLoading ? (
              <div className="text-center p-5">
                <Loader2 className="animate-spin mx-auto" size={40} />
                <p className="mt-2">Finding study groups...</p>
              </div>
            ) : displayGroups.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h3>{groupSearch ? `No groups match "${groupSearch}"` : 'No groups yet'}</h3>
                <p>{groupSearch ? 'Try a different search term.' : 'Why not create the first one?'}</p>
              </div>
            ) : (
              <div className="groups-container">
                {displayGroups.map(group => {
                  const theme = getTopicTheme(group.topic);
                  const isMember = myGroups.some(mg => mg.id === group.id);
                  const isNew = isGroupNew(group);
                  return (
                    <motion.div
                      key={group.id}
                      className="group-card"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => loadGroupDetails(group.id)}
                    >
                      {/* Gradient Banner */}
                      <div className="group-card-banner" style={{ background: theme.gradient }}>
                        <span className="group-card-icon">{theme.icon}</span>
                        {isNew && <span className="group-new-badge">NEW</span>}
                        {isMember && <span className="group-member-badge">✓ Member</span>}
                      </div>

                      <div className="group-card-body">
                        <span className="group-topic" style={{ background: theme.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                          {group.topic || theme.label}
                        </span>
                        <h3>{group.name}</h3>
                        <p className="group-description">{group.description || 'A community of believers studying together.'}</p>

                        <div className="group-meta">
                          <div className="group-meta-item">
                            <Users size={14} />
                            <span>{group.memberCount || 1} member{(group.memberCount || 1) !== 1 ? 's' : ''}</span>
                          </div>
                          {group.meetingTime && (
                            <div className="group-meta-item">
                              <Clock size={14} />
                              <span>{group.meetingTime}</span>
                            </div>
                          )}
                        </div>

                        <div className="group-actions">
                          {isMember ? (
                            <button className="btn-outline w-100" onClick={e => { e.stopPropagation(); loadGroupDetails(group.id); }}>
                              Open Group <ChevronRight size={16} />
                            </button>
                          ) : (
                            <button className="btn-primary w-100" onClick={e => { e.stopPropagation(); handleJoinGroup(group.id); }}>
                              <UserPlus size={16} /> Join Group
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ── GROUP DETAIL ── */
          <div className="group-detail-view">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="group-detail-header">
              <button className="group-detail-back" onClick={() => setSelectedGroup(null)}>
                <ArrowLeft size={18} /> Back to Groups
              </button>

              {/* Banner */}
              <div className="group-detail-banner" style={{ background: getTopicTheme(selectedGroup.topic).gradient }}>
                <div className="group-detail-banner-content">
                  <span className="group-detail-icon">{getTopicTheme(selectedGroup.topic).icon}</span>
                  <div>
                    <span className="group-detail-topic">{selectedGroup.topic || 'Bible Study'}</span>
                    <h1 className="group-detail-name">{selectedGroup.name}</h1>
                    <div className="group-detail-meta">
                      <span><Users size={15} /> {selectedGroup.memberCount} members</span>
                      {selectedGroup.meetingTime && <span><Clock size={15} /> {selectedGroup.meetingTime}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="group-info-grid">
                <div className="group-main-content">
                  {selectedGroup.description && (
                    <p className="group-description" style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>{selectedGroup.description}</p>
                  )}
                  {selectedGroup.pinnedVerse && (
                    <div className="pinned-verse-gold">
                      <div className="pinned-verse-gold-header"><Pin size={15} /> Pinned Verse</div>
                      <blockquote style={{ margin: 0, fontStyle: 'italic', color: 'var(--dark)', fontSize: '1.1rem' }}>
                        {selectedGroup.pinnedVerse}
                      </blockquote>
                    </div>
                  )}
                </div>
                <div className="group-side-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="mb-0">Members ({groupMembers.length})</h4>
                    <UserPlus size={18} className="text-primary" />
                  </div>
                  <div className="member-list">
                    {groupMembers.map(member => (
                      <div key={member.id} className="member-item">
                        <div className="member-avatar" style={{ background: getRandomColor(member.name || 'User') }}>
                          {(member.name || 'U').charAt(0)}
                        </div>
                        <div>
                          <span className="member-name">{member.name}</span>
                          {member.GroupMember?.role === 'founder' && (
                            <span className="founder-badge">Founder</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {groupMembers.length === 0 && <p className="text-muted" style={{ fontSize: '0.85rem' }}>No members listed yet.</p>}
                  </div>
                  {myGroups.some(mg => mg.id === selectedGroup.id) && selectedGroup.founderId !== localStorage.getItem('userId') && (
                    <button className="leave-btn" onClick={() => handleLeaveGroup(selectedGroup.id)}>Leave Group</button>
                  )}
                  {!myGroups.some(mg => mg.id === selectedGroup.id) && (
                    <button className="btn-primary w-100 mt-3" onClick={() => handleJoinGroup(selectedGroup.id)}>
                      <UserPlus size={16} /> Join This Group
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Group Discussions */}
            <div className="group-discussions">
              <h3 className="group-discussion-title">
                <MessageCircle size={22} className="text-primary" /> Group Discussions
              </h3>

              {myGroups.some(mg => mg.id === selectedGroup.id) ? (
                <motion.div className="post-form-card compact mb-4">
                  <div className="relative">
                    <textarea
                      className="post-input"
                      placeholder="Message the group..."
                      value={newPostContent}
                      onChange={e => setNewPostContent(e.target.value)}
                      style={{ minHeight: '80px' }}
                    />
                    <div className="scripture-input-wrapper mt-2">
                      <BookOpen className="scripture-icon" size={18} />
                      <input type="text" className="scripture-input" placeholder="Related Scripture (optional)"
                        value={newPostScripture} onChange={e => setNewPostScripture(e.target.value)} />
                    </div>
                    <div className="text-right mt-2 d-flex justify-content-end">
                      <button className="btn-primary btn-sm" onClick={handleCreateGroupPost} disabled={!newPostContent.trim()}>
                        <Send size={16} /> Send to Group
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="member-only-notice">
                  <Users size={20} />
                  <p>Only members can participate in this group's discussion.</p>
                  <button className="btn-primary btn-sm" onClick={() => handleJoinGroup(selectedGroup.id)}>
                    Join to Participate
                  </button>
                </div>
              )}

              <div className="group-posts-feed">
                {groupLoading ? (
                  <div className="text-center p-4"><Loader2 className="animate-spin" size={32} /></div>
                ) : groupPosts.length > 0 ? (
                  groupPosts.map(post => (
                    <motion.div key={post.id} className="post-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="post-header">
                        <div className="author-info">
                          <div className="author-avatar small" style={{ background: getRandomColor(post.user?.name || 'User'), width: '36px', height: '36px', overflow: 'hidden' }}>
                            {post.user?.profilePicture
                              ? <img src={getImageUrl(post.user.profilePicture)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : (post.user?.name || 'U').charAt(0)}
                          </div>
                          <div className="author-details">
                            <span className="name" style={{ fontSize: '0.9rem' }}>{post.user?.name || 'Anonymous'}</span>
                            <span className="meta">{new Date(post.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="post-content" style={{ fontSize: '0.95rem' }}>{post.content}</div>
                      {post.scripture && (
                        <div className="post-scripture-tag" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}>
                          <BookOpen size={14} /> {post.scripture}
                        </div>
                      )}
                      <div className="post-footer-actions" style={{ paddingTop: '0.75rem' }}>
                        <button className="action-btn" onClick={() => toggleComments(post.id)}>
                          <MessageCircle size={18} /> <span>{post.commentCount || 0}</span>
                        </button>
                        <button className={`action-btn ${post.isPrayed ? 'active' : ''}`} onClick={() => togglePray(post.id)}>
                          <Heart size={18} fill={post.isPrayed ? 'currentColor' : 'none'} />
                          <span>{post.prayCount || 0}</span>
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="empty-state" style={{ padding: '3rem' }}>
                    <div className="empty-state-icon">💬</div>
                    <h3>No messages yet</h3>
                    <p>Start the conversation!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {/* ═══════════ BOOKS TAB ═══════════ */}
      {activeTab === 'books' && <BooksLibrary />}

      {/* ═══════════ CREATE GROUP MODAL ═══════════ */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => { if (e.target.className === 'modal-overlay') setShowCreateModal(false); }}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {/* Modal Header with dynamic gradient preview */}
              <div className="modal-hero" style={{ background: getTopicTheme(newGroup.topic).gradient }}>
                <button className="close-modal" onClick={() => setShowCreateModal(false)} aria-label="Close">
                  <X size={22} />
                </button>
                <div className="modal-hero-icon">{getTopicTheme(newGroup.topic).icon}</div>
                <h2 style={{ color: 'white', margin: 0 }}>Create Study Group</h2>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
                  Build a community of believers
                </p>
              </div>

              <div className="modal-details">
                <form onSubmit={handleCreateGroup}>
                  <div className="form-group">
                    <label>Group Name *</label>
                    <input type="text" placeholder="e.g., Morning Devotionals" value={newGroup.name}
                      onChange={e => setNewGroup({ ...newGroup, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Study Topic</label>
                    <input type="text" placeholder="e.g., Prayer, Evangelism, Book of Romans…"
                      value={newGroup.topic} onChange={e => setNewGroup({ ...newGroup, topic: e.target.value })} />
                    {newGroup.topic && (
                      <div className="topic-preview" style={{ background: getTopicTheme(newGroup.topic).gradient }}>
                        {getTopicTheme(newGroup.topic).icon} {getTopicTheme(newGroup.topic).label} theme applied
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea placeholder="Tell us what this group is about..."
                      value={newGroup.description} onChange={e => setNewGroup({ ...newGroup, description: e.target.value })} rows={3} />
                  </div>
                  <div className="form-group">
                    <label>Pinned Scripture Verse (optional)</label>
                    <input type="text" placeholder="e.g., For where two or three gather… – Matthew 18:20"
                      value={newGroup.pinnedVerse} onChange={e => setNewGroup({ ...newGroup, pinnedVerse: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Meeting Time (optional)</label>
                    <input type="text" placeholder="e.g., Every Sunday at 7 PM"
                      value={newGroup.meetingTime} onChange={e => setNewGroup({ ...newGroup, meetingTime: e.target.value })} />
                  </div>
                  <button type="submit" className="btn-primary w-100" style={{ justifyContent: 'center' }}>
                    <Flame size={18} /> Launch Group
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Community;
