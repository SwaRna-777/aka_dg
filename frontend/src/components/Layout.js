import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Zap, Target, Bot, LogOut, Menu, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const NAV = [
  { to: '/',       icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/habits', icon: Zap,             label: 'Habits'    },
  { to: '/goals',  icon: Target,          label: 'Goals'     },
  { to: '/ai',     icon: Bot,             label: 'AI Coach', ai: true },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/login'); };
  const initials = user?.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) || 'U';

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <div className="font-display font-bold text-sm">HabitAI</div>
          <div className="text-[10px] text-muted-foreground">AI-powered habits</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ to, icon: Icon, label, ai }) => (
          <NavLink key={to} to={to} end={to==='/'} onClick={()=>setMobileOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive ? (ai?'bg-primary/15 text-primary border border-primary/30':'bg-secondary text-foreground')
                       : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'}`}>
            <Icon className={`w-4 h-4 flex-shrink-0${ai?' text-primary':''}`} />
            <span>{label}</span>
            {ai && <span className="ml-auto text-[9px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">AI</span>}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border p-4 space-y-2">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">{initials}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.name}</div>
            <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="hidden md:flex flex-col w-56 border-r border-border bg-card flex-shrink-0"><Sidebar /></aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={()=>setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-card border-r border-border"><Sidebar /></aside>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button onClick={()=>setMobileOpen(true)} className="text-muted-foreground"><Menu className="w-5 h-5" /></button>
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-display font-bold text-sm">HabitAI</span>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
