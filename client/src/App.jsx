// client/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layout/MainLayout';
import { Login, Register } from './pages/AuthPages';
import { Dashboard } from './pages/Dashboard';
import { ExpenseTracker } from './pages/ExpenseTracker';
import { LiveMap } from './pages/LiveMap';
import { Itinerary } from './pages/Itinerary';
import { PackingList } from './pages/PackingList';

// Placeholder Pages
const Profile = () => <div><h1 style={{fontSize: '32px'}}>Your Profile</h1><p style={{color: 'var(--text-muted)'}}>Manage your personal settings and travel history.</p></div>;
const Settings = () => <div><h1 style={{fontSize: '32px'}}>Settings</h1><p style={{color: 'var(--text-muted)'}}>Configure your experience.</p></div>;

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <MainLayout>{children}</MainLayout>;
};

function AppContent() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />

        {/* Protected Application Routes */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/itinerary" element={<ProtectedRoute><Itinerary /></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute><ExpenseTracker /></ProtectedRoute>} />
        <Route path="/packing" element={<ProtectedRoute><PackingList /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><LiveMap /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
