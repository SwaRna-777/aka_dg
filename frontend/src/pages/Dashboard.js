import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { habitsAPI, aiAPI } from '../lib/api';
import { Zap, Target, Bot, TrendingUp, CheckCircle2, Flame, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const StatCard = ({ icon: Icon, label, value, sub, color = 'text-foreground', delay = 0 }) => (
  <div className="bg-card border border-border rounded-2xl p-5 animate-fade-up" style={{ animationDelay: `${delay}ms`, opacity: 0 }}>
    <div className="flex items-start justify-between mb-3">
      <div className="p-2 rounded-xl bg-secondary"><Icon className={`w-4 h-4 ${color}`} /></div>
    </div>
    <div className={`text-2xl font-display font-bold ${color}`}>{value}</div>
    <div className="text-sm font-medium mt-0.5">{label}</div>
    {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [habits, setHabits] = useState([]);
  const [motivation, setMotivation] = useState(null);
  const [motivLoading, setMotivLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([habitsAPI.stats(), habitsAPI.getAll()])
      .then(([s, h]) => { setStats(s.data); setHabits(h.data.slice(0,5)); })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const handleMotivate = async () => {
    setMotivLoading(true);
    try {
      const res = await aiAPI.motivate();
      setMotivation(res.data);
    } catch {
      toast.error('AI unavailable — check your OpenAI key');
    } finally { setMotivLoading(false); }
  };

  const handleToggle = async (h) => {
    try {
      const res = await habitsAPI.toggle(h.id);
      setHabits(prev => prev.map(x => x.id === h.id ? { ...x, done_today: res.data.done_today, streak: res.data.streak } : x));
    } catch { toast.error('Failed to update'); }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <h1 className="font-display text-2xl md:text-3xl font-bold">{greeting}, {name} 👋</h1>
        <p className="text-muted-foreground mt-1 text-sm">Here's your habit overview for today</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-card border border-border rounded-2xl h-28 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={CheckCircle2} label="Done Today"    value={`${stats?.done_today||0}/${stats?.total_habits||0}`} color="text-primary" delay={0} />
          <StatCard icon={Flame}       label="Best Streak"   value={`${stats?.best_streak||0}d`} color="text-orange-400" delay={50} />
          <StatCard icon={TrendingUp}  label="Weekly"        value={`${stats?.weekly_completion||0}%`} color="text-blue-400" delay={100} />
          <StatCard icon={Target}      label="Active Goals"  value={stats?.goals_active||0} color="text-purple-400" delay={150} />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Today's habits */}
        <div className="bg-card border border-border rounded-2xl p-5 animate-fade-up" style={{animationDelay:'200ms',opacity:0}}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-base">Today's Habits</h2>
            <Link to="/habits" className="text-xs text-primary hover:underline flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {habits.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No habits yet</p>
              <Link to="/habits" className="text-xs text-primary hover:underline mt-1 inline-block">Add your first habit →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {habits.map(h => (
                <div key={h.id} onClick={() => handleToggle(h)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${h.done_today ? 'bg-primary/10 border border-primary/20' : 'bg-secondary hover:bg-secondary/70'}`}>
                  <span className="text-xl">{h.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${h.done_today ? 'line-through text-muted-foreground' : ''}`}>{h.title}</div>
                    <div className="text-xs text-muted-foreground">🔥 {h.streak} day streak</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${h.done_today ? 'bg-primary border-primary' : 'border-border'}`}>
                    {h.done_today && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI motivation card */}
        <div className="bg-card border border-border rounded-2xl p-5 animate-fade-up" style={{animationDelay:'250ms',opacity:0}}>
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-4 h-4 text-primary" />
            <h2 className="font-display font-bold text-base">AI Motivation</h2>
          </div>

          {motivation ? (
            <div className="space-y-4">
              <div className="ai-bg ai-border rounded-xl p-4">
                <p className="text-sm leading-relaxed">{motivation.message}</p>
              </div>
              <div className="bg-secondary rounded-xl p-3">
                <p className="text-xs text-muted-foreground italic">"{motivation.quote}"</p>
              </div>
              {motivation.challenge && (
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-primary">7-Day Challenge</p>
                    <p className="text-xs text-muted-foreground">{motivation.challenge}</p>
                  </div>
                </div>
              )}
              <button onClick={() => setMotivation(null)} className="text-xs text-muted-foreground hover:text-primary transition-colors">↺ Get new boost</button>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">Get personalized motivation from your AI coach</p>
              <button onClick={handleMotivate} disabled={motivLoading}
                className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
                style={{boxShadow:'0 0 20px rgba(0,212,170,0.3)'}}>
                {motivLoading ? <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /><span>Thinking...</span></> : <><Sparkles className="w-4 h-4" /><span>Motivate Me</span></>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        {[
          { to: '/habits', icon: Zap,    label: 'Habits',   color: 'text-primary' },
          { to: '/goals',  icon: Target, label: 'Goals',    color: 'text-purple-400' },
          { to: '/ai',     icon: Bot,    label: 'AI Coach', color: 'text-blue-400' },
        ].map(({ to, icon: Icon, label, color }, i) => (
          <Link key={to} to={to} className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2 hover:border-primary/40 transition-all animate-fade-up" style={{animationDelay:`${300+i*50}ms`,opacity:0}}>
            <Icon className={`w-5 h-5 ${color}`} />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
