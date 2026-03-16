import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Sparkles, Mail, Lock, ArrowRight, Zap } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="w-full max-w-sm relative animate-fade-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4" style={{boxShadow:'0 0 40px rgba(0,212,170,0.4)'}}>
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold">HabitAI</h1>
          <p className="text-muted-foreground text-sm mt-1">Your AI-powered habit coach</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-display text-lg font-bold mb-5">Sign in</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full bg-secondary border border-border rounded-xl h-11 pl-10 pr-4 text-sm outline-none focus:border-primary transition-colors" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full bg-secondary border border-border rounded-xl h-11 pl-10 pr-4 text-sm outline-none focus:border-primary transition-colors" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-11 bg-primary text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
              style={{boxShadow:'0 0 20px rgba(0,212,170,0.3)'}}>
              {loading ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          No account?{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">Create one</Link>
        </p>

        <div className="mt-6 bg-card border border-border rounded-xl p-3 flex items-start gap-2">
          <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">AI-powered insights, habit analysis, and personal coaching — all in one app.</p>
        </div>
      </div>
    </div>
  );
}
