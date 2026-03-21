import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  MessageSquare, 
  Star, 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  ShieldAlert,
  Loader2,
  Filter,
  Eye,
  Settings,
  Book as BookIcon,
  Download,
  Upload
} from 'lucide-react';
import { api } from '../api';
import './Admin.css';

const Admin = () => {
    const [activeTab, setActiveTab] = useState('stats');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [data, setData] = useState([]);
    const [filterStatus, setFilterStatus] = useState('all');
    const [notification, setNotification] = useState(null);

    const showNotification = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    useEffect(() => {
        fetchStats();
        fetchTabData(activeTab);
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/stats');
            setStats(res);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    const fetchTabData = async (tab) => {
        if (tab === 'stats') return;
        setLoading(true);
        try {
            const endpoint = `/admin/${tab}`;
            const res = await api.get(endpoint);
            setData(res);
        } catch (err) {
            console.error(`Failed to fetch ${tab}:`, err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, type, status) => {
        try {
            await api.patch(`/admin/${type}/${id}/status`, { status });
            // Update local state
            setData(prev => prev.map(item => item.id === id ? { ...item, status } : item));
            fetchStats(); // Update pending counts
            showNotification('Status updated successfully');
        } catch (err) {
            showNotification('Failed to update status', 'error');
        }
    };

    const handleDelete = async (id, type) => {
        if (!window.confirm('Are you sure you want to permanently delete this?')) return;
        try {
            await api.delete(`/admin/${type}/${id}`);
            setData(prev => prev.filter(item => item.id !== id));
            fetchStats();
            showNotification('Item deleted successfully');
        } catch (err) {
            showNotification('Failed to delete item', 'error');
        }
    };

    const handleUpdateRole = async (userId, role) => {
        try {
            await api.patch(`/admin/users/${userId}/role`, { role });
            setData(prev => prev.map(user => user.id === userId ? { ...user, role } : user));
            showNotification('User role updated successfully');
        } catch (err) {
            showNotification('Failed to update user role', 'error');
        }
    };

    const handleUpdateUserStatus = async (userId, status) => {
        try {
            await api.patch(`/admin/users/${userId}/status`, { status });
            setData(prev => prev.map(user => user.id === userId ? { ...user, status } : user));
            fetchStats();
            showNotification('User status updated successfully');
        } catch (err) {
            showNotification('Failed to update user status', 'error');
        }
    };

    const filteredData = filterStatus === 'all' 
        ? data 
        : data.filter(item => item.status === filterStatus);

    return (
        <div className="admin-page section mt-navbar">
            <div className="admin-header">
                <div className="container">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h1>Admin Control Board</h1>
                            <p className="text-muted">Manage ScriptureLight users, groups, and content.</p>
                        </div>
                        <ShieldAlert className="text-primary" size={48} opacity={0.3} />
                    </div>
                </div>
            </div>

            <div className="container">
                {/* ── STATS CARDS ── */}
                <div className="admin-stats-grid">
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon"><Users /></div>
                        <div className="admin-stat-info">
                            <h4>Total Users</h4>
                            <p>{stats.usersCount || 0}</p>
                        </div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon"><BookOpen color="#2a9d8f" /></div>
                        <div className="admin-stat-info">
                            <h4>Groups</h4>
                            <p>{stats.groupsCount || 0}</p>
                        </div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon"><Star color="#e9c46a" /></div>
                        <div className="admin-stat-info">
                            <h4>Testimonies</h4>
                            <p>{stats.testimoniesCount || 0}</p>
                        </div>
                    </div>
                    {stats.pendingTestimonies > 0 && (
                        <div className="admin-stat-card" style={{ border: '2px solid #e74c3c' }}>
                            <div className="admin-stat-icon" style={{ backgroundColor: '#fdecea', color: '#e74c3c' }}><ShieldAlert /></div>
                            <div className="admin-stat-info">
                                <h4 style={{ color: '#e74c3c' }}>Pending Approval</h4>
                                <p>{stats.pendingTestimonies}</p>
                            </div>
                        </div>
                    )}
                    {stats.pendingUsers > 0 && (
                        <div className="admin-stat-card" style={{ border: '2px solid #e67e22' }}>
                            <div className="admin-stat-icon" style={{ backgroundColor: '#fef5e7', color: '#e67e22' }}><Users /></div>
                            <div className="admin-stat-info">
                                <h4 style={{ color: '#e67e22' }}>New Signups</h4>
                                <p>{stats.pendingUsers}</p>
                            </div>
                        </div>
                    )}
                    {stats.pendingBooks > 0 && (
                        <div className="admin-stat-card" style={{ border: '2px solid #3498db' }}>
                            <div className="admin-stat-icon" style={{ backgroundColor: '#ebf5fb', color: '#3498db' }}><BookIcon /></div>
                            <div className="admin-stat-info">
                                <h4 style={{ color: '#3498db' }}>Pending Books</h4>
                                <p>{stats.pendingBooks}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── TABS ── */}
                <div className="admin-nav-tabs">
                    <button className={`admin-tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}><Settings size={18} /> Overview</button>
                    <button className={`admin-tab ${activeTab === 'groups' ? 'active' : ''}`} onClick={() => setActiveTab('groups')}><BookOpen size={18} /> Bible Groups</button>
                    <button className={`admin-tab ${activeTab === 'testimonies' ? 'active' : ''}`} onClick={() => setActiveTab('testimonies')}><Star size={18} /> Testimonies</button>
                    <button className={`admin-tab ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}><MessageSquare size={18} /> Comments</button>
                    <button className={`admin-tab ${activeTab === 'books' ? 'active' : ''}`} onClick={() => setActiveTab('books')}><BookIcon size={18} /> Christian Books</button>
                    <button className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}><Users size={18} /> User Management</button>
                </div>

                <div className="admin-board">
                    {notification && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                padding: '12px 16px',
                                marginBottom: '16px',
                                borderRadius: '8px',
                                background: notification.type === 'error' ? '#ffeeee' : '#eeffee',
                                color: notification.type === 'error' ? '#e74c3c' : '#2ecc71',
                                border: `1px solid ${notification.type === 'error' ? '#e74c3c' : '#2ecc71'}`,
                                fontWeight: 500
                            }}
                        >
                            {notification.msg}
                        </motion.div>
                    )}

                    {activeTab === 'stats' && (
                        <div className="text-center p-5">
                            <h2 className="mb-4">Quick Insights</h2>
                            <p className="text-muted">Select a tab above to manage specific sections of the platform.</p>
                            <div className="d-flex justify-content-center gap-3 mt-4">
                               <button className="btn-primary" onClick={() => setActiveTab('testimonies')}>Approve Testimonies</button>
                               <button className="btn-outline" onClick={() => setActiveTab('groups')}>Manage Groups</button>
                            </div>
                        </div>
                    )}

                    {activeTab !== 'stats' && (
                        <>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h3 className="text-capitalize">{activeTab} Management</h3>
                                {['testimonies', 'comments', 'users', 'books'].includes(activeTab) && (
                                    <div className="d-flex align-items-center gap-2">
                                        <Filter size={16} />
                                        <select className="form-select-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                            <option value="all">All Status</option>
                                            {activeTab === 'users' ? (
                                                <>
                                                    <option value="pending">Pending Approval</option>
                                                    <option value="active">Active</option>
                                                    <option value="suspended">Suspended</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="pending">Pending</option>
                                                    <option value="approved">Approved</option>
                                                    <option value="rejected">Rejected</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {loading ? (
                                <div className="text-center p-5"><Loader2 className="animate-spin" size={32} /></div>
                            ) : (
                                <div className="admin-table-wrapper">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                {activeTab === 'groups' && <><th>Group Name</th><th>Members</th><th>Founder</th><th>Actions</th></>}
                                                {activeTab === 'testimonies' && <><th>Testimony</th><th>Author</th><th>Status</th><th>Actions</th></>}
                                                {activeTab === 'comments' && <><th>Comment</th><th>Author</th><th>Target</th><th>Status</th><th>Actions</th></>}
                                                {activeTab === 'users' && <><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></>}
                                                {activeTab === 'books' && <><th>Book Info</th><th>Author</th><th>Uploader</th><th>Status</th><th>Actions</th></>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <AnimatePresence mode="popLayout">
                                                {filteredData.map((item) => (
                                                    <motion.tr 
                                                        key={item.id}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                    >
                                                        {activeTab === 'groups' && (
                                                            <>
                                                                <td><strong>{item.name}</strong><br/><small className="text-muted">{item.category}</small></td>
                                                                <td>{item.membersCount || 0}</td>
                                                                <td>{item.founder?.name || 'Unknown'}</td>
                                                                <td>
                                                                    <button className="action-btn-sm delete" onClick={() => handleDelete(item.id, 'groups')} title="Delete Group"><Trash2 size={16} /></button>
                                                                </td>
                                                            </>
                                                        )}

                                                        {activeTab === 'testimonies' && (
                                                            <>
                                                                <td>
                                                                    <strong>{item.title}</strong>
                                                                    <p className="mb-0 text-truncate" style={{ maxWidth: '300px' }}>{item.content}</p>
                                                                </td>
                                                                <td>{item.user?.name}</td>
                                                                <td><span className={`status-badge ${item.status}`}>{item.status}</span></td>
                                                                <td>
                                                                    <div className="admin-actions">
                                                                        {item.status !== 'approved' && <button className="action-btn-sm approve" onClick={() => handleUpdateStatus(item.id, 'testimonies', 'approved')}><CheckCircle size={16}/></button>}
                                                                        {item.status !== 'rejected' && <button className="action-btn-sm reject" onClick={() => handleUpdateStatus(item.id, 'testimonies', 'rejected')}><ShieldAlert size={16}/></button>}
                                                                        <button className="action-btn-sm delete" onClick={() => handleDelete(item.id, 'testimonies')}><Trash2 size={16} /></button>
                                                                    </div>
                                                                </td>
                                                            </>
                                                        )}

                                                        {activeTab === 'comments' && (
                                                            <>
                                                                <td><p className="mb-0 text-truncate" style={{ maxWidth: '300px' }}>{item.content}</p></td>
                                                                <td>{item.user?.name}</td>
                                                                <td><small>{item.testimony ? `Testimony: ${item.testimony.title}` : `Post: ${item.post?.content}`}</small></td>
                                                                <td><span className={`status-badge ${item.status}`}>{item.status}</span></td>
                                                                <td>
                                                                    <div className="admin-actions">
                                                                        {item.status !== 'approved' && <button className="action-btn-sm approve" onClick={() => handleUpdateStatus(item.id, 'comments', 'approved')}><CheckCircle size={16}/></button>}
                                                                        {item.status !== 'rejected' && <button className="action-btn-sm reject" onClick={() => handleUpdateStatus(item.id, 'comments', 'rejected')}><ShieldAlert size={16}/></button>}
                                                                        <button className="action-btn-sm delete" onClick={() => handleDelete(item.id, 'comments')}><Trash2 size={16} /></button>
                                                                    </div>
                                                                </td>
                                                            </>
                                                        )}

                                                        {activeTab === 'users' && (
                                                            <>
                                                                <td><strong>{item.name}</strong></td>
                                                                <td>{item.email}</td>
                                                                <td><span className={`status-badge ${item.role === 'admin' ? 'approved' : ''}`}>{item.role}</span></td>
                                                                <td><span className={`status-badge ${item.status === 'active' ? 'approved' : item.status === 'pending' ? 'pending' : 'rejected'}`}>{item.status}</span></td>
                                                                <td>
                                                                    <div className="d-flex gap-2">
                                                                        <select 
                                                                            className="form-select-sm" 
                                                                            value={item.role} 
                                                                            onChange={(e) => handleUpdateRole(item.id, e.target.value)}
                                                                            style={{ width: 'fit-content' }}
                                                                        >
                                                                            <option value="user">User</option>
                                                                            <option value="admin">Admin</option>
                                                                        </select>
                                                                        <select 
                                                                            className="form-select-sm" 
                                                                            value={item.status} 
                                                                            onChange={(e) => handleUpdateUserStatus(item.id, e.target.value)}
                                                                            style={{ width: 'fit-content' }}
                                                                        >
                                                                            <option value="pending">Pending</option>
                                                                            <option value="active">Active</option>
                                                                            <option value="suspended">Suspended</option>
                                                                        </select>
                                                                    </div>
                                                                </td>
                                                            </>
                                                        )}

                                                        {activeTab === 'books' && (
                                                            <>
                                                                <td>
                                                                    <strong>{item.title}</strong><br/>
                                                                    <small className="text-muted">{item.category}</small>
                                                                </td>
                                                                <td>{item.author}</td>
                                                                <td>{item.uploader?.name || 'Unknown'}</td>
                                                                <td><span className={`status-badge ${item.status}`}>{item.status}</span></td>
                                                                <td>
                                                                    <div className="admin-actions">
                                                                        {item.status !== 'approved' && <button className="action-btn-sm approve" onClick={() => handleUpdateStatus(item.id, 'books', 'approved')} title="Approve"><CheckCircle size={16}/></button>}
                                                                        {item.status !== 'rejected' && <button className="action-btn-sm reject" onClick={() => handleUpdateStatus(item.id, 'books', 'rejected')} title="Reject"><ShieldAlert size={16}/></button>}
                                                                        <button className="action-btn-sm delete" onClick={() => handleDelete(item.id, 'books')} title="Delete"><Trash2 size={16} /></button>
                                                                    </div>
                                                                </td>
                                                            </>
                                                        )}
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                    {filteredData.length === 0 && <div className="text-center p-5 text-muted">No records found.</div>}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Admin;
