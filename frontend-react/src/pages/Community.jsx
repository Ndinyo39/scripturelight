import React, { useState, useEffect } from 'react';
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
  User as UserIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import BooksLibrary from '../components/BooksLibrary';
import { getImageUrl } from '../utils/imageUrl';
import './Community.css';

const Community = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostScripture, setNewPostScripture] = useState('');
  const [activeType, setActiveType] = useState('encouragement');
  const [filter, setFilter] = useState('all');
  const [expandedComments, setExpandedComments] = useState({});
  const [postComments, setPostComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('communityTab');
    if (saved) {
      localStorage.removeItem('communityTab'); // Use it once
      return saved;
    }
    return 'feed';
  }); 
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupPosts, setGroupPosts] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupFilter, setGroupFilter] = useState('all'); // 'all' or 'mine'
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    topic: '',
  });


  useEffect(() => {
    if (activeTab === 'feed') {
      loadPosts();
    } else {
      if (!selectedGroup) {
        loadGroups();
      }
    }
  }, [activeTab, selectedGroup]);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await api.get('/community');
      setPosts(data);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    setGroupLoading(true);
    try {
      const [allGroups, userGroups] = await Promise.all([
        api.get('/groups'),
        api.get('/groups/my').catch(() => []) // Handle case where user is not logged in
      ]);
      setGroups(allGroups);
      setMyGroups(userGroups);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setGroupLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroup.name.trim()) return;

    try {
      const createdGroup = await api.post('/groups', newGroup);
      setGroups([createdGroup, ...groups]);
      setMyGroups([...myGroups, createdGroup]);
      setShowCreateModal(false);
      setNewGroup({ name: '', description: '', topic: '', meetingTime: '' });
      setSelectedGroup(createdGroup); // Automatically open the new group
    } catch (err) {
      console.error('Failed to create group:', err);
      alert(err.message || 'Failed to create group. Please try again.');
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
    } finally {
      setGroupLoading(false);
    }
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
      alert('Joined group successfully!');
    } catch (err) {
      console.error('Failed to join group:', err);
      alert(err.message || 'Failed to join group. Please try again.');
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      await api.post(`/groups/${groupId}/leave`);
      setMyGroups(myGroups.filter(g => g.id !== groupId));
      setGroups(groups.map(g => g.id === groupId ? { ...g, memberCount: Math.max(0, g.memberCount - 1) } : g));
      setSelectedGroup(null);
    } catch (err) {
      console.error('Failed to leave group:', err);
      alert('Failed to leave group.');
    }
  };

  const handleCreateGroupPost = async () => {
    if (!newPostContent.trim() || !selectedGroup) return;
    
    try {
      const newPost = await api.post(`/groups/${selectedGroup.id}/posts`, {
        content: newPostContent,
        scripture: newPostScripture
      });
      
      setGroupPosts([newPost, ...groupPosts]);
      setNewPostContent('');
      setNewPostScripture('');
    } catch (err) {
      console.error('Failed to create group post:', err);
      alert(err.message || 'Failed to create group post. Please try again.');
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    
    try {
      const newPost = await api.post('/community', {
        content: newPostContent,
        scripture: newPostScripture,
        type: activeType
      });
      
      setPosts([newPost, ...posts]);
      setNewPostContent('');
      setNewPostScripture('');
    } catch (err) {
      console.error('Failed to create post:', err);
      alert(err.message || 'Please login or check your connection to share a post.');
    }
  };

  const togglePray = async (id) => {
    try {
      const updatedPost = await api.post(`/community/${id}/pray`);
      setPosts(posts.map(post => 
        post.id === id ? { ...post, prayCount: updatedPost.prayCount, isPrayed: !post.isPrayed } : post
      ));
    } catch (err) {
      console.error('Failed to pray for post:', err);
      alert(err.message || 'Please login to pray for someone.');
    }
  };

  const toggleComments = async (id) => {
    const isExpanding = !expandedComments[id];
    setExpandedComments(prev => ({ ...prev, [id]: isExpanding }));
    
    if (isExpanding && !postComments[id]) {
      try {
        const data = await api.get(`/comments/post/${id}`);
        setPostComments(prev => ({ ...prev, [id]: data }));
      } catch (err) {
        console.error('Failed to load comments:', err);
      }
    }
  };

  const handleCommentSubmit = async (postId) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;

    try {
      const newComment = await api.post(`/comments/post/${postId}`, { content });
      setPostComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment]
      }));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      
      // Update comment count locally
      setPosts(posts.map(p => p.id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p));
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert(err.message || 'Please login to comment.');
    }
  };

  const getRandomColor = (name) => {
    const colors = ['#4a6fa5', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <div className="community-page container">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Community</h1>
        <p className="mb-4 text-muted">A place to encourage, pray, and grow together.</p>
      </motion.div>

      {/* Primary Tabs */}
      <div className="community-tabs">
        <button 
          className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          Shared Feed
        </button>
        <button 
          className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          Study Groups
        </button>
        <button 
          className={`tab-btn ${activeTab === 'books' ? 'active' : ''}`}
          onClick={() => setActiveTab('books')}
        >
          Christian Books
        </button>
      </div>

      {activeTab === 'feed' && (
        <>
          {/* Post Creation Form */}
          <motion.div 
            className="post-form-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3>Share what's on your heart...</h3>
            <div className="relative">
              <textarea 
                className="post-input"
                placeholder="I'm thinking about..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                maxLength={500}
              />
              <div className="text-right text-xs text-muted mb-2" style={{ textAlign: 'right', fontSize: '0.75rem', color: '#888', marginTop: '-10px', marginBottom: '10px' }}>
                {newPostContent.length}/500
              </div>
            </div>
            
            <div className="scripture-input-wrapper">
              <BookOpen className="scripture-icon" size={18} />
              <input 
                type="text" 
                className="scripture-input"
                placeholder="Related Scripture (optional)"
                value={newPostScripture}
                onChange={(e) => setNewPostScripture(e.target.value)}
              />
            </div>

            <div className="post-form-footer">
              <div className="post-type-selector">
                <button 
                  className={`post-type-btn ${activeType === 'encouragement' ? 'active' : ''}`}
                  onClick={() => setActiveType('encouragement')}
                >
                  <Quote size={16} /> Encouragement
                </button>
                <button 
                  className={`post-type-btn ${activeType === 'prayer' ? 'active' : ''}`}
                  onClick={() => setActiveType('prayer')}
                >
                  <Heart size={16} /> Prayer Request
                </button>
                <button 
                  className={`post-type-btn ${activeType === 'question' ? 'active' : ''}`}
                  onClick={() => setActiveType('question')}
                >
                  <HelpCircle size={16} /> Question
                </button>
              </div>

              <button className="btn-primary" onClick={handleCreatePost} disabled={!newPostContent.trim()}>
                <Send size={18} className="mr-2" /> Post
              </button>
            </div>
          </motion.div>

          {/* Feed Filters */}
          <div className="testimonies-filter mb-5">
            {['all', 'prayer', 'encouragement', 'question'].map(f => (
              <button 
                key={f}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All Posts' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
              </button>
            ))}
          </div>

          {/* Posts Feed */}
          <div className="posts-feed">
            {loading ? (
              <div className="text-center p-5">
                <Loader2 className="animate-spin mx-auto" size={40} />
                <p className="mt-2">Loading fellow believers' posts...</p>
              </div>
            ) : (
              <AnimatePresence>
                {posts
                  .filter(p => filter === 'all' || p.type === filter)
                  .map(post => (
                  <motion.div 
                    key={post.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="post-card"
                  >
                    <div className="post-header">
                      <Link to={`/profile/${post.user?.id}`} className="author-info text-decoration-none" style={{ textDecoration: 'none' }}>
                        <div className="author-avatar" style={{ 
                          background: getRandomColor(post.user?.name || 'User'),
                          overflow: 'hidden'
                        }}>
                          {post.user?.profilePicture ? (
                            <img src={getImageUrl(post.user.profilePicture)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            (post.user?.name || 'U').charAt(0)
                          )}
                        </div>
                        <div className="author-details">
                          <span className="name" style={{ color: 'var(--dark)' }}>{post.user?.name || 'Anonymous Believer'}</span>
                          <span className="meta">
                            {new Date(post.createdAt).toLocaleDateString()} • {post.type || 'encouragement'}
                          </span>
                        </div>
                      </Link>
                      <button className="action-btn">
                        <MoreHorizontal size={20} />
                      </button>
                    </div>

                    <div className="post-content">
                      {post.content}
                    </div>

                    {post.scripture && (
                      <div className="post-scripture-tag">
                        <BookOpen size={16} />
                        {post.scripture}
                      </div>
                    )}

                    <div className="post-footer-actions">
                      <button 
                        className={`action-btn ${post.isPrayed ? 'active' : ''}`}
                        onClick={() => togglePray(post.id)}
                      >
                        <Heart size={20} />
                        <span>Pray ({post.prayCount || 0})</span>
                      </button>
                      <button className="action-btn" onClick={() => toggleComments(post.id)}>
                        <MessageCircle size={20} />
                        <span>Comments ({post.commentCount || 0})</span>
                      </button>
                      <button className="action-btn">
                        <Share2 size={20} />
                        <span>Share</span>
                      </button>
                    </div>

                    {/* Comments Section */}
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
                                <div key={comment.id} className="comment-item p-3 border-bottom">
                                  <Link to={`/profile/${comment.user?.id}`} className="d-flex align-items-center mb-2 text-decoration-none" style={{ textDecoration: 'none' }}>
                                    <div className="author-avatar small mr-2" style={{ 
                                      background: getRandomColor(comment.user?.name || 'User'), 
                                      width: '24px', 
                                      height: '24px', 
                                      fontSize: '12px',
                                      overflow: 'hidden',
                                      marginRight: '8px'
                                    }}>
                                      {comment.user?.profilePicture ? (
                                        <img src={getImageUrl(comment.user.profilePicture)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      ) : (
                                        (comment.user?.name || 'U').charAt(0)
                                      )}
                                    </div>
                                    <span className="font-weight-bold" style={{ fontSize: '0.9rem', color: 'var(--dark)' }}>{comment.user?.name || 'Anonymous'}</span>
                                    <span className="text-muted ml-2" style={{ fontSize: '0.8rem', marginLeft: '8px' }}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                                  </Link>
                                  <p className="mb-0" style={{ fontSize: '0.92rem' }}>{comment.content}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-muted p-3 text-center">Be the first to comment!</p>
                            )}
                          </div>
                          <div className="comment-input-box">
                            <input 
                              type="text" 
                              placeholder="Write a comment..." 
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                            />
                            <button 
                              className="btn-primary btn-sm"
                              onClick={() => handleCommentSubmit(post.id)}
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

          <div className="text-center mt-5">
            <button className="btn-outline" onClick={loadPosts} disabled={loading}>
              <ArrowDown size={18} className="mr-2" /> Refresh Feed
            </button>
          </div>
        </>
      )}

      {activeTab === 'groups' && (
        !selectedGroup ? (
          <div className="groups-view">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2>Active Bible Study Groups</h2>
                <div className="testimonies-filter mt-3">
                  <button 
                    className={`filter-btn ${groupFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setGroupFilter('all')}
                  >
                    All Groups
                  </button>
                  <button 
                    className={`filter-btn ${groupFilter === 'mine' ? 'active' : ''}`}
                    onClick={() => setGroupFilter('mine')}
                  >
                    My Groups
                  </button>
                </div>
              </div>
              <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                <Plus size={18} className="mr-2" /> Create Group
              </button>
            </div>

            {groupLoading ? (
              <div className="text-center p-5">
                <Loader2 className="animate-spin mx-auto" size={40} />
                <p className="mt-2">Finding study groups...</p>
              </div>
            ) : (
              <div className="groups-container">
                {groups
                  .filter(g => groupFilter === 'all' || myGroups.some(mg => mg.id === g.id))
                  .map(group => {
                  const isMember = myGroups.some(mg => mg.id === group.id);
                  return (
                    <motion.div 
                      key={group.id}
                      className="group-card"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => loadGroupDetails(group.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="group-topic">{group.topic || 'General Bible Study'}</span>
                      <h3>{group.name}</h3>
                      <p className="group-description">{group.description}</p>
                      
                      <div className="group-meta">
                        <div className="d-flex align-items-center">
                          <Users size={16} className="mr-1" />
                          <span>{group.memberCount} members</span>
                        </div>
                        {group.meetingTime && (
                          <div className="d-flex align-items-center">
                            <Clock size={16} className="mr-1" />
                            <span>{group.meetingTime}</span>
                          </div>
                        )}
                      </div>

                      <div className="group-actions mt-auto">
                        {isMember ? (
                          <button className="btn-outline w-100">
                            Enter Group <ChevronRight size={16} className="ml-1" />
                          </button>
                        ) : (
                          <button className="btn-primary w-100" onClick={(e) => {
                            e.stopPropagation();
                            handleJoinGroup(group.id);
                          }}>
                            Join Group
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                {groups.length === 0 && (
                  <div className="text-center p-5 w-100" style={{ gridColumn: '1 / -1' }}>
                    <Users size={40} className="text-muted mb-3" />
                    <p>No study groups found. Why not create the first one?</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="group-detail-view">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="group-detail-header"
            >
              <button className="group-detail-back" onClick={() => setSelectedGroup(null)}>
                <ArrowLeft size={18} /> Back to Groups
              </button>
              <div className="group-info-grid">
                <div className="group-main-content">
                  <span className="group-topic">{selectedGroup.topic || 'General Bible Study'}</span>
                  <h1>{selectedGroup.name}</h1>
                  <p className="group-description">{selectedGroup.description}</p>
                  <div className="d-flex gap-4 mt-3">
                    <div className="d-flex align-items-center text-muted">
                      <Users size={18} className="mr-2" /> {selectedGroup.memberCount} members
                    </div>
                    {selectedGroup.meetingTime && (
                      <div className="d-flex align-items-center text-muted">
                        <Clock size={18} className="mr-2" /> {selectedGroup.meetingTime}
                      </div>
                    )}
                  </div>
                </div>
                <div className="group-side-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="mb-0">Group Members</h4>
                    <UserPlus size={18} className="text-primary" />
                  </div>
                  <div className="member-list">
                    {groupMembers.map(member => (
                      <div key={member.id} className="member-item">
                        <div 
                          className="member-avatar" 
                          style={{ background: getRandomColor(member.name || 'User') }}
                        >
                          {(member.name || 'U').charAt(0)}
                        </div>
                        <span className="member-name">{member.name} {member.GroupMember?.role === 'founder' ? '(Founder)' : ''}</span>
                      </div>
                    ))}
                  </div>
                  {myGroups.some(mg => mg.id === selectedGroup.id) && selectedGroup.founderId !== localStorage.getItem('userId') && (
                    <button className="leave-btn" onClick={() => handleLeaveGroup(selectedGroup.id)}>
                      Leave Group
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            <div className="group-discussions">
              <h3 className="group-discussion-title">
                <MessageCircle size={22} className="text-primary" /> Group Discussions
              </h3>

              {/* Posting to Group */}
              {myGroups.some(mg => mg.id === selectedGroup.id) ? (
                <motion.div className="post-form-card compact mb-4">
                  <div className="relative">
                    <textarea 
                      className="post-input"
                      placeholder="Message the group..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      style={{ minHeight: '80px' }}
                    />
                    <div className="scripture-input-wrapper mt-2">
                      <BookOpen className="scripture-icon" size={18} />
                      <input 
                        type="text" 
                        className="scripture-input"
                        placeholder="Related Scripture (optional)"
                        value={newPostScripture}
                        onChange={(e) => setNewPostScripture(e.target.value)}
                      />
                    </div>
                    <div className="text-right mt-2 d-flex justify-content-end">
                      <button className="btn-primary btn-sm" onClick={handleCreateGroupPost} disabled={!newPostContent.trim()}>
                        <Send size={16} className="mr-2" /> Send to Group
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="alert-info p-3 rounded mb-4 text-center" style={{ background: 'var(--primary-transparent)', border: '1px solid var(--primary-light)' }}>
                  <p className="mb-0">Only members can participate in this group's discussion.</p>
                </div>
              )}

              {/* Group Feed */}
              <div className="group-posts-feed">
                {groupPosts.length > 0 ? (
                  groupPosts.map(post => (
                    <motion.div 
                      key={post.id}
                      className="post-card"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="post-header">
                        <div className="author-info">
                          <div className="author-avatar small" style={{
                            background: getRandomColor(post.user?.name || 'User'),
                            width: '36px',
                            height: '36px',
                            overflow: 'hidden'
                          }}>
                            {post.user?.profilePicture ? (
                              <img src={getImageUrl(post.user.profilePicture)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              (post.user?.name || 'U').charAt(0)
                            )}
                          </div>
                          <div className="author-details">
                            <span className="name" style={{ fontSize: '0.9rem' }}>{post.user?.name || 'Anonymous'}</span>
                            <span className="meta">{new Date(post.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="post-content" style={{ fontSize: '0.95rem' }}>
                        {post.content}
                      </div>
                      {post.scripture && (
                        <div className="post-scripture-tag" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}>
                          <BookOpen size={14} /> {post.scripture}
                        </div>
                      )}
                      <div className="post-footer-actions" style={{ paddingTop: '0.75rem' }}>
                        <button className="action-btn" onClick={() => toggleComments(post.id)}>
                          <MessageSquare size={18} /> <span>{post.commentCount || 0}</span>
                        </button>
                        <button 
                          className={`action-btn ${post.animatingAmen ? 'amen-pop' : ''}`} 
                          onClick={() => togglePray(post.id)}
                        >
                          <Heart size={18} className={post.isPrayed ? 'active' : ''} fill={post.isPrayed ? 'currentColor' : 'none'} /> 
                          <span>{post.isPrayed ? 'Amen' : (post.prayCount || 0)}</span>
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center p-5 text-muted">
                    <Quote size={30} className="mb-2 opacity-50" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {activeTab === 'books' && (
        <BooksLibrary />
      )}

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target.className === 'modal-overlay') setShowCreateModal(false);
            }}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <button 
                className="close-modal" 
                onClick={() => setShowCreateModal(false)}
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
              <h2>Create Study Group</h2>
              <form onSubmit={handleCreateGroup}>
                <div className="form-group">
                  <label>Group Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Morning Devotionals" 
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Study Topic</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Book of Romans" 
                    value={newGroup.topic}
                    onChange={(e) => setNewGroup({...newGroup, topic: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    placeholder="Tell us what this group is about..." 
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Meeting Time (optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Every Sunday at 7 PM" 
                    value={newGroup.meetingTime}
                    onChange={(e) => setNewGroup({...newGroup, meetingTime: e.target.value})}
                  />
                </div>
                <button type="submit" className="btn-primary w-100">
                  Launch Group
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Community;
