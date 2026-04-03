// client/src/layout/MainLayout.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, Wallet, Map, User, LogOut, Compass, Bell, Settings 
} from 'lucide-react';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* Sidebar */}
      <aside className="glass-card" style={{ 
        width: '280px', height: '100vh', position: 'fixed', left: 0, 
        borderRadius: 0, padding: '24px', display: 'flex', flexDirection: 'column',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '12px', 
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Compass color="white" size={24} />
          </div>
          <h2 className="brand-font" style={{ margin: 0, fontSize: '20px' }}>TravelSense</h2>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <NavItem to="/" icon={<Home size={20} />} label="Dashboard" />
          <NavItem to="/expenses" icon={<Wallet size={20} />} label="Expenses" />
          <NavItem to="/map" icon={<Map size={20} />} label="Live Track" />
          <NavItem to="/profile" icon={<User size={20} />} label="Profile" />
          
          <div style={{ margin: '24px 0', borderTop: '1px solid var(--border-light)' }}></div>
          
          <NavItem to="/alerts" icon={<Bell size={20} />} label="Alerts" />
          <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" />
        </nav>

        <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
            }}>
              {user?.name?.charAt(0)}
            </div>
            <div>
              <p style={{ fontWeight: '600', fontSize: '14px' }}>{user?.name}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Free Plan</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            style={{ 
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px', borderRadius: '8px', border: 'none', background: 'transparent',
              color: 'var(--danger)', cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, marginLeft: '280px', padding: '32px' }}>
        {children}
      </main>
    </div>
  );
};

const NavItem = ({ to, icon, label }) => (
  <NavLink 
    to={to} 
    style={({ isActive }) => ({
      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
      borderRadius: '12px', textDecoration: 'none', 
      color: isActive ? 'var(--primary)' : 'var(--text-muted)',
      background: isActive ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
      fontWeight: isActive ? '600' : '500',
      transition: 'all 0.2s ease'
    })}
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

export default MainLayout;
