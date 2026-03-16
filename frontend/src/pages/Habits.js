import React, { useState, useEffect } from 'react';
import { habitsAPI } from '../lib/api';
import { toast } from 'sonner';
import { Plus, Flame, CheckCircle2, Trash2, TrendingUp, X, Zap } from 'lucide-react';

const EMOJIS = ['✅','💪','📚','🧘','💧','🏃','🥗','😴','✍️','🎯','🌅','🧠','🎸','🌿','💰'];
const CATEGORIES = ['health','fitness','learning','mindfulness','nutrition','productivity','social','financial'];
const COLORS = ['#00d4aa','#7c3aed','#3b82f6','#f59e0b','#ef4444','#10b981','#ec4899','#6366f1'];

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title:'', description:'', emoji:'✅', category:'health', color:'#00d4aa' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchHabits(); }, []);

  const fetchHabits = async () => {
    try { const r = await habitsAPI.getAll(); setHabits(r.data); }
    catch { toast.error('Failed to load habits'); }
    finally { setLoading(false); }
  };

  const handleToggle = async (h) => {
    try {
      const res = await habitsAPI.toggle(h.id);
      setHabits(prev => prev.map(x => x.id===h.id ? {...x, done_today:res.data.done_today, streak:res.data.streak, completion_rate:res.data.completion_rate} : x));
      if (res.data.done_today) toast.success(`🔥 ${h.title} — ${res.data.streak}d streak!`);
    } catch { toast.error('Failed to update'); }
  };

  const handleCreate = async e => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Enter a title'); return; }
    setSaving(true);
    try {
      const res = await habitsAPI.create(form);
      setHabits(prev => [...prev, res.data]);
      setForm({ title:'', description:'', emoji:'✅', category:'health', color:'#00d4aa' });
      setShowAdd(false);
      toast.success('Habit created!');
    } catch { toast.error('Failed to create'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this habit?')) return;
    try {
      await habitsAPI.delete(id);
      setHabits(prev => prev.filter(h => h.id !== id));
      toast.success('Habit removed');
    } catch { toast.error('Failed to delete'); }
  };

  const done = habits.filter(h => h.done_today).length;
  const pct  = habits.length ? Math.round(done/habits.length*100) : 0;
  const circ = 2 * Math.PI * 32;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl font-bold">Habits</h1>
          <p className="text-muted-foreground text-sm">{done}/{habits.length} done today</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all" style={{boxShadow:'0 0 20px rgba(0,212,170,0.3)'}}>
          <Plus className="w-4 h-4" /> New Habit
        </button>
      </div>

      {/* Progress ring */}
      {habits.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6 flex items-center gap-5 animate-fade-up" style={{animationDelay:'50ms',opacity:0}}>
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg width="80" height="80" className="-rotate-90">
              <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
              <circle cx="40" cy="40" r="32" fill="none" stroke="#00d4aa" strokeWidth="8"
                strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)} strokeLinecap="round"
                style={{transition:'stroke-dashoffset .6s ease'}} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-display font-bold text-base">{pct}%</div>
          </div>
          <div>
            <div className="font-display font-bold text-lg">{pct===100 ? '🔥 Perfect Day!' : 'Keep going!'}</div>
            <div className="text-sm text-muted-foreground">{habits.length-done} habit{habits.length-done!==1?'s':''} remaining</div>
            <div className="flex items-center gap-1 mt-2">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs text-muted-foreground">Best streak: {Math.max(0,...habits.map(h=>h.streak))} days</span>
            </div>
          </div>
        </div>
      )}

      {/* Habit list */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="h-20 bg-card border border-border rounded-2xl animate-pulse" />)}</div>
      ) : habits.length === 0 ? (
        <div className="text-center py-16 animate-fade-up">
          <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No habits yet. Create your first one!</p>
          <button onClick={() => setShowAdd(true)} className="text-sm text-primary hover:underline">+ Add a habit</button>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((h, i) => (
            <div key={h.id} onClick={() => handleToggle(h)}
              className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all group animate-fade-up ${h.done_today ? 'border border-primary/30 bg-primary/8' : 'bg-card border border-border hover:border-border/80'}`}
              style={{animationDelay:`${i*40}ms`,opacity:0}}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{background:`${h.color}18`,border:`1px solid ${h.color}30`}}>
                {h.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm ${h.done_today?'line-through text-muted-foreground':''}`}>{h.title}</div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" />{h.streak}d streak</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" />{h.completion_rate}% this month</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${h.done_today?'bg-primary border-primary':'border-border'}`}>
                  {h.done_today && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
                </div>
                <button onClick={e=>{e.stopPropagation();handleDelete(h.id);}} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-400 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add habit modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e=>{if(e.target===e.currentTarget)setShowAdd(false)}}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-base">New Habit</h3>
              <button onClick={()=>setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Habit title *</label>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Morning meditation"
                  className="w-full bg-secondary border border-border rounded-xl h-11 px-4 text-sm outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Emoji</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map(e => (
                    <button key={e} type="button" onClick={()=>setForm(f=>({...f,emoji:e}))}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${form.emoji===e?'bg-primary/20 ring-2 ring-primary':'bg-secondary hover:bg-secondary/70'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Category</label>
                  <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}
                    className="w-full bg-secondary border border-border rounded-xl h-11 px-3 text-sm outline-none focus:border-primary capitalize">
                    {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Color</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {COLORS.map(c=>(
                      <button key={c} type="button" onClick={()=>setForm(f=>({...f,color:c}))}
                        className={`w-6 h-6 rounded-full transition-all ${form.color===c?'ring-2 ring-white scale-110':''}`} style={{background:c}} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={()=>setShowAdd(false)} className="flex-1 h-11 bg-secondary border border-border rounded-xl text-sm font-medium hover:bg-secondary/70 transition-all">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 h-11 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
