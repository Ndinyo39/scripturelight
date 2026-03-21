import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUrl';
import { X } from 'lucide-react';

const OnlineNotifier = () => {
  const { isLoggedIn, user: currentUser } = useAuth();
  const [toasts, setToasts] = useState([]);
  const previousUsersRef = useRef(new Set());
  const isInitialLoad = useRef(true);

  // Poll online users every 30 seconds
  useEffect(() => {
    if (!isLoggedIn) return;

    const checkOnlineUsers = async () => {
      try {
        const data = await api.get('/users/online');
        const currentUsersSet = new Set(data.map(u => u.id));

        if (isInitialLoad.current) {
          // Just populate the initial list
          isInitialLoad.current = false;
        } else {
          // See who is new
          data.forEach(user => {
            if (!previousUsersRef.current.has(user.id) && user.id !== currentUser?.id) {
              // It's a newly online user! Add a toast.
              addToast(user);
            }
          });
        }
        previousUsersRef.current = currentUsersSet;
      } catch (err) {
        console.error('Failed to poll online users', err);
      }
    };

    checkOnlineUsers();
    const interval = setInterval(checkOnlineUsers, 30000); // 30s polling
    return () => clearInterval(interval);
  }, [isLoggedIn, currentUser]);

  const addToast = (user) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, user }]);
    // Auto dismiss after 6s
    setTimeout(() => removeToast(id), 6000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getRandomColor = (name) => {
    const colors = ['#4a6fa5', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#7c3aed', '#059669'];
    const index = (name || 'U').length % colors.length;
    return colors[index];
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none'
    }}>
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: -50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.9 }}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              border: '1px solid #e9ecef',
              pointerEvents: 'auto',
              minWidth: '240px',
              maxWidth: 'calc(100vw - 40px)'
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: getRandomColor(toast.user.name),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 600,
              flexShrink: 0,
              overflow: 'hidden'
            }}>
              {toast.user.profilePicture ? (
                <img src={getImageUrl(toast.user.profilePicture)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                toast.user.name.charAt(0)
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#6c757d', lineHeight: 1.2 }}>Just came online</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.9rem', fontWeight: 600, color: '#1a1a2e', lineHeight: 1.2, wordBreak: 'break-word' }}>
                {toast.user.name.split(' ')[0]} is here! 🙏
              </p>
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#adb5bd',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex'
              }}
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default OnlineNotifier;
