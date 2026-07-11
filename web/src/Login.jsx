import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Lock, User, AlertCircle } from 'lucide-react';
import axios from 'axios';

// Create an axios instance for the API
const api = axios.create({
  baseURL: 'http://localhost:5200/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { username, password });
      
      // Store token securely (in localStorage for this demo)
      localStorage.setItem('fmdds_token', response.data.token);
      localStorage.setItem('fmdds_user', JSON.stringify(response.data.user));
      
      // Redirect to dashboard (SCR-002)
      navigate('/dashboard');
    } catch (err) {
      if (err.response && err.response.status === 423) {
        setError('Account locked due to too many failed attempts. Please try again later or contact an administrator.');
      } else if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Network error or server is unreachable. Is the backend running?');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '1rem'
    }}>
      <div className="glass-panel animate-in" style={{ 
        width: '100%', 
        maxWidth: '440px', 
        padding: '2.5rem',
        textAlign: 'center'
      }}>
        
        {/* Brand Logo Area */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--primary-100)',
            color: 'var(--primary-600)',
            marginBottom: '1rem'
          }}>
            <Activity size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>FMDDS Secure Login</h1>
          <p>Forensic Medicine Department Database</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} style={{ marginRight: '0.5rem', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          
          <div className="input-group">
            <label className="input-label" htmlFor="username">Username</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', color: 'var(--surface-300)' }}>
                <User size={18} />
              </div>
              <input 
                id="username"
                type="text" 
                className="input-field" 
                placeholder="e.g. jmo_perera"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label className="input-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', color: 'var(--surface-300)' }}>
                <Lock size={18} />
              </div>
              <input 
                id="password"
                type="password" 
                className="input-field" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            disabled={isLoading}
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        
        <div style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          System Version 1.0.4 | © 2026 Forensic Medicine Dept.
        </div>
        
      </div>
    </div>
  );
};

export default Login;
