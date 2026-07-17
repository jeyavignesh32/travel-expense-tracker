// client/src/pages/Itinerary.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Calendar, MapPin, Clock, MoreVertical, 
  CheckCircle2, Circle, Navigation, Camera, Palmtree, Coffee, X, Sparkles
} from 'lucide-react';

import { SwipeItinerary } from '../components/SwipeItinerary';

export const Itinerary = () => {
  const [activeDay, setActiveDay] = useState(1);
  const [itinerary, setItinerary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showSwipe, setShowSwipe] = useState(false);
  const [formData, setFormData] = useState({
    name: '', type: 'Activity', day_number: 1, time_slot: '09:00 AM'
  });

  const fetchItinerary = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/itinerary/trip/1');
      setItinerary(res.data);
    } catch (err) {
      console.error('Connection failed, using mock itinerary.');
      setItinerary([
        { id: 1, day: 1, time: '09:00 AM', name: 'Arrival & Check-in', type: 'Transport', location: 'Goa Airport', status: 'completed' },
        { id: 2, day: 1, time: '01:00 PM', name: 'Lunch at Beach Shack', type: 'Food', location: 'Baga Beach', status: 'completed' },
        { id: 3, day: 1, time: '04:00 PM', name: 'Sunset Yoga', type: 'Activity', location: 'Anjuna Cliff', status: 'upcoming' },
        { id: 4, day: 2, time: '10:00 AM', name: 'Old Goa Tour', type: 'Historic', location: 'Basilica of Bom Jesus', status: 'upcoming' },
        { id: 5, day: 2, time: '02:00 PM', name: 'Spice Plantation Visit', type: 'Nature', location: 'Ponda', status: 'upcoming' },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItinerary();
    window.addEventListener('itinerary-updated', fetchItinerary);
    return () => {
      window.removeEventListener('itinerary-updated', fetchItinerary);
    };
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/itinerary', {
        ...formData, trip_id: 1
      });
      setShowAdd(false);
      setFormData({ name: '', type: 'Activity', day_number: activeDay, time_slot: '09:00 AM' });
      fetchItinerary();
    } catch (err) {
      // Mock fallback
      const newItem = {
        id: Date.now(),
        day: Number(formData.day_number),
        time: formData.time_slot,
        name: formData.name,
        type: formData.type,
        location: formData.name,
        status: 'upcoming'
      };
      setItinerary([...itinerary, newItem]);
      setShowAdd(false);
      setFormData({ name: '', type: 'Activity', day_number: activeDay, time_slot: '09:00 AM' });
    }
  };

  const deleteItineraryItem = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/itinerary/${id}`);
      fetchItinerary();
    } catch (err) {
      setItinerary(itinerary.filter(item => item.id !== id));
    }
  };

  const days = [1, 2, 3, 4, 5];

  const filteredItems = itinerary.filter(item => item.day === activeDay);

  const getTypeIcon = (type) => {
    switch(type) {
      case 'Food': return <Coffee size={18} />;
      case 'Activity': return <Palmtree size={18} />;
      case 'Transport': return <Navigation size={18} />;
      case 'Historic': return <Camera size={18} />;
      default: return <MapPin size={18} />;
    }
  };

  return (
    <div className="animate-entrance">
      {showSwipe && (
        <SwipeItinerary 
          onClose={() => setShowSwipe(false)} 
          onBuildComplete={() => fetchItinerary()} 
        />
      )}

      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Trip Timeline</h1>
          <p style={{ color: 'var(--text-muted)' }}>Organize your adventure day-by-day.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setShowSwipe(true)} 
            className="btn-premium"
            style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', border: 'none' }}
          >
            <Sparkles size={18} /> AI Swipe Builder
          </button>
          <button onClick={() => { setFormData({...formData, day_number: activeDay}); setShowAdd(true); }} className="btn-premium">
            <Plus size={18} /> Add Activity
          </button>
        </div>
      </header>

      {/* Day Selector */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', overflowX: 'auto', paddingBottom: '8px' }}>
        {days.map(day => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            style={{
              padding: '12px 24px', borderRadius: '16px', border: '1px solid var(--border-light)',
              background: activeDay === day ? 'var(--primary)' : 'var(--bg-surface)',
              color: activeDay === day ? 'white' : 'var(--text-main)',
              fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              minWidth: '100px', boxShadow: activeDay === day ? '0 8px 16px var(--primary-glow)' : 'var(--shadow-sm)'
            }}
          >
            Day {day}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      <div className="glass-card" style={{ padding: '32px', overflow: 'hidden' }}>
        <div style={{ position: 'relative' }}>
          {/* Vertical Line */}
          <div style={{ 
            position: 'absolute', left: '20px', top: '10px', bottom: '10px', 
            width: '2px', background: 'var(--border-light)', zIndex: 0 
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  style={{ display: 'flex', gap: '24px', position: 'relative', zIndex: 1 }}
                >
                  {/* Status Circle */}
                  <div style={{ 
                    width: '42px', height: '42px', borderRadius: '50%', 
                    background: item.status === 'completed' ? 'var(--success)' : 'var(--bg-surface)',
                    border: '2px solid', 
                    borderColor: item.status === 'completed' ? 'var(--success)' : 'var(--border-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)', color: item.status === 'completed' ? 'white' : 'var(--text-dim)'
                  }}>
                    {item.status === 'completed' ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', letterSpacing: '0.05em' }}>
                        {item.time}
                      </span>
                      <span style={{ 
                        fontSize: '11px', fontWeight: '700', padding: '2px 8px', 
                        borderRadius: '20px', background: 'var(--border-light)', color: 'var(--text-muted)',
                        textTransform: 'uppercase'
                      }}>
                        {item.type}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', margin: 0 }}>{item.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                          <MapPin size={14} /> {item.location}
                        </div>
                      </div>
                      <button onClick={() => deleteItineraryItem(item.id)} style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}>
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredItems.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                 <p>No activities planned for this day yet.</p>
                 <button onClick={() => { setFormData({...formData, day_number: activeDay}); setShowAdd(true); }} className="btn-text" style={{ color: 'var(--primary)', fontWeight: '600', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                   + Create one
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Activity Side Drawer */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, backdropFilter: 'blur(8px)' }}
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ 
                position: 'fixed', right: 0, top: 0, bottom: 0, width: '450px', 
                background: 'var(--bg-surface)', zIndex: 201, padding: '40px', 
                boxShadow: 'var(--shadow-lg)', borderLeft: '1px solid var(--border-light)',
                display: 'flex', flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                 <h2 style={{ fontSize: '24px' }}>Add Itinerary Activity</h2>
                 <button onClick={() => setShowAdd(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={24} />
                 </button>
              </div>

              <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Activity Name / Spot</label>
                  <input 
                    type="text" className="input-premium" required placeholder="E.g. Palolem Beach Walk"
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                   <div>
                     <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Type</label>
                     <select 
                       className="input-premium"
                       value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}
                     >
                       <option value="Activity">Activity</option>
                       <option value="Food">Food</option>
                       <option value="Transport">Transport</option>
                       <option value="Historic">Historic</option>
                       <option value="Place">Place</option>
                     </select>
                   </div>
                   <div>
                     <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Timeline Day</label>
                     <select 
                       className="input-premium"
                       value={formData.day_number} onChange={(e) => setFormData({...formData, day_number: Number(e.target.value)})}
                     >
                       {days.map(d => <option key={d} value={d}>Day {d}</option>)}
                     </select>
                   </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Scheduled Time</label>
                  <input 
                    type="text" className="input-premium" required placeholder="E.g. 10:00 AM or 04:30 PM"
                    value={formData.time_slot} onChange={(e) => setFormData({...formData, time_slot: e.target.value})}
                  />
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: '1px solid var(--border-light)', background: 'transparent', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" className="btn-premium" style={{ flex: 2 }}>Add to Timeline</button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

