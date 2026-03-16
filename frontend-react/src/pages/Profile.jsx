import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, User, Mail, Shield, Save, Loader2, Edit3, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { getImageUrl } from '../utils/imageUrl';
import './Profile.css';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    

    const [formData, setFormData] = useState({
        name: user?.name || '',
        bio: user?.bio || ''
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(getImageUrl(user?.profilePicture));

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                bio: user.bio || ''
            });
            if (user.profilePicture) {
                setPreviewUrl(getImageUrl(user.profilePicture));
            }
        }
    }, [user]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setError('');
        setSuccess('');

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('bio', formData.bio);
            if (selectedFile) {
                data.append('profilePicture', selectedFile);
            }

            // Using fetch directly for FormData to avoid axios/api JSON default headers
            const token = localStorage.getItem('token');
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const baseUrl = isLocal ? 'http://localhost:5000' : '';
            const response = await fetch(`${baseUrl}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // DON'T set Content-Type, browser will do it for FormData
                },
                body: data
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to update profile');
            }

            // Update auth context with updated user data
            const updatedUser = { ...user, ...result.user };
            if (updateUser) {
                updateUser(updatedUser);
            }

            setSuccess('Profile updated successfully!');
            setStatus('success');
            
            // Short delay then reload to refresh all visual assets
            setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
            setError(err.message);
            setStatus('error');
        }
    };

    return (
        <div className="profile-page section container">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="profile-card"
            >
                <div className="profile-header">
                    <h2>My Profile</h2>
                    <p>Manage your account settings and public presence.</p>
                </div>

                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="avatar-section">
                        <div className="avatar-preview">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Profile" />
                            ) : (
                                <div className="avatar-placeholder">
                                    {formData.name.charAt(0)}
                                </div>
                            )}
                            <label className="avatar-upload-btn">
                                <Camera size={20} />
                                <input type="file" onChange={handleFileSelect} accept="image/*" hidden />
                            </label>
                        </div>
                        <div className="avatar-info">
                            <h3>Profile Picture</h3>
                            <p>PNG, JPG or JPEG. Max 5MB.</p>
                        </div>
                    </div>

                    <div className="form-group-grid">
                        <div className="form-group">
                            <label><User size={16} /> Full Name</label>
                            <input 
                                type="text" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label><Mail size={16} /> Email Address (Read-only)</label>
                            <input type="email" value={user?.email || ''} disabled className="disabled-input" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label><Edit3 size={16} /> Bio</label>
                        <textarea 
                            value={formData.bio}
                            onChange={(e) => setFormData({...formData, bio: e.target.value})}
                            placeholder="Tell the community a bit about yourself..."
                            rows={4}
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <div className="profile-actions">
                        <button type="submit" className="btn-primary" disabled={status === 'loading'}>
                            {status === 'loading' ? (
                                <><Loader2 className="animate-spin" size={18} /> Saving...</>
                            ) : (
                                <><Save size={18} /> Save Changes</>
                            )}
                        </button>
                    </div>
                </form>

                <div className="account-meta">
                    <div className="meta-item">
                        <Shield size={18} />
                        <div>
                            <strong>Account Type</strong>
                            <span>{user?.role === 'admin' ? 'Administrator' : 'General User'}</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Profile;
