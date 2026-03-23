import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true); // Always start loading when token changes
      const storedToken = localStorage.getItem('token');
      try {
        if (storedToken) {
          try {
            // Sync with server using the established api utility
            const latestUser = await api.get('/auth/me');
            console.log('AuthContext: Sync successful, role:', latestUser.role);
            setUser(latestUser);
            localStorage.setItem('user', JSON.stringify(latestUser));
          } catch (err) {
            console.error('Initial auth sync failed:', err);
            // Fallback to local storage if offline / token expired
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              try {
                const parsed = JSON.parse(storedUser);
                console.log('AuthContext: Fallback to local storage, role:', parsed.role);
                setUser(parsed);
              } catch (parseErr) {
                // Malformed JSON in localStorage — clear it and treat as logged out
                console.error('AuthContext: Failed to parse stored user, clearing session.', parseErr);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('isLoggedIn');
                setToken(null);
                setUser(null);
              }
            } else {
              // No valid session at all
              setToken(null);
              setUser(null);
            }
          }
        } else {
          setUser(null);
        }
      } catch (fatalErr) {
        // Safety net: catch any unexpected error so loading always resolves
        console.error('AuthContext: Unexpected fatal error during init:', fatalErr);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [token]);

  const login = (userData, userToken) => {
    // Store everything first
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isLoggedIn', 'true');
    // Set user immediately from login response (has correct role)
    setUser(userData);
    // Trigger the useEffect re-run to sync from server
    setToken(userToken);
  };

  const logout = () => {
    localStorage.clear(); // Aggressive clear to prevent identity mismatch
    setToken(null);
    setUser(null);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
          registration.unregister();
          console.log('Stale SW unregistered during cleanup');
        }
      });
    }
    window.location.href = '/login'; // Redirect to login for a fresh start
  };

  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a1628' }}>
        <div className="animate-spin" style={{ width: 52, height: 52, borderRadius: '50%', border: '4px solid #e9c46a', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isLoggedIn: !!token && !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
