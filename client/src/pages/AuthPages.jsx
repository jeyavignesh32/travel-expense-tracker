// client/src/pages/AuthPages.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Mail, Lock, User, Phone, Compass, ArrowRight, ShieldCheck } from 'lucide-react';

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
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    }
  };

  return <AuthLayout 
    title="Welcome Back" 
    sub="Sign in to continue your travel journey"
    error={error}
    onSubmit={handleSubmit}
    footer={<>Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '700' }}>Sign up</Link></>}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ position: 'relative' }}>
        <Mail size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-dim)' }} />
        <input 
          type="email" placeholder="Email Address" required 
          className="input-premium" style={{ paddingLeft: '48px' }}
          value={email} onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div style={{ position: 'relative' }}>
        <Lock size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-dim)' }} />
        <input 
          type="password" placeholder="Password" required 
          className="input-premium" style={{ paddingLeft: '48px' }}
          value={password} onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button type="submit" className="btn-premium" style={{ marginTop: '10px' }}>
        <LogIn size={20} />
        Sign In
      </button>
    </div>
  </AuthLayout>;
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
      setError(err.response?.data?.error || 'Registration failed. Try again.');
    }
  };

  return <AuthLayout 
    title="Create Account" 
    sub="Start your smart travel tracking today"
    error={error}
    onSubmit={handleSubmit}
    footer={<>Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '700' }}>Log in</Link></>}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ position: 'relative' }}>
        <User size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-dim)' }} />
        <input 
          placeholder="Full Name" required className="input-premium" style={{ paddingLeft: '48px' }}
          value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
        />
      </div>
      <div style={{ position: 'relative' }}>
        <Mail size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-dim)' }} />
        <input 
          type="email" placeholder="Email Address" required className="input-premium" style={{ paddingLeft: '48px' }}
          value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
      </div>
      <div style={{ position: 'relative' }}>
        <Phone size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-dim)' }} />
        <input 
          type="tel" placeholder="Phone Number" required className="input-premium" style={{ paddingLeft: '48px' }}
          value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
        />
      </div>
      <div style={{ position: 'relative' }}>
        <Lock size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-dim)' }} />
        <input 
          type="password" placeholder="Password" required className="input-premium" style={{ paddingLeft: '48px' }}
          value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
        />
      </div>
      <button type="submit" className="btn-premium" style={{ marginTop: '16px' }}>
        <UserPlus size={20} />
        Create Account
      </button>
    </div>
  </AuthLayout>;
};

const AuthLayout = ({ title, sub, error, onSubmit, children, footer }) => (
  <div style={{ 
    minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr',
    background: 'var(--bg-main)'
  }}>
    {/* Left Side: Brand Visual */}
    <div style={{ 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '60px', position: 'relative', display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', color: 'white', overflow: 'hidden'
    }}>
      {/* Abstract Background Elements */}
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'var(--primary)', filter: 'blur(120px)', opacity: 0.15 }}></div>
      <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'var(--secondary)', filter: 'blur(120px)', opacity: 0.15 }}></div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10 }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Compass size={24} />
        </div>
        <span className="brand-font" style={{ fontSize: '24px' }}>TravelSense</span>
      </div>

      <div style={{ zIndex: 10, maxWidth: '500px' }}>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: '56px', fontWeight: '800', lineHeight: '1.1', marginBottom: '24px' }}>
          Travel with <span className="gradient-text">Confidence.</span>
        </motion.h1>
        <p style={{ fontSize: '18px', color: '#94a3b8', lineHeight: '1.6' }}>
          The only platform you need for smart group expense tracking, real-time safety radar, and seamless trip planning.
        </p>
      </div>

      <div style={{ zIndex: 10 }}>
        <div style={{ display: 'flex', gap: '40px' }}>
           <div><p style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>10k+</p><p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Active Travelers</p></div>
           <div><p style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>50+</p><p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Destinations</p></div>
        </div>
      </div>
    </div>

    {/* Right Side: Form */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ width: '100%', maxWidth: '420px' }}
      >
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>{title}</h2>
          <p style={{ color: 'var(--text-muted)' }}>{sub}</p>
        </div>

        {error && (
          <div style={{ 
            padding: '12px 16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', 
            color: 'var(--danger)', fontSize: '14px', marginBottom: '24px',
            display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600'
          }}>
            <ShieldCheck size={18} /> {error}
          </div>
        )}

        <form onSubmit={onSubmit}>
          {children}
        </form>

        <div style={{ 
          marginTop: '40px', paddingTop: '32px', borderTop: '1px solid var(--border-light)',
          textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)'
        }}>
          {footer}
        </div>
      </motion.div>
    </div>
  </div>
);
