import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { habitsAPI, aiAPI } from '../lib/api';
import { toast } from 'sonner';
import { Flame, Target, Sparkles, RefreshCw, Zap, Trophy, TrendingUp } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats]     = useState(null);
  const [motivation, setMotivation] = useState(null);
  const [loadingMot, setLoadingMot] = useState(false);

  useEffect(() => {
    habitsAPI.stats().then(r => setStats(r.data)).catch(() => {});
  }, []);

  const getMotivation = async () => {
    setLoadingMot(true);
    try {
      const r = await aiAPI.motivate();
      setMotivation(r.data);
      toast.success('Motivation boost loaded! 💪');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed. Check OPENAI_API_KEY.');
    }
    setLoadingMot(false);
  };

  const STAT_CARDS = stats ? [
    { label: 'Active Habits',    value: stats.total_habits,       emoji: '⚡', color: 'text-ai' },
    { label: 'Done Today',       value: stats.done_today,          emoji: '✅', color: 'text-ai' },
    { label: 'Weekly Rate',      value: `${stats.weekly_completion}%`, emoji: '📊', color: 'text-yellow-400' },
    { label: 'Best Streak',      value: `${stats.best_streak}d`,   emoji: '🔥', color: 'text-orange-400' },
    { label: 'Active Goals',     value: stats.goals_active,        emoji: '🎯', color: 'text-purple-400' },
    { label: 'Total Check-ins',  value: stats.total_completions,   emoji: '🏆', color: 'text-yellow-500' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-card border border-border rounded-2xl p-6 animate-fade-up">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-ai/10 border border-ai/30 flex items-center justify-center text-2xl font-display font-bold text-ai animate-pulse-glow">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">{user?.name}</h1>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-ai/10 border border-ai/25 text-ai px-2 py-0.5 rounded-full font-mono">✨ HabitAI Member</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-up">
          {STAT_CARDS.map(({ label, value, emoji, color }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-4 text-center">
              <div className="text-2xl mb-2">{emoji}</div>
              <div className={`text-2xl font-display font-bold ${color}`}>{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Weekly progress bars */}
      {stats && (
        <div className="bg-card border border-border rounded-2xl p-6 animate-fade-up">
          <h3 className="font-display font-bold mb-4">This Week</h3>
          {[
            { label: 'Habit Completion', value: stats.weekly_completion, color: 'bg-ai' },
            { label: 'Today Progress',   value: stats.total_habits ? Math.round(stats.done_today / stats.total_habits * 100) : 0, color: 'bg-purple-500' },
            { label: 'Streak Health',    value: Math.min(stats.best_streak * 10, 100), color: 'bg-orange-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="mb-4 last:mb-0">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono font-bold">{value}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Motivation Boost */}
      <div className="bg-card border border-ai/20 rounded-2xl p-6 ai-bg animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-ai" />
            <h3 className="font-display font-bold">AI Motivation Boost</h3>
          </div>
          <button onClick={getMotivation} disabled={loadingMot}
            className="flex items-center gap-2 px-4 py-2 bg-ai text-background rounded-xl text-sm font-semibold hover:bg-ai/90 transition-all disabled:opacity-50">
            {loadingMot ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            {loadingMot ? 'Loading...' : 'Get Motivated'}
          </button>
        </div>

        {motivation ? (
          <div className="space-y-4 animate-fade-up">
            <div className="px-4 py-4 rounded-xl bg-ai/5 border border-ai/15">
              <p className="text-sm leading-relaxed">{motivation.message}</p>
            </div>
            {motivation.quote && (
              <div className="px-4 py-3 border-l-2 border-ai">
                <p className="text-sm italic text-muted-foreground">"{motivation.quote}"</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {motivation.challenge && (
                <div className="p-3 rounded-xl bg-secondary/50">
                  <div className="text-xs text-ai font-semibold font-mono mb-1">7-DAY CHALLENGE</div>
                  <p className="text-sm">{motivation.challenge}</p>
                </div>
              )}
              {motivation.milestone && (
                <div className="p-3 rounded-xl bg-secondary/50">
                  <div className="text-xs text-yellow-400 font-semibold font-mono mb-1">NEXT MILESTONE</div>
                  <p className="text-sm">{motivation.milestone}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Click "Get Motivated" for a personalized AI pep talk based on your habit data.
          </p>
        )}
      </div>
    </div>
  );
}
