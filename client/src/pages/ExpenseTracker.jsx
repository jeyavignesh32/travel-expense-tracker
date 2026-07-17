// client/src/pages/ExpenseTracker.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import ReceiptScanner from '../components/ReceiptScanner';
import { 
  Plus, Receipt, Filter, DollarSign, Calendar, Tag, Trash2, 
  Scan, Loader2, CheckCircle, ChevronDown, Search, X, Coffee, Navigation, Palmtree, Home, ShoppingBag
} from 'lucide-react';

const CATEGORIES = ['Food', 'Transport', 'Hotel', 'Shopping', 'Other'];

export const ExpenseTracker = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [showFilter, setShowFilter] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [currency, setCurrency] = useState(() => {
    const savedData = localStorage.getItem('travel_settings');
    if (savedData) {
      try {
        return JSON.parse(savedData).currency || 'INR';
      } catch (e) {}
    }
    return 'INR';
  });
  const SQUAD_MEMBERS = ['You', 'Rahul S', 'Sneha K.', 'Priya'];
  const [formData, setFormData] = useState({
    amount: '', category: 'Food', description: '', expense_date: new Date().toISOString().split('T')[0],
    split_with: ['You', 'Rahul S', 'Sneha K.', 'Priya']
  });

  useEffect(() => {
    const handleSettingsUpdate = () => {
      const savedData = localStorage.getItem('travel_settings');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.currency) setCurrency(parsed.currency);
        } catch (e) {}
      }
    };
    window.addEventListener('settings-updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('settings-updated', handleSettingsUpdate);
    };
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/expenses/trip/1`); 
      setExpenses(res.data);
    } catch (err) {
      console.error('Connection failed, showing mock data.');
      setExpenses([
        { id: 1, amount: 450, category: 'Food', description: 'Beach Lunch', expense_date: '2026-04-22', payer_name: user?.name || 'You' },
        { id: 2, amount: 1200, category: 'Transport', description: 'Taxi to Baga', expense_date: '2026-04-22', payer_name: user?.name || 'You' },
        { id: 3, amount: 5000, category: 'Hotel', description: 'Resort Stay', expense_date: '2026-04-21', payer_name: 'Rahul S.' },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => { 
    fetchExpenses(); 
    window.addEventListener('expense-updated', fetchExpenses);
    return () => {
      window.removeEventListener('expense-updated', fetchExpenses);
    };
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/expenses', { 
        ...formData, trip_id: 1, payer_id: user.id 
      });
      setShowAdd(false);
      setFormData({ amount: '', category: 'Food', description: '', expense_date: new Date().toISOString().split('T')[0], split_with: ['You', 'Rahul S', 'Sneha K.', 'Priya'] });
      fetchExpenses();
    } catch (err) {
      // Mock add for demo
      const newExp = { ...formData, id: Date.now(), payer_name: user.name };
      setExpenses([newExp, ...expenses]);
      setShowAdd(false);
    }
  };

  const deleteExpense = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  const convertCurrency = (amount) => {
    const rates = { INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0094 };
    const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
    const val = (amount * rates[currency]).toFixed(0);
    return `${symbols[currency]}${val}`;
  };

  const handleScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    const formDataObj = new FormData();
    formDataObj.append('receipt', file);

    try {
      const res = await axios.post('http://localhost:5000/api/expenses/ocr', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({
        ...formData,
        amount: res.data.amount || '',
        description: res.data.description || 'Auto-scanned Receipt',
        category: CATEGORIES.includes(res.data.category) ? res.data.category : 'Other'
      });
    } catch (err) {
      console.error('OCR scan failed', err);
      // Fallback
      setFormData({
        ...formData,
        amount: (Math.random() * 500 + 100).toFixed(2),
        description: 'Auto-scanned Receipt (Fallback)',
        category: CATEGORIES[Math.floor(Math.random() * 3)]
      });
    }
    setIsScanning(false);
  };

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.description?.toLowerCase().includes(searchQuery.toLowerCase()) || e.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterCat === 'All' || e.category === filterCat;
    return matchesSearch && matchesFilter;
  });

  const getCatIcon = (cat) => {
    switch(cat) {
      case 'Food': return <Coffee size={18} />;
      case 'Transport': return <Navigation size={18} />;
      case 'Hotel': return <Home size={18} />;
      case 'Shopping': return <ShoppingBag size={18} />;
      default: return <Tag size={18} />;
    }
  };

  return (
    <div className="animate-entrance">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '38px', fontWeight: '800' }}>Travel <span className="gradient-text">Expenses</span></h1>
          <p style={{ color: 'var(--text-muted)' }}>Keep your adventure within budget.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowScanner(true)} className="btn-secondary" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-light)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '14px', fontWeight: 'bold' }}>
            <Scan size={20} className="text-blue-400" />
            AI Scanner
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-premium">
            <Plus size={20} />
            Log Expense
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showScanner && (
          <ReceiptScanner 
            onCancel={() => setShowScanner(false)}
            onScanComplete={(result) => {
              setShowScanner(false);
              setFormData({ ...formData, amount: result.totalClaimed.toFixed(2), description: 'Scanned Items' });
              setShowAdd(true);
            }} 
          />
        )}
      </AnimatePresence>

      {/* Action Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
         <div className="glass-card" style={{ flex: 1, padding: '0 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Search size={18} color="var(--text-dim)" />
            <input 
              style={{ border: 'none', background: 'transparent', width: '100%', padding: '14px 0', outline: 'none', color: 'var(--text-main)', fontSize: '15px' }}
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
         
         <div style={{ position: 'relative' }}>
           <button 
             onClick={() => setShowFilter(!showFilter)}
             className="glass-card" style={{ padding: '0 20px', height: '100%', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: 'none' }}>
              <Filter size={18} />
              <span style={{ fontWeight: '600', fontSize: '14px' }}>{filterCat === 'All' ? 'Filter' : filterCat}</span>
           </button>
           <AnimatePresence>
             {showFilter && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                 style={{ 
                   position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '160px', 
                   background: 'var(--bg-surface)', border: '1px solid var(--border-light)', 
                   borderRadius: '12px', padding: '8px', boxShadow: 'var(--shadow-lg)', zIndex: 105,
                   display: 'flex', flexDirection: 'column', gap: '4px'
                 }}
               >
                 {['All', ...CATEGORIES].map(c => (
                   <button 
                     key={c}
                     onClick={() => { setFilterCat(c); setShowFilter(false); }}
                     style={{ 
                       padding: '10px 12px', textAlign: 'left', background: c === filterCat ? 'var(--primary-glow)' : 'transparent', 
                       color: c === filterCat ? 'var(--primary)' : 'var(--text-main)',
                       border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' 
                     }}
                   >
                     {c}
                   </button>
                 ))}
               </motion.div>
             )}
           </AnimatePresence>
         </div>

         <div className="glass-card" style={{ padding: '0 16px', display: 'flex', alignItems: 'center' }}>
            <select 
              value={currency} onChange={(e) => setCurrency(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: '700', color: 'var(--text-main)' }}
            >
               <option value="INR">INR (₹)</option>
               <option value="USD">USD ($)</option>
               <option value="EUR">EUR (€)</option>
               <option value="GBP">GBP (£)</option>
            </select>
         </div>
      </div>

      {/* Expenses Table */}
      <div className="glass-card" style={{ padding: '12px' }}>
         <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', color: 'var(--text-dim)', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span style={{ flex: 2 }}>Transaction</span>
            <span style={{ flex: 1 }}>Category</span>
            <span style={{ flex: 1 }}>Date</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Amount</span>
            <span style={{ width: '40px' }}></span>
         </div>
         
         <AnimatePresence>
            {filteredExpenses.map((expense, i) => (
              <motion.div 
                key={expense.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="expense-row"
                style={{ 
                  display: 'flex', alignItems: 'center', padding: '16px 24px', 
                  borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s'
                }}
              >
                 <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ 
                      width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-surface)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)', color: 'var(--primary)'
                    }}>
                       {getCatIcon(expense.category)}
                    </div>
                    <div>
                       <p style={{ fontWeight: '600', margin: 0 }}>{expense.description || 'General Expense'}</p>
                       <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: 0 }}>Logged by {expense.payer_name}</p>
                       {expense.split_with && expense.split_with.length > 0 && (
                          <p style={{ fontSize: '11px', color: 'var(--primary)', margin: '4px 0 0 0', fontWeight: '500' }}>
                            👥 Split: {expense.split_with.map(name => name === user?.name ? 'You' : name).join(', ')}
                          </p>
                        )}
                    </div>
                 </div>
                 <div style={{ flex: 1 }}>
                    <span style={{ 
                      fontSize: '11px', fontWeight: '700', padding: '4px 10px', 
                      borderRadius: '8px', background: 'var(--border-light)', color: 'var(--text-muted)'
                    }}>
                       {expense.category}
                    </span>
                 </div>
                 <div style={{ flex: 1, color: 'var(--text-muted)', fontSize: '14px' }}>
                    {expense.expense_date}
                 </div>
                 <div style={{ flex: 1, textAlign: 'right', fontWeight: '700', fontSize: '16px' }}>
                    {convertCurrency(expense.amount)}
                 </div>
                 <div style={{ width: '40px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => deleteExpense(expense.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--danger)' }}>
                       <Trash2 size={16} />
                    </button>
                 </div>
              </motion.div>
            ))}
         </AnimatePresence>
         
         {filteredExpenses.length === 0 && (
           <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-dim)' }}>
              <Receipt size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p>No transactions found matching your criteria.</p>
           </div>
         )}
      </div>

      {/* Add Expense Side Drawer */}
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
                 <h2 style={{ fontSize: '24px' }}>Log New Expense</h2>
                 <button onClick={() => setShowAdd(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={24} />
                 </button>
              </div>

              <label 
                style={{ 
                  width: '100%', marginBottom: '32px', padding: '24px', borderRadius: '16px',
                  border: '2px dashed var(--primary)', background: 'var(--primary-glow)',
                  color: 'var(--primary)', fontWeight: '700', cursor: isScanning ? 'not-allowed' : 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                  transition: 'all 0.2s'
                }}
              >
                {isScanning ? <Loader2 className="animate-spin" size={24} /> : <Scan size={24} />}
                <span>{isScanning ? 'SmartScan Processing...' : 'AI Receipt SmartScan (Upload Image)'}</span>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleScan} disabled={isScanning} />
              </label>

              <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Amount (₹)</label>
                  <input 
                    type="number" step="0.01" className="input-premium" required placeholder="0.00"
                    value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                   <div>
                     <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Category</label>
                     <select 
                       className="input-premium"
                       value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
                     >
                       {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                   </div>
                   <div>
                     <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Date</label>
                     <input 
                       type="date" className="input-premium"
                       value={formData.expense_date} onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                     />
                   </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Description</label>
                  <textarea 
                    className="input-premium" style={{ height: '100px', resize: 'none' }} placeholder="What was this for?"
                    value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                 <div>
                   <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Split With (Select Members)</label>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                     {SQUAD_MEMBERS.map(member => {
                       const isSelected = formData.split_with.includes(member);
                       return (
                         <button
                           key={member}
                           type="button"
                           onClick={() => {
                             const newSplit = isSelected
                               ? formData.split_with.filter(m => m !== member)
                               : [...formData.split_with, member];
                             setFormData({ ...formData, split_with: newSplit });
                           }}
                           style={{
                             padding: '6px 12px',
                             borderRadius: '20px',
                             border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-light)'}`,
                             background: isSelected ? 'var(--primary-glow)' : 'transparent',
                             color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                             cursor: 'pointer',
                             fontWeight: '600',
                             fontSize: '12px',
                             transition: 'all 0.2s'
                           }}
                         >
                           {member}
                         </button>
                       );
                     })}
                   </div>
                 </div>

                <div style={{ marginTop: 'auto', display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: '1px solid var(--border-light)', background: 'transparent', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" className="btn-premium" style={{ flex: 2 }}>Save Transaction</button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .expense-row:hover {
          background: var(--primary-glow) !important;
        }
      `}</style>
    </div>
  );
};
