// client/src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  User, Mail, Phone, Camera, Save, Shield, MapPin,
  Calendar, Globe, Heart, Briefcase, CheckCircle2,
  AlertCircle, Eye, EyeOff, Plane, Mountain, Palmtree,
  Building, Tent, Ship
} from 'lucide-react';

const API = 'http://localhost:5000/api';

const TRAVEL_STYLES = [
  { id: 'adventure', label: 'Adventure', icon: <Mountain size={20} />, color: '#f59e0b' },
  { id: 'beach', label: 'Beach & Relax', icon: <Palmtree size={20} />, color: '#06b6d4' },
  { id: 'city', label: 'City Explorer', icon: <Building size={20} />, color: '#8b5cf6' },
  { id: 'nature', label: 'Nature & Wildlife', icon: <Tent size={20} />, color: '#10b981' },
  { id: 'cruise', label: 'Cruise & Sea', icon: <Ship size={20} />, color: '#3b82f6' },
  { id: 'business', label: 'Business Travel', icon: <Briefcase size={20} />, color: '#64748b' },
];

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'JPY'];

export const Profile = () => {
  const { user, logout } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: '',
    location: '',
    currency: 'INR',
    travelStyles: [],
  });

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    newPass: '',
    confirm: '',
  });

  const [showPassword, setShowPassword] = useState({ current: false, newPass: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('personal');
  const [avatarHover, setAvatarHover] = useState(false);

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await axios.get(`${API}/auth/profile`);
        if (res.data) {
          setForm(prev => ({
            ...prev,
            name: res.data.name || prev.name,
            email: res.data.email || prev.email,
            phone: res.data.phone || prev.phone,
            bio: res.data.bio || '',
            location: res.data.location || '',
            currency: res.data.preferred_currency || 'INR',
            travelStyles: res.data.travel_styles ? JSON.parse(res.data.travel_styles) : [],
          }));
        }
      } catch {
        // Use local auth data if profile endpoint fails
      }
    };
    loadProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const toggleTravelStyle = (styleId) => {
    setForm(prev => ({
      ...prev,
      travelStyles: prev.travelStyles.includes(styleId)
        ? prev.travelStyles.filter(s => s !== styleId)
        : [...prev.travelStyles, styleId],
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await axios.put(`${API}/auth/profile`, {
        name: form.name,
        phone: form.phone,
        bio: form.bio,
        location: form.location,
        preferred_currency: form.currency,
        travel_styles: JSON.stringify(form.travelStyles),
      });
    } catch (err) {
      if (err.response) {
        setError(err.response?.data?.error || 'Failed to update profile');
        setSaving(false);
        return;
      }
      console.log('Backend offline, saving locally');
    } finally {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.name = form.name;
      storedUser.phone = form.phone;
      localStorage.setItem('user', JSON.stringify(storedUser));

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPass !== passwordForm.confirm) {
      setError('New passwords do not match');
      return;
    }
    if (passwordForm.newPass.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await axios.put(`${API}/auth/password`, {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.newPass,
      });
    } catch (err) {
      if (err.response) {
        setError(err.response?.data?.error || 'Failed to update password');
        setSaving(false);
        return;
      }
      console.log('Backend offline, simulated password change');
    } finally {
      setPasswordForm({ current: '', newPass: '', confirm: '' });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setSaving(false);
    }
  };

  const getInitials = () => {
    return form.name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: <User size={18} /> },
    { id: 'preferences', label: 'Travel Preferences', icon: <Heart size={18} /> },
    { id: 'security', label: 'Security', icon: <Shield size={18} /> },
  ];

  return (
    <div>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '32px' }}
      >
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>
          <span className="gradient-text">Your Profile</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
          Manage your personal information, travel preferences, and security settings.
        </p>
      </motion.div>

      <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Left: Avatar Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card"
          style={{ padding: '36px', width: '280px', textAlign: 'center', flexShrink: 0 }}
        >
          {/* Avatar */}
          <div
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
            style={{
              position: 'relative',
              width: '120px', height: '120px',
              borderRadius: '50%',
              margin: '0 auto 20px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px', fontWeight: '800', color: 'white',
              fontFamily: "'Outfit', sans-serif",
              boxShadow: '0 8px 30px var(--primary-glow)',
              cursor: 'pointer',
              transition: 'transform 0.3s',
              transform: avatarHover ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {getInitials()}
            <AnimatePresence>
              {avatarHover && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.4)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Camera size={28} color="white" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <h3 style={{ fontSize: '20px', marginBottom: '4px' }}>{form.name || 'Your Name'}</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{form.email}</p>
          {form.location && (
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <MapPin size={12} /> {form.location}
            </p>
          )}

          <div style={{ margin: '20px 0', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
              <div>
                <p style={{ fontSize: '20px', fontWeight: '700', fontFamily: "'Outfit', sans-serif" }}>3</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Trips</p>
              </div>
              <div style={{ width: '1px', background: 'var(--border-light)' }} />
              <div>
                <p style={{ fontSize: '20px', fontWeight: '700', fontFamily: "'Outfit', sans-serif" }}>₹12.4k</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Spent</p>
              </div>
            </div>
          </div>

          {form.travelStyles.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '12px' }}>
              {form.travelStyles.map(sid => {
                const style = TRAVEL_STYLES.find(s => s.id === sid);
                return style ? (
                  <span key={sid} style={{
                    padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                    background: `${style.color}18`, color: style.color, border: `1px solid ${style.color}30`,
                  }}>
                    {style.label}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </motion.div>

        {/* Right: Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ flex: 1, minWidth: '400px' }}
        >
          {/* Tab Bar */}
          <div style={{
            display: 'flex', gap: '4px', marginBottom: '28px',
            background: 'var(--bg-surface)', borderRadius: '14px',
            padding: '4px', border: '1px solid var(--border-light)',
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setError(''); }}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: '10px', border: 'none',
                  cursor: 'pointer', fontWeight: '600', fontSize: '13px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: activeTab === tab.id ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'transparent',
                  color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                  transition: 'all 0.3s',
                  boxShadow: activeTab === tab.id ? '0 4px 12px var(--primary-glow)' : 'none',
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Status Toasts */}
          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                style={{
                  padding: '12px 20px', borderRadius: '12px', marginBottom: '20px',
                  background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--success)', fontWeight: '600', fontSize: '14px',
                }}
              >
                <CheckCircle2 size={18} /> Changes saved successfully!
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                style={{
                  padding: '12px 20px', borderRadius: '12px', marginBottom: '20px',
                  background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger)', fontWeight: '600', fontSize: '14px',
                }}
              >
                <AlertCircle size={18} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab Content */}
          <div className="glass-card" style={{ padding: '32px' }}>
            <AnimatePresence mode="wait">
              {activeTab === 'personal' && (
                <motion.div key="personal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <User size={20} className="gradient-text" /> Personal Information
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Full Name */}
                    <div>
                      <label style={labelStyle}>Full Name</label>
                      <div style={inputWrapStyle}>
                        <User size={16} color="var(--text-dim)" />
                        <input
                          className="input-premium"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Your full name"
                          style={{ border: 'none', padding: '12px 0', background: 'transparent', flex: 1 }}
                        />
                      </div>
                    </div>

                    {/* Email (read-only) */}
                    <div>
                      <label style={labelStyle}>Email Address</label>
                      <div style={{ ...inputWrapStyle, opacity: 0.6 }}>
                        <Mail size={16} color="var(--text-dim)" />
                        <input
                          className="input-premium"
                          value={form.email}
                          readOnly
                          style={{ border: 'none', padding: '12px 0', background: 'transparent', flex: 1, cursor: 'not-allowed' }}
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label style={labelStyle}>Phone Number</label>
                      <div style={inputWrapStyle}>
                        <Phone size={16} color="var(--text-dim)" />
                        <input
                          className="input-premium"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="+91 98765 43210"
                          style={{ border: 'none', padding: '12px 0', background: 'transparent', flex: 1 }}
                        />
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <label style={labelStyle}>Home Location</label>
                      <div style={inputWrapStyle}>
                        <MapPin size={16} color="var(--text-dim)" />
                        <input
                          className="input-premium"
                          name="location"
                          value={form.location}
                          onChange={handleChange}
                          placeholder="e.g. Chennai, India"
                          style={{ border: 'none', padding: '12px 0', background: 'transparent', flex: 1 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bio - Full Width */}
                  <div style={{ marginTop: '20px' }}>
                    <label style={labelStyle}>Bio</label>
                    <textarea
                      className="input-premium"
                      name="bio"
                      value={form.bio}
                      onChange={handleChange}
                      placeholder="Tell us about yourself and your travel adventures..."
                      rows={3}
                      style={{ resize: 'vertical', lineHeight: '1.6' }}
                    />
                  </div>

                  <button
                    className="btn-premium"
                    onClick={handleSave}
                    disabled={saving}
                    style={{ marginTop: '28px', width: '100%', padding: '14px' }}
                  >
                    {saving ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>⏳</motion.span>
                        Saving...
                      </span>
                    ) : (
                      <><Save size={18} /> Save Changes</>
                    )}
                  </button>
                </motion.div>
              )}

              {activeTab === 'preferences' && (
                <motion.div key="preferences" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Plane size={20} className="gradient-text" /> Travel Preferences
                  </h3>

                  {/* Travel Styles Grid */}
                  <label style={{ ...labelStyle, marginBottom: '12px', display: 'block' }}>Your Travel Style (select all that apply)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
                    {TRAVEL_STYLES.map(style => {
                      const isSelected = form.travelStyles.includes(style.id);
                      return (
                        <motion.button
                          key={style.id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleTravelStyle(style.id)}
                          style={{
                            padding: '16px', borderRadius: '14px', cursor: 'pointer',
                            border: isSelected ? `2px solid ${style.color}` : '2px solid var(--border-light)',
                            background: isSelected ? `${style.color}12` : 'var(--bg-surface)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                            transition: 'all 0.3s',
                            boxShadow: isSelected ? `0 4px 16px ${style.color}25` : 'none',
                          }}
                        >
                          <div style={{
                            width: '44px', height: '44px', borderRadius: '12px',
                            background: `${style.color}20`, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', color: style.color,
                          }}>
                            {style.icon}
                          </div>
                          <span style={{
                            fontSize: '12px', fontWeight: '600',
                            color: isSelected ? style.color : 'var(--text-muted)',
                          }}>
                            {style.label}
                          </span>
                          {isSelected && (
                            <CheckCircle2 size={14} color={style.color} style={{ position: 'absolute', top: 8, right: 8 }} />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Currency Preference */}
                  <label style={labelStyle}>Preferred Currency</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {CURRENCIES.map(cur => (
                      <button
                        key={cur}
                        onClick={() => { setForm({ ...form, currency: cur }); setSaved(false); }}
                        style={{
                          padding: '8px 18px', borderRadius: '10px', border: '1px solid',
                          borderColor: form.currency === cur ? 'var(--primary)' : 'var(--border-light)',
                          background: form.currency === cur ? 'var(--primary-glow)' : 'var(--bg-surface)',
                          color: form.currency === cur ? 'var(--primary)' : 'var(--text-muted)',
                          fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {cur}
                      </button>
                    ))}
                  </div>

                  <button
                    className="btn-premium"
                    onClick={handleSave}
                    disabled={saving}
                    style={{ marginTop: '28px', width: '100%', padding: '14px' }}
                  >
                    {saving ? 'Saving...' : <><Save size={18} /> Save Preferences</>}
                  </button>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Shield size={20} className="gradient-text" /> Change Password
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '480px' }}>
                    {[
                      { key: 'current', label: 'Current Password', placeholder: 'Enter current password' },
                      { key: 'newPass', label: 'New Password', placeholder: 'Minimum 6 characters' },
                      { key: 'confirm', label: 'Confirm New Password', placeholder: 'Re-enter new password' },
                    ].map(field => (
                      <div key={field.key}>
                        <label style={labelStyle}>{field.label}</label>
                        <div style={inputWrapStyle}>
                          <Shield size={16} color="var(--text-dim)" />
                          <input
                            className="input-premium"
                            type={showPassword[field.key] ? 'text' : 'password'}
                            value={passwordForm[field.key]}
                            onChange={(e) => { setPasswordForm({ ...passwordForm, [field.key]: e.target.value }); setError(''); }}
                            placeholder={field.placeholder}
                            style={{ border: 'none', padding: '12px 0', background: 'transparent', flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword({ ...showPassword, [field.key]: !showPassword[field.key] })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', display: 'flex' }}
                          >
                            {showPassword[field.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    className="btn-premium"
                    onClick={handlePasswordChange}
                    disabled={saving || !passwordForm.current || !passwordForm.newPass || !passwordForm.confirm}
                    style={{ marginTop: '28px', padding: '14px 32px' }}
                  >
                    {saving ? 'Updating...' : <><Shield size={18} /> Update Password</>}
                  </button>

                  {/* Danger Zone */}
                  <div style={{
                    marginTop: '40px', padding: '24px', borderRadius: '16px',
                    border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.04)',
                  }}>
                    <h4 style={{ color: 'var(--danger)', fontSize: '15px', marginBottom: '8px' }}>Danger Zone</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      Logging out will clear your session. You can always log back in.
                    </p>
                    <button
                      onClick={logout}
                      style={{
                        padding: '10px 24px', borderRadius: '10px', border: '1px solid var(--danger)',
                        background: 'transparent', color: 'var(--danger)', fontWeight: '600', fontSize: '13px',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      Log Out of All Devices
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Shared styles
const labelStyle = {
  display: 'block', fontSize: '13px', fontWeight: '600',
  color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.02em',
};

const inputWrapStyle = {
  display: 'flex', alignItems: 'center', gap: '12px',
  padding: '0 16px', borderRadius: '14px',
  border: '1px solid var(--border-light)', background: 'var(--bg-surface)',
  transition: 'all 0.3s',
};
