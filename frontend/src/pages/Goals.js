import React, { useState, useEffect } from 'react';
import { goalsAPI } from '../lib/api';
import { toast } from 'sonner';
import { Plus, Target, CheckCircle2, Trash2, X, TrendingUp } from 'lucide-react';

const CATS = ['personal','health','career','finance','learning','relationships'];
const EMOJIS = ['🎯','📚','💰','🚀','🏃','🧠','🌟','💼','❤️','🎸'];

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ title:'', description:'', category:'personal', target_date:'', emoji:'🎯' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    goalsAPI.getAll().then(r => setGoals(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  const handleCreate = async e => {
    e.preventDefault();
    if (!form.title || !form.target_date) { toast.error('Fill all fields'); return; }
    setSaving(true);
    try {
      const r = await goalsAPI.create(form);
      setGoals(prev => [r.data, ...prev]);
      setForm({ title:'', description:'', category:'personal', target_date:'', emoji:'🎯' });
      setShowAdd(false);
      toast.success('Goal created!');
    } catch { toast.error('Failed to create'); }
    finally { setSaving(false); }
  };

  const handleProgress = async (g, delta) => {
    const p = Math.min(100, Math.max(0, g.progress + delta));
    const status = p >= 100 ? 'completed' : 'active';
    try {
      const r = await goalsAPI.update(g.id, { progress: p, status });
      setGoals(prev => prev.map(x => x.id===g.id ? r.data : x));
      if (p >= 100) toast.success('🎉 Goal completed!');
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete goal?')) return;
    try { await goalsAPI.delete(id); setGoals(prev => prev.filter(g => g.id!==id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  const filtered = goals.filter(g => filter==='all' || g.status===filter);
  const active = goals.filter(g=>g.status==='active').length;
  const done = goals.filter(g=>g.status==='completed').length;

  const CAT_COLORS = { personal:'text-purple-400', health:'text-green-400', career:'text-blue-400', finance:'text-yellow-400', learning:'text-pink-400', relationships:'text-red-400' };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl font-bold">Goals</h1>
          <p className="text-muted-foreground text-sm">{active} active · {done} completed</p>
        </div>
        <button onClick={()=>setShowAdd(true)} className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all" style={{boxShadow:'0 0 20px rgba(0,212,170,0.3)'}}>
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 animate-fade-up" style={{animationDelay:'50ms',opacity:0}}>
        {['all','active','completed'].map(f => (
          <button key={f} onClick={()=>setFilter(f)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${filter===f?'bg-primary text-primary-foreground':'bg-secondary text-muted-foreground hover:text-foreground'}`}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="h-28 bg-card border border-border rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No {filter!=='all'?filter+' ':''} goals yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((g, i) => (
            <div key={g.id} className="bg-card border border-border rounded-2xl p-5 animate-fade-up group" style={{animationDelay:`${i*50}ms`,opacity:0}}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{g.emoji}</span>
                  <div>
                    <div className="font-semibold text-sm">{g.title}</div>
                    <span className={`text-xs font-medium capitalize ${CAT_COLORS[g.category]||'text-muted-foreground'}`}>{g.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {g.status==='completed' && <span className="text-xs text-green-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Done</span>}
                  <span className="font-display font-bold text-lg text-primary">{g.progress}%</span>
                  <button onClick={()=>handleDelete(g.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="relative h-2 bg-secondary rounded-full overflow-hidden mb-3">
                <div className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-500" style={{width:`${g.progress}%`}} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Target: {g.target_date}</span>
                {g.status==='active' && (
                  <div className="flex gap-2">
                    <button onClick={()=>handleProgress(g,-10)} className="px-3 py-1 bg-secondary rounded-lg text-xs hover:bg-secondary/70 transition-all">−10%</button>
                    <button onClick={()=>handleProgress(g,10)} className="px-3 py-1 bg-primary/20 text-primary rounded-lg text-xs hover:bg-primary/30 transition-all">+10%</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e=>{if(e.target===e.currentTarget)setShowAdd(false)}}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-base">New Goal</h3>
              <button onClick={()=>setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Title *</label>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="What do you want to achieve?"
                  className="w-full bg-secondary border border-border rounded-xl h-11 px-4 text-sm outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Emoji</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map(e=>(
                    <button key={e} type="button" onClick={()=>setForm(f=>({...f,emoji:e}))}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${form.emoji===e?'bg-primary/20 ring-2 ring-primary':'bg-secondary hover:bg-secondary/70'}`}>{e}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Category</label>
                  <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}
                    className="w-full bg-secondary border border-border rounded-xl h-11 px-3 text-sm outline-none focus:border-primary capitalize">
                    {CATS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Target date *</label>
                  <input type="date" value={form.target_date} onChange={e=>setForm(f=>({...f,target_date:e.target.value}))}
                    className="w-full bg-secondary border border-border rounded-xl h-11 px-3 text-sm outline-none focus:border-primary" />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={()=>setShowAdd(false)} className="flex-1 h-11 bg-secondary border border-border rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 h-11 bg-primary text-primary-foreground rounded-xl text-sm font-semibold disabled:opacity-50">
                  {saving?'Creating...':'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
