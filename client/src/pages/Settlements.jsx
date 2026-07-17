import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Receipt, ArrowRight, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';

export const Settlements = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settled, setSettled] = useState(() => {
    try {
      const saved = localStorage.getItem('settled_persons');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Persist settled state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('settled_persons', JSON.stringify(settled));
  }, [settled]);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/expenses/trip/1');
      setExpenses(res.data);
    } catch (err) {
      console.error('Connection failed, showing mock data.');
      setExpenses([
        { id: 1, amount: 450, category: 'Food', description: 'Beach Lunch', payer_name: 'Rahul S.', split_with: ['You', 'Rahul S.', 'Priya'] },
        { id: 2, amount: 1200, category: 'Transport', description: 'Taxi to Baga', payer_name: user?.name || 'You', split_with: ['You', 'Rahul S.'] },
        { id: 3, amount: 5000, category: 'Hotel', description: 'Resort Stay', payer_name: 'Priya', split_with: ['You', 'Priya'] },
      ]);
    }
    setLoading(false);
  };

  const calculateBalances = () => {
    const balances = {};
    expenses.forEach(exp => {
      const payer = exp.payer_name;
      const amount = parseFloat(exp.amount);
      const splitWith = exp.split_with || [];
      if (splitWith.length === 0) return;

      const splitAmount = amount / splitWith.length;

      if (!balances[payer]) balances[payer] = 0;
      balances[payer] += amount; // Payer gets credit for full amount

      splitWith.forEach(person => {
        if (!balances[person]) balances[person] = 0;
        balances[person] -= splitAmount; // Each person owes their share
      });
    });

    const owes = [];
    const owed = [];

    Object.keys(balances).forEach(person => {
      if (balances[person] < -0.01) owes.push({ person, amount: Math.abs(balances[person]) });
      else if (balances[person] > 0.01) owed.push({ person, amount: balances[person] });
    });

    return { balances, owes, owed };
  };

  const { owes, owed } = calculateBalances();

  const handleSettle = (person) => {
    if (window.confirm(`Mark all debts for ${person} as settled?`)) {
      const newSettled = [...settled, person];
      setSettled(newSettled);
      alert(`${person} has been marked as settled.`);
    }
  };

  const handleUnsettle = (person) => {
    if (window.confirm(`Undo settlement for ${person}?`)) {
      setSettled(settled.filter(p => p !== person));
    }
  };

  return (
    <div className="animate-entrance" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '38px', fontWeight: '800' }}>Group <span className="gradient-text">Settlements</span></h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Track who owes who and settle up easily.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <AlertCircle size={20} color="var(--danger)" /> Who Owes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {owes.length === 0 ? <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>No one owes anything!</p> : null}
            {owes.map((o, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                    {o.person.charAt(0)}
                  </div>
                  <span style={{ fontWeight: '600' }}>{o.person}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontWeight: '800', color: 'var(--danger)' }}>-₹{o.amount.toFixed(2)}</span>
                  {!settled.includes(o.person) ? (
                     <button onClick={() => handleSettle(o.person)} className="btn-premium" style={{ padding: '8px 16px', fontSize: '12px', background: 'var(--success)' }}>Settle</button>
                  ) : (
                     <button onClick={() => handleUnsettle(o.person)} style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.1)', border: '1px solid var(--success)', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' }}><CheckCircle2 size={14} /> Settled</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <CheckCircle2 size={20} color="var(--success)" /> Who is Owed
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {owed.length === 0 ? <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>No one is owed anything!</p> : null}
            {owed.map((o, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                    {o.person.charAt(0)}
                  </div>
                  <span style={{ fontWeight: '600' }}>{o.person}</span>
                </div>
                <span style={{ fontWeight: '800', color: 'var(--success)' }}>+₹{o.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
