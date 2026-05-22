// client/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { motion } from 'framer-motion';
import { 
  TrendingUp, AlertTriangle, CheckCircle, Clock, 
  MapPin, DollarSign, Users, ArrowRight, Bell, Cloud, Sun, Droplets
} from 'lucide-react';

const COLORS = ['#2563eb', '#9333ea', '#0ea5e9', '#10b981', '#f59e0b'];

export const Dashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/expenses/trip/1');
        setExpenses(res.data);
      } catch (err) { console.error('Connection failed, using mock data.'); }
      setLoading(false);
    };
    fetch();
  }, []);

  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0) || 12450;
  
  const dailyData = [
    { day: 'Mon', amount: 1200 }, { day: 'Tue', amount: 3400 },
    { day: 'Wed', amount: 2100 }, { day: 'Thu', amount: 4500 },
    { day: 'Fri', amount: 1800 }, { day: 'Sat', amount: 7600 },
    { day: 'Sun', amount: 5400 }
  ];

  const categoryData = [
    { name: 'Transport', value: 4500 },
    { name: 'Food', value: 3200 },
    { name: 'Stay', value: 6000 },
    { name: 'Others', value: 1200 }
  ];

  return (
    <div className="animate-entrance">
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '38px', fontWeight: '800' }}>Adventure <span className="gradient-text">Hub</span></h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Exploring Goa, India • Apr 21 - Apr 27</p>
      </header>

      <div className="bento-grid">
        {/* Main Stats */}
        <div className="bento-item-4">
          <StatCard icon={<DollarSign size={20} />} label="Total Budget" value="₹50,000" sub="₹37,550 Remaining" color="var(--primary)" />
        </div>
        <div className="bento-item-4">
          <StatCard icon={<TrendingUp size={20} />} label="Daily Avg" value="₹2,450" sub="+12% from yesterday" color="var(--secondary)" />
        </div>
        <div className="bento-item-4">
           {/* Weather Facility */}
           <div className="glass-card" style={{ padding: '24px', height: '100%', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ padding: '12px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                 <Sun size={32} />
              </div>
              <div>
                 <h2 style={{ fontSize: '28px', margin: 0 }}>32°C</h2>
                 <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Sunny in Goa</p>
                 <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--text-dim)' }}><Droplets size={10} /> 65%</span>
                    <span style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--text-dim)' }}><Cloud size={10} /> 10%</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Big Chart */}
        <div className="bento-item-8">
          <div className="glass-card" style={{ padding: '32px', height: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '20px' }}>Spending Insights</h3>
              <select className="btn-text" style={{ border: 'none', background: 'transparent', color: 'var(--primary)', fontWeight: '600' }}>
                <option>Last 7 Days</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height="80%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: 'var(--text-dim)', fontSize: 12}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', border: 'none', 
                    boxShadow: 'var(--shadow-lg)', background: 'var(--bg-glass-heavy)' 
                  }} 
                />
                <Area type="monotone" dataKey="amount" stroke="var(--primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorAmt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie */}
        <div className="bento-item-4">
          <div className="glass-card" style={{ padding: '32px', height: '400px' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '24px' }}>By Expense</h3>
            <ResponsiveContainer width="100%" height="70%">
              <PieChart>
                <Pie data={categoryData} innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
               {categoryData.map((c, i) => (
                 <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '600' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                    {c.name}
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Destinations Facility */}
        <div className="bento-item-6">
           <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                 <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={20} color="var(--primary)" /> Next Stops</h3>
                 <ArrowRight size={18} color="var(--text-dim)" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 <DestinationTile name="Palolem Beach" time="4:30 PM" status="Driving" />
                 <DestinationTile name="Fort Aguada" time="Tomorrow" status="Scheduled" />
              </div>
           </div>
        </div>

        {/* Alerts Bento */}
        <div className="bento-item-6">
           <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                 <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><Bell size={20} color="var(--danger)" /> Live Alerts</h3>
                 <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>2 ACTIVE</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.05)', borderLeft: '4px solid var(--danger)' }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>Member Lagging</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Rahul S. is 650m behind the lead group.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ 
      position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px', 
      background: color, opacity: 0.03, borderRadius: '50%' 
    }} />
    <div style={{ 
      width: '44px', height: '44px', borderRadius: '14px', background: `${color}15`, 
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: color,
      marginBottom: '20px'
    }}>
      {icon}
    </div>
    <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>{label}</p>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
      <h2 style={{ fontSize: '32px', margin: '4px 0', fontWeight: '800' }}>{value}</h2>
    </div>
    <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '500' }}>{sub}</p>
  </div>
);

const DestinationTile = ({ name, time, status }) => (
  <div style={{ 
    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', 
    borderRadius: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)' 
  }}>
    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e2e8f0', overflow: 'hidden' }}>
       <img src={`https://source.unsplash.com/100x100/?${name}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
    <div style={{ flex: 1 }}>
       <h4 style={{ fontSize: '15px', margin: 0 }}>{name}</h4>
       <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{time}</p>
    </div>
    <span style={{ 
      fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: '8px',
      background: status === 'Driving' ? 'var(--primary-glow)' : 'var(--border-light)',
      color: status === 'Driving' ? 'var(--primary)' : 'var(--text-dim)'
    }}>{status}</span>
  </div>
);
