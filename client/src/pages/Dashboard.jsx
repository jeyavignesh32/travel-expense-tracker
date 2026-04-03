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
  MapPin, DollarSign, Users, ArrowRight, Bell
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
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetch();
  }, []);

  // Prepare Chart Data
  const categoryData = ['Food', 'Transport', 'Hotel', 'Shopping', 'Other'].map(cat => ({
    name: cat,
    value: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + parseFloat(e.amount), 0)
  })).filter(d => d.value > 0);

  const dailyData = [
    { day: 'Mon', amount: 1200 }, { day: 'Tue', amount: 3400 },
    { day: 'Wed', amount: 2100 }, { day: 'Thu', amount: 4500 },
    { day: 'Fri', amount: 1800 }, { day: 'Sat', amount: 7600 },
    { day: 'Sun', amount: 5400 }
  ];

  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px' }}>Adventure Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Welcome back! Here's your trip status at a glance.</p>
      </header>

      {/* Top Stats Row */}
      <div className="dashboard-grid" style={{ padding: 0, marginBottom: '24px' }}>
        <StatCard icon={<DollarSign color="var(--primary)" />} label="Total Budget" value="₹50,000" sub="₹37,550 Remaining" />
        <StatCard icon={<TrendingUp color="var(--success)" />} label="Spent Today" value="₹2,450" sub="+12% from yesterday" />
        <StatCard icon={<AlertTriangle color="var(--danger)" />} label="Safety Alerts" value="2 Active" sub="1 Missed Front detected" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Expenditure Chart */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '24px' }}>Spending Trend</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="amount" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '24px' }}>Categories</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={categoryData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Alerts & Destinations */}
      <div className="dashboard-grid" style={{ padding: 0, marginTop: '24px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={20} color="var(--danger)" /> Recent Safety Alerts
            </h3>
            <button className="btn-text" style={{ border: 'none', background: 'transparent', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <AlertItem type="missed_front" message="Member 'Rahul S.' has deviated from the group path (650m)" time="12 mins ago" />
            <AlertItem type="sos" message="Emergency Alert: SOS triggered manually by admin" time="1 hour ago" />
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <MapPin size={20} color="var(--primary)" /> Next Destination
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(37, 99, 235, 0.05)', padding: '16px', borderRadius: '12px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: '#e2e8f0' }}></div>
            <div>
              <h4 style={{ margin: 0 }}>Palolem Beach, Goa</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Estimated arrival: 4:30 PM</p>
              <button className="btn-primary" style={{ marginTop: '8px', padding: '6px 12px', fontSize: '12px' }}>
                Start Nav <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, sub }) => (
  <div className="glass-card" style={{ padding: '24px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${icon.props.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
    </div>
    <div style={{ marginTop: '16px' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>{label}</p>
      <h2 style={{ fontSize: '28px', margin: '4px 0' }}>{value}</h2>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sub}</p>
    </div>
  </div>
);

const AlertItem = ({ type, message, time }) => (
  <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid var(--danger)' }}>
    <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>{message}</p>
    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{time}</p>
  </div>
);
