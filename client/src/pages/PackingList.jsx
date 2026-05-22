// client/src/pages/PackingList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, CheckSquare, Square, Trash2, Filter, 
  ShoppingBag, Briefcase, Pill, Shirt, Camera
} from 'lucide-react';

export const PackingList = () => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [newCat, setNewCat] = useState('Clothing');
  const [loading, setLoading] = useState(true);

  const stats = {
    total: items.length,
    packed: items.filter(i => i.packed).length,
    percent: items.length ? Math.round((items.filter(i => i.packed).length / items.length) * 100) : 0
  };

  const fetchItems = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/packing/trip/1');
      // Ensure packed matches boolean true/false
      const formatted = res.data.map(item => ({
        ...item,
        packed: !!item.packed
      }));
      setItems(formatted);
    } catch (err) {
      console.error('Connection failed, showing mock checklist.');
      setItems([
        { id: 1, name: 'Passport & Visas', category: 'Documents', packed: true },
        { id: 2, name: 'Power Bank', category: 'Electronics', packed: true },
        { id: 3, name: 'Beach Towel', category: 'Clothing', packed: false },
        { id: 4, name: 'First Aid Kit', category: 'Meds', packed: false },
        { id: 5, name: 'Sunscreen', category: 'Toiletries', packed: false },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
    window.addEventListener('packing-updated', fetchItems);
    return () => {
      window.removeEventListener('packing-updated', fetchItems);
    };
  }, []);

  const togglePacked = async (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    try {
      await axios.put(`http://localhost:5000/api/packing/${id}`, { packed: !item.packed });
      fetchItems();
    } catch (err) {
      setItems(items.map(item => item.id === id ? { ...item, packed: !item.packed } : item));
    }
  };

  const deleteItem = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/packing/${id}`);
      fetchItems();
    } catch (err) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItem) return;
    try {
      await axios.post('http://localhost:5000/api/packing', { 
        trip_id: 1, name: newItem, category: newCat 
      });
      setNewItem('');
      fetchItems();
    } catch (err) {
      setItems([...items, { id: Date.now(), name: newItem, category: newCat, packed: false }]);
      setNewItem('');
    }
  };

  return (
    <div className="animate-entrance">
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Packing Checklist</h1>
        <p style={{ color: 'var(--text-muted)' }}>Don't leave the essentials behind.</p>
      </header>

      <div className="bento-grid" style={{ marginBottom: '40px' }}>
        {/* Progress Card */}
        <div className="glass-card bento-item-4" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
             <h3 style={{ fontSize: '16px', color: 'var(--text-muted)' }}>Ready for Trip</h3>
             <span style={{ fontWeight: '800', fontSize: '24px', color: 'var(--primary)' }}>{stats.percent}%</span>
          </div>
          <div style={{ height: '8px', background: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${stats.percent}%` }}
               style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }}
             />
          </div>
          <p style={{ fontSize: '13px', marginTop: '12px', color: 'var(--text-dim)' }}>
            {stats.packed} of {stats.total} items packed
          </p>
        </div>

        {/* Add Item Form */}
        <div className="glass-card bento-item-8" style={{ padding: '24px' }}>
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-muted)' }}>Add New Item</label>
              <input 
                className="input-premium" 
                placeholder="E.g. Camera Gear"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
              />
            </div>
            <div style={{ width: '180px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-muted)' }}>Category</label>
              <select 
                className="input-premium"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
              >
                <option>Clothing</option>
                <option>Documents</option>
                <option>Electronics</option>
                <option>Meds</option>
                <option>Toiletries</option>
              </select>
            </div>
            <button type="submit" className="btn-premium" style={{ height: '52px' }}>
              <Plus size={20} />
            </button>
          </form>
        </div>
      </div>

      {/* Checklist List */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <AnimatePresence>
          {items.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', borderRadius: '14px', marginBottom: '8px',
                background: item.packed ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                transition: 'background 0.3s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                  onClick={() => togglePacked(item.id)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: item.packed ? 'var(--success)' : 'var(--text-dim)' }}
                >
                  {item.packed ? <CheckSquare size={24} /> : <Square size={24} />}
                </button>
                <div>
                  <h4 style={{ 
                    fontSize: '16px', margin: 0, 
                    textDecoration: item.packed ? 'line-through' : 'none',
                    color: item.packed ? 'var(--text-dim)' : 'var(--text-main)',
                    transition: 'all 0.3s'
                  }}>
                    {item.name}
                  </h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                    {item.category}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => deleteItem(item.id)}
                style={{ border: 'none', background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer', opacity: 0.5 }}
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-dim)' }}>
             <ShoppingBag size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
             <p>Your packing list is empty. Start adding items!</p>
          </div>
        )}
      </div>
    </div>
  );
};
