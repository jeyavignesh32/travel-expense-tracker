// client/src/pages/ExpenseTracker.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Receipt, Filter, DollarSign, Calendar, Tag, Trash2, 
  Scan, Loader2, CheckCircle, ChevronDown 
} from 'lucide-react';

const CATEGORIES = ['Food', 'Transport', 'Hotel', 'Shopping', 'Other'];

export const ExpenseTracker = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [formData, setFormData] = useState({
    amount: '', category: 'Food', description: '', expense_date: new Date().toISOString().split('T')[0]
  });

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/expenses/trip/1`); // Mock tripId: 1
      setExpenses(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/expenses', { 
        ...formData, trip_id: 1, payer_id: user.id 
      });
      setShowAdd(false);
      setFormData({ amount: '', category: 'Food', description: '', expense_date: new Date().toISOString().split('T')[0] });
      fetchExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  const simulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setFormData({
        ...formData,
        amount: (Math.random() * 500 + 100).toFixed(2),
        description: 'Auto-scanned Receipt',
        category: CATEGORIES[Math.floor(Math.random() * 3)]
      });
      setIsScanning(false);
    }, 2000);
  };

  const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '4px' }}>Travel Expenses</h1>
          <p style={{ color: 'var(--text-muted)' }}>Track spending for your active adventure.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={20} />
          Add Expense
        </button>
      </header>

      {/* Summary Cards */}
      <div className="dashboard-grid" style={{ padding: 0, marginBottom: '32px' }}>
        <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid var(--primary)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>TOTAL SPENT</p>
          <h2 style={{ fontSize: '28px', marginTop: '8px' }}>₹{total.toLocaleString()}</h2>
        </div>
        <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid var(--success)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>MEMBERS</p>
          <h2 style={{ fontSize: '28px', marginTop: '8px' }}>4 Active</h2>
        </div>
        <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid var(--warning)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>REMAINING BUDGET</p>
          <h2 style={{ fontSize: '28px', marginTop: '8px' }}>₹12,450</h2>
        </div>
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Expenses List */}
        <div className="glass-card" style={{ flex: 1, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px' }}>Recent Transactions</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={filterBtnStyle}><Filter size={16} /> Filter</button>
            </div>
          </div>

          <AnimatePresence>
            {expenses.map((expense) => (
              <motion.div 
                key={expense.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px', borderRadius: '12px', background: 'rgba(249, 250, 251, 0.5)',
                  marginBottom: '12px', border: '1px solid var(--border-light)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    width: '44px', height: '44px', borderRadius: '12px', 
                    background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <Tag size={20} color="var(--primary)" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '16px', margin: 0 }}>{expense.description || expense.category}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{expense.payer_name} • {expense.expense_date}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <span style={{ fontWeight: '700', fontSize: '16px' }}>₹{expense.amount}</span>
                  <button onClick={() => handleDelete(expense.id)} style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Expense Sidebar Overlay */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 200, backdropFilter: 'blur(4px)' }}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              style={{ 
                position: 'fixed', right: 0, top: 0, bottom: 0, width: '400px', 
                background: 'white', zIndex: 201, padding: '40px', boxShadow: 'var(--shadow-lg)'
              }}
            >
              <h2 style={{ marginBottom: '32px' }}>New Expense</h2>

              <button 
                onClick={simulateScan}
                disabled={isScanning}
                style={{ 
                  width: '100%', marginBottom: '24px', padding: '16px', borderRadius: '12px',
                  border: '2px dashed var(--primary)', background: 'rgba(37, 99, 235, 0.05)',
                  color: 'var(--primary)', fontWeight: '600', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                }}
              >
                {isScanning ? <Loader2 className="animate-spin" /> : <Scan size={20} />}
                {isScanning ? 'AI Scanning...' : 'Scan Receipt (AI SmartScan)'}
              </button>

              <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="input-field">
                  <label style={labelStyle}>Amount (₹)</label>
                  <input 
                    type="number" step="0.01" required placeholder="0.00"
                    value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    style={formInputStyle}
                  />
                </div>
                <div className="input-field">
                  <label style={labelStyle}>Category</label>
                  <select 
                    value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
                    style={formInputStyle}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-field">
                  <label style={labelStyle}>Description</label>
                  <input 
                    placeholder="E.g. Lunch at Beach"
                    value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                    style={formInputStyle}
                  />
                </div>
                <div className="input-field">
                  <label style={labelStyle}>Date</label>
                  <input 
                    type="date"
                    value={formData.expense_date} onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                    style={formInputStyle}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                  <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary" style={{ flex: 1, padding: '12px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '12px' }}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Expense</button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const filterBtnStyle = {
  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: '1px solid var(--border-light)',
  borderRadius: '8px', background: 'white', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer'
};

const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-muted)' };
const formInputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' };
