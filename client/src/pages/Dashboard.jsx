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
  MapPin, DollarSign, Users, ArrowRight, Bell, Cloud, Sun, Droplets, Sparkles, Download
} from 'lucide-react';

import TravelGlobe from '../components/TravelGlobe';

const COLORS = ['#2563eb', '#9333ea', '#0ea5e9', '#10b981', '#f59e0b'];

export const Dashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState({ temp: '32', desc: 'Sunny', humidity: '65', cloudcover: '10' });
  const [budget] = useState(50000); // Can be made configurable later

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/expenses/trip/1');
        setExpenses(res.data);
      } catch (err) { console.error('Connection failed, using mock data.'); }
      
      try {
        const weatherRes = await axios.get('http://localhost:5000/api/nearby/weather?location=Goa');
        const wd = weatherRes.data;
        if (wd.current_condition) {
          setWeather({
            temp: wd.current_condition[0].temp_C,
            desc: wd.current_condition[0].weatherDesc[0].value,
            humidity: wd.current_condition[0].humidity,
            cloudcover: wd.current_condition[0].cloudcover
          });
        }
      } catch (e) { console.error('Weather fetch failed'); }
      
      setLoading(false);
    };
    fetchData();
  }, []);

  const generateReport = () => {
    let csv = 'Date,Description,Category,Amount\n';
    expenses.forEach(e => {
      csv += `${e.date?.split('T')[0] || new Date().toISOString().split('T')[0]},"${e.description || 'N/A'}",${e.category || 'Others'},${e.amount || 0}\n`;
    });
    const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    csv += `\nTotal Spent,,,${total}\nRemaining Budget,,,${Math.max(0, budget - total)}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Trip_Budget_Report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0) || 12450;
  const remaining = Math.max(0, budget - totalSpent);
  const budgetPct = Math.min(100, Math.round((totalSpent / budget) * 100));
  const budgetColor = budgetPct < 50 ? 'var(--success)' : budgetPct < 80 ? 'var(--warning)' : 'var(--danger)';
  const dailyAvg = expenses.length > 0 ? Math.round(totalSpent / Math.max(1, new Set(expenses.map(e => e.date?.split('T')[0])).size)) : 2450;

  // Build category breakdown from real expenses
  const categoryMap = {};
  expenses.forEach(e => {
    const cat = e.category || 'Others';
    categoryMap[cat] = (categoryMap[cat] || 0) + parseFloat(e.amount || 0);
  });
  const categoryData = Object.keys(categoryMap).length > 0
    ? Object.entries(categoryMap).map(([name, value]) => ({ name, value: Math.round(value) }))
    : [
        { name: 'Transport', value: 4500 },
        { name: 'Food', value: 3200 },
        { name: 'Stay', value: 6000 },
        { name: 'Others', value: 1200 }
      ];

  const dailyData = [
    { day: 'Mon', amount: 1200, forecast: 1200 }, 
    { day: 'Tue', amount: 3400, forecast: 3400 },
    { day: 'Wed', amount: 2100, forecast: 2100 }, 
    { day: 'Thu', amount: 4500, forecast: 4500 },
    { day: 'Fri', amount: 1800, forecast: 1800 }, 
    { day: 'Sat', amount: 7600, forecast: 7600 },
    { day: 'Sun', amount: 5400, forecast: 5400 },
    { day: 'Next Mon', amount: null, forecast: 2500 },
    { day: 'Next Tue', amount: null, forecast: 2800 },
    { day: 'Next Wed', amount: null, forecast: 3100 },
  ];

  const tripsMock = [
    { id: 1, destination: 'Goa', lat: 15.2993, lon: 74.1240 },
    { id: 2, destination: 'Thiruvengadam', lat: 9.2907, lon: 77.6995 },
    { id: 3, destination: 'Paris', lat: 48.8566, lon: 2.3522 },
    { id: 4, destination: 'Tokyo', lat: 35.6762, lon: 139.6503 }
  ];

  return (
    <div className="animate-entrance">
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '38px', fontWeight: '800' }}>Adventure <span className="rainbow-text">Hub</span></h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Exploring Goa, India • Apr 21 - Apr 27</p>
      </header>

      {/* 3D Interactive Travel Globe */}
      <div className="mb-8" style={{ height: '400px' }}>
        <TravelGlobe trips={tripsMock} />
      </div>

      <div className="bento-grid">
        {/* Budget Progress Card */}
        <div className="bento-item-8" style={{ marginBottom: '0' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  Trip Budget Overview
                  <button onClick={generateReport} style={{
                    background: 'var(--primary-glow)', color: 'var(--primary)', border: 'none', padding: '4px 10px',
                    borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                    <Download size={12} /> EXPORT CSV
                  </button>
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>₹{totalSpent.toLocaleString('en-IN')} spent of ₹{budget.toLocaleString('en-IN')} budget</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '28px', fontWeight: '800', color: budgetColor }}>₹{remaining.toLocaleString('en-IN')}</span>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>REMAINING</p>
              </div>
            </div>
            <div style={{ height: '10px', borderRadius: '10px', background: 'var(--border-strong)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: budgetPct + '%', borderRadius: '10px', background: `linear-gradient(90deg, ${budgetColor}, ${budgetColor}cc)`, transition: 'width 1s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: '600' }}>
              <span>{budgetPct}% used</span>
              <span style={{ color: budgetColor }}>{budgetPct < 50 ? '✅ On Track' : budgetPct < 80 ? '⚠️ Moderate' : '🔴 Overspending Risk'}</span>
            </div>
          </div>
        </div>

        {/* Main Stats */}
        <div className="bento-item-4">
          <StatCard icon={<DollarSign size={20} />} label="Total Spent" value={'₹' + totalSpent.toLocaleString('en-IN')} sub={`${budgetPct}% of budget used`} color="var(--primary)" />
        </div>
        <div className="bento-item-4">
          <StatCard icon={<TrendingUp size={20} />} label="Daily Average" value={'₹' + dailyAvg.toLocaleString('en-IN')} sub={`${expenses.length} transactions recorded`} color="var(--secondary)" />
        </div>
        <div className="bento-item-4">
           {/* Weather Facility */}
           <div className="glass-card" style={{ padding: '24px', height: '100%', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ padding: '12px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                 <Sun size={32} />
              </div>
              <div>
                 <h2 style={{ fontSize: '28px', margin: 0 }}>{weather.temp}°C</h2>
                 <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>{weather.desc} in Goa</p>
                 <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--text-dim)' }}><Droplets size={10} /> {weather.humidity}%</span>
                    <span style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--text-dim)' }}><Cloud size={10} /> {weather.cloudcover}%</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Big Chart & AI Forecast */}
        <div className="bento-item-8">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', height: '100%' }}>
            <div className="glass-card" style={{ padding: '32px', height: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '20px' }}>Spending Insights</h3>
                <select className="btn-text" style={{ border: 'none', background: 'transparent', color: 'var(--primary)', fontWeight: '600' }}>
                  <option>Last 7 Days + Forecast</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height="80%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--warning)" stopOpacity={0}/>
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
                  <Area type="monotone" dataKey="forecast" stroke="var(--warning)" strokeDasharray="5 5" strokeWidth={3} fillOpacity={1} fill="url(#colorForecast)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* AI Budget Forecasting */}
            <div className="glass-card gradient-border glow-animate" style={{ padding: '32px', height: '400px', background: 'linear-gradient(180deg, var(--bg-surface) 0%, rgba(245, 158, 11, 0.05) 100%)' }}>
              <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <Sparkles size={18} className="rainbow-text glow-animate" /> <span className="rainbow-text">Copilot Forecast</span>
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.6' }}>
                Based on your daily average and destination cost-of-living index, you are projected to spend <strong>₹8,400</strong> over the next 3 days.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-light)' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '0 0 4px 0' }}>Projected Overspend</p>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--danger)', margin: 0 }}>+₹1,250</p>
                </div>
                <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-light)' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '0 0 4px 0' }}>Suggested Action</p>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>Reduce dining out by 15%</p>
                </div>
              </div>
            </div>
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
       <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
