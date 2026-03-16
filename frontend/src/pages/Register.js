import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Sparkles, Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Password must be 6+ characters'); return; }
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success('Welcome to HabitAI!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally { setLoading(false); }
  };

  const Field = ({ icon: Icon, type, value, onChange, placeholder, label }) => (
    <div>
      <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type={type} required value={value} onChange={onChange} placeholder={placeholder}
          className="w-full bg-secondary border border-border rounded-xl h-11 pl-10 pr-4 text-sm outline-none focus:border-primary transition-colors" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="w-full max-w-sm relative animate-fade-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4" style={{boxShadow:'0 0 40px rgba(0,212,170,0.4)'}}>
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold">HabitAI</h1>
          <p className="text-muted-foreground text-sm mt-1">Build better habits with AI</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-display text-lg font-bold mb-5">Create account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field icon={User} type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" label="Name" />
            <Field icon={Mail} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" label="Email" />
            <Field icon={Lock} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters" label="Password" />
            <button type="submit" disabled={loading}
              className="w-full h-11 bg-primary text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
              style={{boxShadow:'0 0 20px rgba(0,212,170,0.3)'}}>
              {loading ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><span>Get Started</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
