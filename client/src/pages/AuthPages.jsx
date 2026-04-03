// client/src/pages/AuthPages.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, Mail, Lock, User, Phone } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="auth-container" style={{ 
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '24px'
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card" 
        style={{ width: '100%', maxWidth: '420px', padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 className="brand-font" style={{ fontSize: '28px', marginBottom: '8px' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-muted)' }}>Sign in to continue your travel journey</p>
        </div>

        {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="input-group">
            <Mail size={18} style={{ position: 'absolute', margin: '16px', color: 'var(--text-muted)' }} />
            <input 
              type="email" placeholder="Email Address" required 
              value={email} onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div className="input-group">
            <Lock size={18} style={{ position: 'absolute', margin: '16px', color: 'var(--text-muted)' }} />
            <input 
              type="password" placeholder="Password" required 
              value={password} onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            <LogIn size={20} />
            Continue
          </button>
        </form>

        <p style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600' }}>Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
};

export const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError('Registration failed. Try again.');
    }
  };

  return (
    <div className="auth-container" style={{ 
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '24px'
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card" 
        style={{ width: '100%', maxWidth: '420px', padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 className="brand-font" style={{ fontSize: '28px', marginBottom: '8px' }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)' }}>Start your smart travel tracking today</p>
        </div>

        {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <User size={18} style={{ position: 'absolute', margin: '14px', color: 'var(--text-muted)' }} />
            <input 
              placeholder="Full Name" required 
              value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
              style={inputStyle}
            />
          </div>
          <div className="input-group">
            <Mail size={18} style={{ position: 'absolute', margin: '14px', color: 'var(--text-muted)' }} />
            <input 
              type="email" placeholder="Email Address" required 
              value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={inputStyle}
            />
          </div>
          <div className="input-group">
            <Phone size={18} style={{ position: 'absolute', margin: '14px', color: 'var(--text-muted)' }} />
            <input 
              placeholder="Phone (optional)" 
              value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
              style={inputStyle}
            />
          </div>
          <div className="input-group">
            <Lock size={18} style={{ position: 'absolute', margin: '14px', color: 'var(--text-muted)' }} />
            <input 
              type="password" placeholder="Password" required 
              value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
              style={inputStyle}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
            <UserPlus size={20} />
            Join Now
          </button>
        </form>

        <p style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>Log in</Link>
        </p>
      </motion.div>
    </div>
  );
};

const inputStyle = {
  width: '100%', padding: '12px 12px 12px 48px', borderRadius: '12px',
  border: '1px solid #e2e8f0', background: 'rgba(255, 255, 255, 0.5)',
  outline: 'none', transition: 'border-color 0.2s', fontSize: '15px'
};
