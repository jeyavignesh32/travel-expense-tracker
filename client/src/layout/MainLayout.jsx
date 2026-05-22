// client/src/layout/MainLayout.jsx
import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Home, Wallet, Map, User, LogOut, Compass, Bell, 
  Settings, Calendar, CheckSquare, ChevronLeft, Menu, Moon, Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CopilotAssistant } from '../components/CopilotAssistant';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: <Home size={22} />, label: 'Dashboard' },
    { to: '/itinerary', icon: <Calendar size={22} />, label: 'Itinerary' },
    { to: '/expenses', icon: <Wallet size={22} />, label: 'Expenses' },
    { to: '/packing', icon: <CheckSquare size={22} />, label: 'Packing List' },
    { to: '/map', icon: <Map size={22} />, label: 'Live Track' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      {/* Sidebar */}
      <motion.aside 
        animate={{ width: isCollapsed ? '80px' : '280px' }}
        className="glass-card" 
        style={{ 
          height: '100vh', position: 'fixed', left: 0, 
          borderRadius: 0, padding: '24px 16px', display: 'flex', flexDirection: 'column',
          zIndex: 100, borderRight: '1px solid var(--border-light)'
        }}
      >
        {/* Brand */}
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px',
          padding: '0 8px', overflow: 'hidden'
        }}>
          <div style={{ 
            minWidth: '42px', height: '42px', borderRadius: '12px', 
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px var(--primary-glow)'
          }}>
            <Compass color="white" size={24} />
          </div>
          {!isCollapsed && (
            <motion.h2 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="brand-font" style={{ margin: 0, fontSize: '22px', whiteSpace: 'nowrap' }}
            >
              TravelSense
            </motion.h2>
          )}
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {navItems.map((item) => (
            <NavItem 
              key={item.to} 
              {...item} 
              isCollapsed={isCollapsed} 
              isActive={location.pathname === item.to} 
            />
          ))}
          
          <div style={{ margin: '20px 8px', borderTop: '1px solid var(--border-light)' }}></div>
          
          <NavItem to="/profile" icon={<User size={22} />} label="Profile" isCollapsed={isCollapsed} isActive={location.pathname === '/profile'} />
          <NavItem to="/settings" icon={<Settings size={22} />} label="Settings" isCollapsed={isCollapsed} isActive={location.pathname === '/settings'} />
        </nav>

        {/* Footer / User */}
        <div style={{ marginTop: 'auto', padding: '12px 8px' }}>
          {!isCollapsed && (
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px',
              padding: '12px', borderRadius: '16px', background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ 
                width: '36px', height: '36px', borderRadius: '50%', 
                background: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontWeight: '700', fontSize: '14px', color: '#475569'
              }}>
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontWeight: '600', fontSize: '14px', margin: 0, whiteSpace: 'nowrap' }}>{user?.name || 'Guest'}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Pro Plan</p>
              </div>
            </div>
          )}
          
          <button 
            onClick={handleLogout}
            className="logout-btn"
            style={{ 
              width: '100%', display: 'flex', alignItems: 'center', 
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: '12px', padding: '12px', borderRadius: '12px', border: 'none', 
              background: 'transparent', color: 'var(--danger)', cursor: 'pointer', 
              transition: 'all 0.2s', fontWeight: '600'
            }}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            position: 'absolute', right: '-12px', top: '48px',
            width: '24px', height: '24px', borderRadius: '50%',
            background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: 'var(--shadow-sm)', zIndex: 110
          }}
        >
          <ChevronLeft size={14} style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
        </button>
      </motion.aside>

      {/* Main Content Area */}
      <main style={{ 
        flex: 1, 
        marginLeft: isCollapsed ? '80px' : '280px', 
        padding: '40px',
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        maxWidth: '1600px'
      }}>
        <header style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          marginBottom: '40px' 
        }}>
          <div style={{ opacity: 0.8 }}>
             {/* Dynamic Breadcrumbs or Search could go here */}
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
             <button 
               onClick={toggleTheme}
               className="glass-card" 
               style={{ padding: '10px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
             >
                {theme === 'light' ? <Moon size={20} color="var(--text-muted)" /> : <Sun size={20} color="var(--warning)" />}
             </button>
             <button className="glass-card" style={{ padding: '10px', borderRadius: '12px', cursor: 'pointer' }}>
                <Bell size={20} color="var(--text-muted)" />
             </button>
             <button className="glass-card" style={{ padding: '10px', borderRadius: '12px', cursor: 'pointer' }}>
                <Menu size={20} color="var(--text-muted)" />
             </button>
          </div>
        </header>
        {children}
      </main>

      <CopilotAssistant />

      <style>{`
        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.08) !important;
        }
      `}</style>
    </div>
  );
};

const NavItem = ({ to, icon, label, isCollapsed, isActive }) => (
  <NavLink 
    to={to} 
    className="nav-item"
    style={{
      display: 'flex', alignItems: 'center', 
      justifyContent: isCollapsed ? 'center' : 'flex-start',
      gap: '12px', padding: '12px 14px',
      borderRadius: '14px', textDecoration: 'none', 
      color: isActive ? 'var(--primary)' : 'var(--text-muted)',
      background: isActive ? 'var(--primary-glow)' : 'transparent',
      fontWeight: isActive ? '600' : '500',
      transition: 'all 0.3s ease',
      border: isActive ? '1px solid hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.1)' : '1px solid transparent'
    }}
  >
    <div style={{ minWidth: '22px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
    {!isCollapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{label}</motion.span>}
  </NavLink>
);

export default MainLayout;
