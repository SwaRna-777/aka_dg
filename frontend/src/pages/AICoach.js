import React, { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../lib/api';
import { toast } from 'sonner';
import { Bot, Send, Sparkles, BarChart3, FileText, Lightbulb, Zap, RefreshCw, ChevronRight } from 'lucide-react';

const ThinkingDots = () => (
  <div className="flex gap-1 p-3">
    {[0,1,2].map(i=>(
      <div key={i} className="w-2 h-2 rounded-full bg-primary thinking-dot" style={{animationDelay:`${i*0.15}s`}} />
    ))}
  </div>
);

const Section = ({ title, icon: Icon, children, delay=0, aiGlow=false }) => (
  <div className={`bg-card border rounded-2xl p-5 animate-fade-up ${aiGlow?'border-primary/30 ai-glow':'border-border'}`} style={{animationDelay:`${delay}ms`,opacity:0}}>
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-primary" />
      <h2 className="font-display font-bold text-sm">{title}</h2>
    </div>
    {children}
  </div>
);

export default function AICoach() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    { role:'assistant', content:"Hi! I'm your AI habit coach. Ask me anything about your habits, productivity, or how to stay consistent. I can see your habit data and give personalized advice! 🤖" }
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const chatEnd = useRef(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const sendChat = async e => {
    e?.preventDefault();
    if (!input.trim() || chatLoading) return;
    const msg = input.trim();
    setInput('');
    const history = messages.map(m=>({role:m.role,content:m.content}));
    setMessages(prev=>[...prev,{role:'user',content:msg}]);
    setChatLoading(true);
    try {
      const res = await aiAPI.chat({ message:msg, history });
      const d = res.data;
      setMessages(prev=>[...prev,{role:'assistant',content:d.reply,tips:d.tips,action:d.action}]);
    } catch {
      setMessages(prev=>[...prev,{role:'assistant',content:'Sorry, I had trouble connecting. Make sure your OpenAI API key is configured in environment variables.'}]);
    } finally { setChatLoading(false); }
  };

  const runAnalysis = async () => {
    setAnalysisLoading(true); setAnalysis(null);
    try { const r = await aiAPI.analyze(); setAnalysis(r.data); }
    catch { toast.error('Analysis failed — check OpenAI API key'); }
    finally { setAnalysisLoading(false); }
  };

  const runReport = async () => {
    setReportLoading(true); setReport(null);
    try { const r = await aiAPI.weeklyReport(); setReport(r.data); }
    catch { toast.error('Report failed'); }
    finally { setReportLoading(false); }
  };

  const runSuggest = async e => {
    e.preventDefault();
    if (!goalInput.trim()) { toast.error('Enter a goal'); return; }
    setSuggestLoading(true); setSuggestions(null);
    try { const r = await aiAPI.suggestHabits({goal:goalInput}); setSuggestions(r.data); }
    catch { toast.error('Failed to get suggestions'); }
    finally { setSuggestLoading(false); }
  };

  const TABS = [
    { id:'chat',     icon:Bot,       label:'Chat Coach'  },
    { id:'analyze',  icon:BarChart3, label:'Analysis'    },
    { id:'report',   icon:FileText,  label:'Weekly'      },
    { id:'suggest',  icon:Lightbulb, label:'Suggestions' },
  ];

  const QUICK = ['Why am I missing my morning habits?','How do I build a reading habit?','What\'s my best time for exercise?','Give me a 7-day challenge'];

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 animate-fade-up">
        <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center ai-glow">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">AI Coach</h1>
          <p className="text-muted-foreground text-sm">Powered by GPT-4o-mini · personalized to your habits</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-6 animate-fade-up" style={{animationDelay:'50ms',opacity:0}}>
        {TABS.map(({id,icon:Icon,label})=>(
          <button key={id} onClick={()=>setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab===id?'bg-card text-foreground shadow-sm':'text-muted-foreground hover:text-foreground'}`}>
            <Icon className="w-3.5 h-3.5" /><span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── CHAT TAB ── */}
      {activeTab==='chat' && (
        <div className="animate-fade-up" style={{animationDelay:'100ms',opacity:0}}>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.map((m,i)=>(
                <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
                  <div className={`max-w-[85%] ${m.role==='user'?'chat-user':'chat-ai'} px-4 py-3`}>
                    {m.role==='assistant' && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Bot className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-semibold text-primary">AI Coach</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{m.content}</p>
                    {m.tips?.length>0 && (
                      <div className="mt-2 space-y-1">
                        {m.tips.map((t,j)=>(
                          <div key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <ChevronRight className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" /><span>{t}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {m.action && <div className="mt-2 text-xs font-semibold text-primary">→ {m.action}</div>}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="chat-ai"><ThinkingDots /></div>
                </div>
              )}
              <div ref={chatEnd} />
            </div>

            {/* Quick questions */}
            <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
              {QUICK.map(q=>(
                <button key={q} onClick={()=>{setInput(q);}} className="whitespace-nowrap text-xs px-3 py-1.5 bg-secondary rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all flex-shrink-0">{q}</button>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-border p-4">
              <form onSubmit={sendChat} className="flex gap-3">
                <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask your AI coach anything..."
                  className="flex-1 bg-secondary border border-border rounded-xl h-11 px-4 text-sm outline-none focus:border-primary transition-colors" />
                <button type="submit" disabled={chatLoading||!input.trim()} className="w-11 h-11 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-40">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── ANALYZE TAB ── */}
      {activeTab==='analyze' && (
        <div className="space-y-4 animate-fade-up" style={{animationDelay:'100ms',opacity:0}}>
          <button onClick={runAnalysis} disabled={analysisLoading}
            className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-primary/90 transition-all disabled:opacity-50 animate-pulse-glow">
            {analysisLoading ? <><div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /><span>Analyzing your habits...</span></> : <><BarChart3 className="w-5 h-5" /><span>Analyze My Habits</span></>}
          </button>

          {analysis && (
            <>
              <Section title="Analysis" icon={BarChart3} aiGlow>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <div className="font-display text-3xl font-bold text-primary">{analysis.score}</div>
                    <div className="text-xs text-muted-foreground">Productivity Score</div>
                  </div>
                  <p className="text-sm text-muted-foreground flex-1 leading-relaxed">{analysis.analysis}</p>
                </div>
                {analysis.insight && (
                  <div className="ai-bg ai-border rounded-xl p-3 mt-2">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm">{analysis.insight}</p>
                    </div>
                  </div>
                )}
              </Section>

              {analysis.suggestions?.length>0 && (
                <Section title="Personalized Suggestions" icon={Lightbulb}>
                  <div className="space-y-3">
                    {analysis.suggestions.map((s,i)=>(
                      <div key={i} className="flex items-start gap-3 p-3 bg-secondary rounded-xl">
                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</div>
                        <p className="text-sm">{s}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {analysis.patterns?.length>0 && (
                <Section title="Observed Patterns" icon={Zap}>
                  <div className="space-y-2">
                    {analysis.patterns.map((p,i)=>(
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${p.impact==='positive'?'bg-green-500/10 border border-green-500/20':'bg-orange-500/10 border border-orange-500/20'}`}>
                        <span className="text-lg">{p.impact==='positive'?'✅':'⚠️'}</span>
                        <div>
                          <p className="text-sm font-medium">{p.pattern}</p>
                          {p.habits_affected?.length>0 && <p className="text-xs text-muted-foreground mt-0.5">Affects: {p.habits_affected.join(', ')}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}
        </div>
      )}

      {/* ── REPORT TAB ── */}
      {activeTab==='report' && (
        <div className="space-y-4 animate-fade-up" style={{animationDelay:'100ms',opacity:0}}>
          <button onClick={runReport} disabled={reportLoading}
            className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-primary/90 transition-all disabled:opacity-50 animate-pulse-glow">
            {reportLoading ? <><div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /><span>Generating report...</span></> : <><FileText className="w-5 h-5" /><span>Generate Weekly Report</span></>}
          </button>

          {report && (
            <>
              <Section title="Weekly Summary" icon={FileText} aiGlow>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[['Completion','','text-primary',[report.completion_rate+'%']],['Best Habit','','',[report.best_habit||'—']],['Needs Work','','',[report.weak_habit||'—']]].map(([lbl,,col,vals],i)=>(
                    <div key={i} className="bg-secondary rounded-xl p-3 text-center">
                      <div className={`font-display font-bold text-base ${i===0?'text-primary':''}`}>{vals[0]}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{lbl}</div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{report.report}</p>
              </Section>

              {report.wins?.length>0 && (
                <Section title="🏆 This Week's Wins" icon={Sparkles}>
                  <div className="space-y-2">
                    {report.wins.map((w,i)=><div key={i} className="flex items-center gap-2 text-sm"><span className="text-green-400">✓</span>{w}</div>)}
                  </div>
                </Section>
              )}

              <Section title="AI Recommendation" icon={Bot} aiGlow>
                <div className="ai-bg ai-border rounded-xl p-4 mb-3">
                  <p className="text-sm font-medium">{report.recommendation}</p>
                </div>
                {report.next_week_goal && (
                  <div className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-primary">Next Week Goal</p>
                      <p className="text-sm">{report.next_week_goal}</p>
                    </div>
                  </div>
                )}
                {report.motivation && (
                  <div className="mt-3 bg-secondary rounded-xl p-3">
                    <p className="text-xs text-muted-foreground italic">"{report.motivation}"</p>
                  </div>
                )}
              </Section>
            </>
          )}
        </div>
      )}

      {/* ── SUGGEST TAB ── */}
      {activeTab==='suggest' && (
        <div className="space-y-4 animate-fade-up" style={{animationDelay:'100ms',opacity:0}}>
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-display font-bold text-sm mb-3">What do you want to achieve?</h3>
            <form onSubmit={runSuggest} className="flex gap-3">
              <input value={goalInput} onChange={e=>setGoalInput(e.target.value)} placeholder='e.g. "Improve productivity" or "Get fit"'
                className="flex-1 bg-secondary border border-border rounded-xl h-11 px-4 text-sm outline-none focus:border-primary transition-colors" />
              <button type="submit" disabled={suggestLoading} className="px-5 h-11 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2">
                {suggestLoading?<div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />:<><Lightbulb className="w-4 h-4" /><span>Suggest</span></>}
              </button>
            </form>
            <div className="flex gap-2 mt-3 flex-wrap">
              {['Improve productivity','Get fit','Read more','Reduce stress','Sleep better'].map(s=>(
                <button key={s} onClick={()=>setGoalInput(s)} className="text-xs px-3 py-1.5 bg-secondary rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all">{s}</button>
              ))}
            </div>
          </div>

          {suggestions && (
            <>
              {suggestions.goal_analysis && (
                <div className="ai-bg ai-border rounded-2xl p-4">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{suggestions.goal_analysis}</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {suggestions.habits?.map((h,i)=>(
                  <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-fade-up" style={{animationDelay:`${i*60}ms`,opacity:0}}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{h.emoji}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{h.title}</div>
                        <p className="text-xs text-muted-foreground mt-0.5">{h.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 bg-secondary rounded-full capitalize">{h.frequency}</span>
                          <span className="text-xs px-2 py-0.5 bg-secondary rounded-full capitalize">{h.time_of_day}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${h.difficulty==='easy'?'bg-green-500/20 text-green-400':h.difficulty==='hard'?'bg-red-500/20 text-red-400':'bg-yellow-500/20 text-yellow-400'}`}>{h.difficulty}</span>
                        </div>
                        {h.expected_impact && <p className="text-xs text-primary mt-1.5">→ {h.expected_impact}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {suggestions.implementation_tip && (
                <div className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-primary">Implementation Tip</p>
                      <p className="text-sm mt-0.5">{suggestions.implementation_tip}</p>
                    </div>
                  </div>
                  {suggestions.timeline && <p className="text-xs text-muted-foreground mt-2">⏱ {suggestions.timeline}</p>}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
