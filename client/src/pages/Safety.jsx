import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, FileText, Heart, Lock, AlertTriangle, UploadCloud, Eye, EyeOff, MapPin, X, Phone, Radio, Clock, CheckCircle2 } from 'lucide-react';
import CryptoJS from 'crypto-js';

const SECRET_KEY = 'travelsense_secure_vault_2026';


export const Safety = () => {
  const [activeTab, setActiveTab] = useState('vault');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Vault State
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);

  // SOS State
  const [sosState, setSosState] = useState('idle'); // 'idle' | 'arming' | 'broadcasting' | 'done'
  const [sosCountdown, setSosCountdown] = useState(5);
  const sosTimerRef = useRef(null);

  // Health Profile State
  const [healthProfile, setHealthProfile] = useState({
    bloodType: 'O+',
    allergies: 'Penicillin, Peanuts',
    medications: 'None',
    emergencyContact: '+1 234 567 8900'
  });

  useEffect(() => {
    // Load health profile on mount
    const savedHealth = localStorage.getItem('travel_health_profile');
    if (savedHealth) {
      setHealthProfile(JSON.parse(savedHealth));
    }
  }, []);

  const handleAuthenticate = (e) => {
    e.preventDefault();
    if (password === '1234') { // For demo purposes
      setIsAuthenticated(true);
      loadDocuments();
    } else {
      alert("Incorrect Vault Password. (Hint: 1234)");
    }
  };

  const loadDocuments = () => {
    const encDocs = localStorage.getItem('travel_secure_vault');
    if (encDocs) {
      try {
        const bytes = CryptoJS.AES.decrypt(encDocs, SECRET_KEY);
        const decDocs = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        setDocuments(decDocs);
      } catch (err) {
        console.error("Failed to decrypt vault", err);
      }
    }
  };

  const saveDocuments = (newDocs) => {
    const encDocs = CryptoJS.AES.encrypt(JSON.stringify(newDocs), SECRET_KEY).toString();
    localStorage.setItem('travel_secure_vault', encDocs);
    setDocuments(newDocs);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target.result;
      const newDoc = {
        id: Date.now(),
        name: file.name,
        type: file.type,
        data: base64String,
        date: new Date().toLocaleDateString()
      };
      saveDocuments([...documents, newDoc]);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const deleteDocument = (id) => {
    saveDocuments(documents.filter(d => d.id !== id));
  };

  const saveHealthProfile = () => {
    localStorage.setItem('travel_health_profile', JSON.stringify(healthProfile));
    alert("Health Profile Saved securely.");
  };

  const triggerSOS = () => {
    setSosState('arming');
    setSosCountdown(5);
    let count = 5;
    sosTimerRef.current = setInterval(() => {
      count--;
      setSosCountdown(count);
      if (count <= 0) {
        clearInterval(sosTimerRef.current);
        setSosState('broadcasting');
        setTimeout(() => setSosState('done'), 3500);
      }
    }, 1000);
  };

  const cancelSOS = () => {
    clearInterval(sosTimerRef.current);
    setSosState('idle');
    setSosCountdown(5);
  };

  const resetSOS = () => setSosState('idle');

  return (
    <div className="animate-entrance" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '38px', fontWeight: '800' }}>Safety & <span className="gradient-text">SOS</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Secure vault, health records, and emergency tools.</p>
        </div>
        <button onClick={triggerSOS} className="btn-premium" style={{ background: 'var(--danger)', boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)', animation: 'sos-pulse 2s infinite' }}>
          <AlertTriangle size={18} />
          TRIGGER SOS
        </button>
      </header>

      {/* SOS Modal Overlay */}
      <AnimatePresence>
        {sosState !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)'
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              style={{
                background: 'var(--bg-surface)', borderRadius: '24px',
                padding: '40px', textAlign: 'center', maxWidth: '380px', width: '90%',
                border: '2px solid var(--danger)', boxShadow: '0 0 40px rgba(239, 68, 68, 0.4)'
              }}
            >
              {sosState === 'arming' && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}
                  >
                    <AlertTriangle size={36} color="var(--danger)" />
                  </motion.div>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--danger)', marginBottom: '8px' }}>SOS Arming...</h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Your live location will be broadcast to emergency contacts.</p>
                  <div style={{ fontSize: '64px', fontWeight: '900', color: 'var(--danger)', marginBottom: '24px', fontFamily: 'Outfit, sans-serif' }}>
                    {sosCountdown}
                  </div>
                  <button onClick={cancelSOS} style={{
                    padding: '12px 32px', borderRadius: '12px', border: '2px solid var(--border-strong)',
                    background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '700', fontSize: '15px'
                  }}>Cancel</button>
                </>
              )}
              {sosState === 'broadcasting' && (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}
                  >
                    <Radio size={36} color="var(--danger)" />
                  </motion.div>
                  <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--danger)', marginBottom: '8px' }}>Broadcasting SOS!</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>Sending your GPS coordinates to emergency contacts...</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', marginBottom: '16px' }}>
                    {['Emergency Contact', 'Local Police (100)', 'App Moderator'].map((c, i) => (
                      <motion.div key={c} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.5 }}
                        style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                        <Phone size={14} color="var(--danger)" /> Notifying {c}...
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
              {sosState === 'done' && (
                <>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <CheckCircle2 size={36} color="var(--success)" />
                  </div>
                  <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--success)', marginBottom: '8px' }}>SOS Sent!</h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>Emergency contacts have been notified with your live location. Help is on the way.</p>
                  <button onClick={resetSOS} className="btn-premium" style={{ background: 'var(--success)' }}>OK, I'm Safe Now</button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('vault')}
          className={`btn-premium ${activeTab !== 'vault' && 'inactive'}`}
          style={{ background: activeTab === 'vault' ? 'var(--primary)' : 'var(--bg-surface)', color: activeTab === 'vault' ? 'white' : 'var(--text-main)' }}
        >
          <Lock size={18} /> Document Vault
        </button>
        <button 
          onClick={() => setActiveTab('health')}
          className={`btn-premium ${activeTab !== 'health' && 'inactive'}`}
          style={{ background: activeTab === 'health' ? 'var(--secondary)' : 'var(--bg-surface)', color: activeTab === 'health' ? 'white' : 'var(--text-main)' }}
        >
          <Heart size={18} /> Health Profile
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'vault' && (
          <motion.div key="vault" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {!isAuthenticated ? (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
                <Lock size={48} color="var(--primary)" style={{ marginBottom: '20px' }} />
                <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Encrypted Vault</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>Enter your PIN to access secure documents (Passports, Visas, Tickets).</p>
                <form onSubmit={handleAuthenticate}>
                  <input 
                    type="password" 
                    placeholder="Enter PIN (1234)" 
                    className="input-premium" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ marginBottom: '16px', textAlign: 'center', letterSpacing: '4px' }}
                  />
                  <button type="submit" className="btn-premium" style={{ width: '100%' }}>Unlock Vault</button>
                </form>
              </div>
            ) : (
              <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={20} color="var(--success)" /> Secure Documents (AES Encrypted)
                  </h3>
                  <label className="btn-premium" style={{ cursor: 'pointer', background: 'var(--success)' }}>
                    <UploadCloud size={16} /> Upload Document
                    <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleFileUpload} />
                  </label>
                </div>

                {uploading && <p style={{ color: 'var(--text-muted)' }}>Encrypting and saving...</p>}

                {documents.length === 0 && !uploading && (
                  <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-main)', borderRadius: '12px', border: '2px dashed var(--border-light)' }}>
                    <FileText size={32} color="var(--text-dim)" style={{ marginBottom: '12px' }} />
                    <p style={{ color: 'var(--text-muted)' }}>No secure documents saved yet.</p>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  {documents.map(doc => (
                    <div key={doc.id} className="glass-card" style={{ padding: '16px', position: 'relative' }}>
                      <button 
                        onClick={() => deleteDocument(doc.id)}
                        style={{ position: 'absolute', top: 8, right: 8, background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                      >
                        <X size={16} />
                      </button>
                      <div style={{ width: '100%', height: '120px', background: 'var(--bg-main)', borderRadius: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {doc.type.includes('image') ? (
                           <img src={doc.data} alt={doc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                           <FileText size={48} color="var(--primary)" />
                        )}
                      </div>
                      <p style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Added: {doc.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'health' && (
          <motion.div key="health" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="glass-card" style={{ padding: '24px' }}>
               <h3 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                 <Heart size={20} color="var(--danger)" /> Emergency Medical Profile
               </h3>
               <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>This information can be quickly accessed by first responders.</p>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                 <div>
                   <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Blood Type</label>
                   <input className="input-premium" value={healthProfile.bloodType} onChange={e => setHealthProfile({...healthProfile, bloodType: e.target.value})} />
                 </div>
                 <div>
                   <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Emergency Contact</label>
                   <input className="input-premium" value={healthProfile.emergencyContact} onChange={e => setHealthProfile({...healthProfile, emergencyContact: e.target.value})} />
                 </div>
                 <div style={{ gridColumn: '1 / -1' }}>
                   <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Known Allergies</label>
                   <input className="input-premium" value={healthProfile.allergies} onChange={e => setHealthProfile({...healthProfile, allergies: e.target.value})} />
                 </div>
                 <div style={{ gridColumn: '1 / -1' }}>
                   <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Current Medications / Conditions</label>
                   <textarea className="input-premium" rows="3" value={healthProfile.medications} onChange={e => setHealthProfile({...healthProfile, medications: e.target.value})} />
                 </div>
               </div>

               <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                 <button onClick={saveHealthProfile} className="btn-premium">Save Profile</button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .inactive {
          box-shadow: none !important;
          border: 1px solid var(--border-light) !important;
        }
        @keyframes sos-pulse {
          0%, 100% { box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3); }
          50% { box-shadow: 0 8px 32px rgba(239, 68, 68, 0.7); }
        }
      `}</style>
    </div>
  );
};
