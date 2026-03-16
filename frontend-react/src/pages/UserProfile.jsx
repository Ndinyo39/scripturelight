import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, MessageSquare, Award, Calendar, BookOpen, Loader2, ChevronLeft } from 'lucide-react';
import { api } from '../api';
import { getImageUrl } from '../utils/imageUrl';
import './UserProfile.css';

const UserProfile = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get(`/users/${id}`);
                setData(response.data);
            } catch (err) {
                setError('Could not find this user.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    if (loading) return (
        <div className="loading-screen">
            <Loader2 className="animate-spin" size={48} />
            <p>Loading profile...</p>
        </div>
    );

    if (error || !data) return (
        <div className="section container text-center py-5">
            <h3>{error || 'User not found'}</h3>
            <Link to="/community" className="btn-primary mt-3">Back to Community</Link>
        </div>
    );


    const { user, posts } = data;

    return (
        <div className="user-profile-page section container">
            <Link to="/community" className="back-link">
                <ChevronLeft size={20} /> Back to Community
            </Link>

            <div className="user-profile-layout">
                {/* ── LEFT COLUMN: INFO ── */}
                <div className="profile-sidebar">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="user-info-card"
                    >
                        <div className="user-avatar-large">
                            {user.profilePicture ? (
                                <img src={getImageUrl(user.profilePicture)} alt={user.name} />
                            ) : (
                                <div className="avatar-placeholder">{user.name.charAt(0)}</div>
                            )}
                        </div>
                        <h2>{user.name}</h2>
                        <p className="user-role">{user.role === 'admin' ? 'Community Admin' : 'Faith Member'}</p>
                        
                        {user.bio ? (
                            <div className="user-bio">
                                <h4>About</h4>
                                <p>{user.bio}</p>
                            </div>
                        ) : (
                            <p className="no-bio">No bio provided yet.</p>
                        )}

                        <div className="user-stats-grid">
                            <div className="stat-box">
                                <MessageSquare size={18} />
                                <span>{user.postsCount} Posts</span>
                            </div>
                            <div className="stat-box">
                                <Award size={18} />
                                <span>{user.testimoniesCount} Testimonies</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ── RIGHT COLUMN: ACTIVITY ── */}
                <div className="profile-main">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="recent-activity"
                    >
                        <h3>Recent Activity</h3>
                        <div className="activity-list">
                            {posts.length === 0 ? (
                                <div className="empty-activity">
                                    <BookOpen size={40} />
                                    <p>No recent community posts from this user.</p>
                                </div>
                            ) : (
                                posts.map(post => (
                                    <div key={post.id} className="activity-card">
                                        <div className="activity-icon">
                                            <MessageSquare size={16} />
                                        </div>
                                        <div className="activity-content">
                                            <p>{post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content}</p>
                                            <span className="activity-date">
                                                <Calendar size={12} /> {new Date(post.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
