import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Habits from './pages/Habits';
import Goals from './pages/Goals';
import AICoach from './pages/AICoach';
import Layout from './components/Layout';

const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm font-sans">Loading HabitAI...</p>
      </div>
    </div>
  );
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
};

const Public = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login"    element={<Public><Login /></Public>} />
          <Route path="/register" element={<Public><Register /></Public>} />
          <Route path="/"         element={<Protected><Dashboard /></Protected>} />
          <Route path="/habits"   element={<Protected><Habits /></Protected>} />
          <Route path="/goals"    element={<Protected><Goals /></Protected>} />
          <Route path="/ai"       element={<Protected><AICoach /></Protected>} />
          <Route path="*"         element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-center" toastOptions={{
          style: { background: '#111', border: '1px solid #222', color: '#fff' }
        }} />
      </AuthProvider>
    </BrowserRouter>
  );
}
