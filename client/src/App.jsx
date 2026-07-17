// client/src/App.jsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layout/MainLayout';
import { Login, Register } from './pages/AuthPages';
import { Dashboard } from './pages/Dashboard';
import { ExpenseTracker } from './pages/ExpenseTracker';
import { LiveMap } from './pages/LiveMap';
import { Itinerary } from './pages/Itinerary';
import { PackingList } from './pages/PackingList';
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";

import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { Safety } from './pages/Safety';
import { Settlements } from './pages/Settlements';
import { EcoTracker } from './pages/EcoTracker';

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
        <Route path="/settlements" element={<ProtectedRoute><Settlements /></ProtectedRoute>} />
        <Route path="/packing" element={<ProtectedRoute><PackingList /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><LiveMap /></ProtectedRoute>} />
        <Route path="/safety" element={<ProtectedRoute><Safety /></ProtectedRoute>} />
        <Route path="/eco" element={<ProtectedRoute><EcoTracker /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CopilotKit publicApiKey={import.meta.env.VITE_COPILOT_API_KEY}>
          <AppContent />
        </CopilotKit>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
