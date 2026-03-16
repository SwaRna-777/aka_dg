"""
HabitAI — AI Service Layer
Handles all OpenAI API calls with structured prompts and JSON parsing
"""
import os, json, re
from typing import Optional
import httpx

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_MODEL   = "gpt-4o-mini"
OPENAI_URL     = "https://api.openai.com/v1/chat/completions"

SYSTEM_PROMPT = """You are HabitAI — an expert productivity coach and behavioral psychologist 
specializing in habit formation. You analyze user habit data and provide personalized, 
actionable advice grounded in behavioral science.

Your communication style is:
- Encouraging but honest
- Specific and data-driven (reference actual numbers from the data)
- Practical (give concrete, implementable advice)
- Brief (no padding, no filler phrases)

You MUST always respond with valid JSON only. No markdown, no extra text."""


class AIService:
    def __init__(self):
        self.api_key = OPENAI_API_KEY
        self.model   = OPENAI_MODEL

    async def _call(self, messages: list, max_tokens: int = 800) -> str:
        """Make OpenAI API call and return raw text."""
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not set in environment variables")

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                OPENAI_URL,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "max_tokens": max_tokens,
                    "temperature": 0.7,
                    "response_format": {"type": "json_object"}
                }
            )
        if resp.status_code != 200:
            err = resp.json().get("error", {}).get("message", "OpenAI API error")
            raise ValueError(f"OpenAI error: {err}")
        return resp.json()["choices"][0]["message"]["content"]

    def _parse(self, raw: str) -> dict:
        """Safely parse JSON from AI response."""
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            # Try to extract JSON from response
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                return json.loads(match.group())
            raise ValueError("Could not parse AI response as JSON")

    # ── 1. Habit Analysis ─────────────────────────────────────────────────────
    async def analyze_habits(self, habit_data: dict, user_name: str) -> dict:
        habits_text = json.dumps(habit_data["habits"], indent=2)
        summary = habit_data["summary"]

        prompt = f"""Analyze the habit data for {user_name} and provide insights.

HABIT DATA:
{habits_text}

SUMMARY:
- Total habits: {summary['total_habits']}
- Done today: {summary['done_today']}
- Weekly completion: {summary['weekly_completion_pct']}%

Respond with this exact JSON structure:
{{
  "analysis": "2-3 sentence observation about their habit patterns, referencing specific data",
  "score": <0-100 productivity score based on consistency>,
  "patterns": [
    {{"pattern": "observed pattern", "impact": "positive/negative", "habits_affected": ["habit names"]}}
  ],
  "suggestions": [
    "Specific suggestion 1 with reasoning",
    "Specific suggestion 2 with reasoning", 
    "Specific suggestion 3 with reasoning"
  ],
  "best_habit": "name of their most consistent habit",
  "needs_work": "name of habit needing most improvement",
  "insight": "one powerful behavioral insight about their data"
}}"""

        try:
            raw = await self._call([
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": prompt}
            ], max_tokens=900)
            return self._parse(raw)
        except Exception as e:
            return self._fallback_analysis(habit_data, str(e))

    # ── 2. Chat Coach ─────────────────────────────────────────────────────────
    async def chat(self, message: str, habit_data: dict, user_name: str, history: list) -> dict:
        habits_brief = [{
            "name": h["name"],
            "streak": h["streak"],
            "rate_7d": h["completion_rate_7d"]
        } for h in habit_data["habits"]]

        system = f"""{SYSTEM_PROMPT}

Current habit context for {user_name}:
{json.dumps(habits_brief, indent=2)}
Weekly completion: {habit_data['summary']['weekly_completion_pct']}%

Answer the user's question as their personal habit coach. Be specific, warm, and practical.
Respond with JSON: {{"reply": "your coaching response", "tips": ["tip1", "tip2"], "action": "one immediate action they can take"}}"""

        messages = [{"role": "system", "content": system}]
        # Include conversation history (last 6 messages)
        for h in (history or [])[-6:]:
            messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
        messages.append({"role": "user", "content": message})

        try:
            raw = await self._call(messages, max_tokens=600)
            result = self._parse(raw)
            return {
                "reply": result.get("reply", ""),
                "tips": result.get("tips", []),
                "action": result.get("action", "")
            }
        except Exception as e:
            return {
                "reply": f"I had trouble processing that. Try asking about a specific habit or your weekly patterns.",
                "tips": ["Check your OpenAI API key is set correctly"],
                "action": "Retry your question"
            }

    # ── 3. Weekly Report ──────────────────────────────────────────────────────
    async def weekly_report(self, habit_data: dict, user_name: str) -> dict:
        habits_text = json.dumps(habit_data["habits"], indent=2)
        summary = habit_data["summary"]

        prompt = f"""Generate a weekly habit report for {user_name}.

HABIT DATA (last 7 days):
{habits_text}

WEEKLY SUMMARY:
- Completion rate: {summary['weekly_completion_pct']}%
- Total habits: {summary['total_habits']}
- Done today: {summary['done_today']}

Respond with this exact JSON:
{{
  "report": "3-4 sentence narrative summary of their week",
  "completion_rate": {summary['weekly_completion_pct']},
  "best_habit": "most consistent habit name",
  "weak_habit": "least consistent habit name",
  "recommendation": "top recommendation for next week",
  "wins": ["win 1", "win 2", "win 3"],
  "focus_areas": ["area needing improvement 1", "area 2"],
  "streak_highlights": [{{"habit": "name", "streak": 0, "note": "brief note"}}],
  "next_week_goal": "specific measurable goal for next week",
  "motivation": "personalized motivational message referencing their specific data"
}}"""

        try:
            raw = await self._call([
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": prompt}
            ], max_tokens=1000)
            return self._parse(raw)
        except Exception as e:
            return self._fallback_report(habit_data, str(e))

    # ── 4. Suggest Habits ─────────────────────────────────────────────────────
    async def suggest_habits(self, goal: str, existing: list, user_name: str) -> dict:
        existing_str = ", ".join(existing) if existing else "none yet"

        prompt = f"""Suggest habits for {user_name} to achieve their goal: "{goal}"

They already track: {existing_str}

Respond with this exact JSON:
{{
  "goal_analysis": "brief analysis of what this goal requires behaviorally",
  "habits": [
    {{
      "title": "habit name",
      "description": "why this habit helps the goal",
      "emoji": "relevant emoji",
      "frequency": "daily/weekdays/weekly",
      "time_of_day": "morning/afternoon/evening",
      "difficulty": "easy/medium/hard",
      "expected_impact": "what improvement to expect"
    }}
  ],
  "implementation_tip": "how to start these habits without overwhelm",
  "timeline": "realistic timeline to see results"
}}

Suggest 5 specific, actionable habits. Avoid duplicating existing habits."""

        try:
            raw = await self._call([
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": prompt}
            ], max_tokens=900)
            return self._parse(raw)
        except Exception as e:
            return {
                "goal_analysis": f"To achieve '{goal}', you need consistent daily actions.",
                "habits": [
                    {"title": "Morning Planning", "description": "Plan your day", "emoji": "📋",
                     "frequency": "daily", "time_of_day": "morning", "difficulty": "easy", "expected_impact": "Better focus"},
                    {"title": "Deep Work Session", "description": "2 hours uninterrupted work", "emoji": "🎯",
                     "frequency": "daily", "time_of_day": "morning", "difficulty": "medium", "expected_impact": "High productivity"},
                    {"title": "Evening Reflection", "description": "Review your day", "emoji": "🌙",
                     "frequency": "daily", "time_of_day": "evening", "difficulty": "easy", "expected_impact": "Continuous improvement"},
                ],
                "implementation_tip": "Start with just one habit and add more after 2 weeks.",
                "timeline": "Expect noticeable results in 4-6 weeks."
            }

    # ── 5. Motivation Boost ───────────────────────────────────────────────────
    async def motivation_boost(self, habit_data: dict, user_name: str) -> dict:
        best = max(habit_data["habits"], key=lambda h: h["streak"], default=None) if habit_data["habits"] else None
        best_streak = best["streak"] if best else 0
        best_name = best["name"] if best else "your habits"

        prompt = f"""Give {user_name} a personalized motivational boost.

Their data:
- Best streak: {best_streak} days ({best_name})
- Weekly completion: {habit_data['summary']['weekly_completion_pct']}%
- Active habits: {habit_data['summary']['total_habits']}

Respond with JSON:
{{
  "message": "powerful 2-3 sentence motivational message referencing their actual data",
  "quote": "relevant motivational quote",
  "challenge": "a specific 7-day challenge based on their current habits",
  "milestone": "next milestone to aim for"
}}"""

        try:
            raw = await self._call([
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": prompt}
            ], max_tokens=400)
            return self._parse(raw)
        except:
            return {
                "message": f"You're building something great, {user_name}! Every day you show up counts.",
                "quote": "We are what we repeatedly do. Excellence, then, is not an act, but a habit. — Aristotle",
                "challenge": "Complete all your habits for 7 consecutive days",
                "milestone": f"Reach a {best_streak + 7}-day streak"
            }

    # ── Fallbacks (no OpenAI key) ─────────────────────────────────────────────
    def _fallback_analysis(self, habit_data: dict, error: str) -> dict:
        habits = habit_data["habits"]
        if not habits:
            return {"analysis": "Add habits to get AI analysis.", "score": 0, "suggestions": [], "patterns": []}
        best = max(habits, key=lambda h: h["completion_rate_30d"], default=habits[0])
        worst = min(habits, key=lambda h: h["completion_rate_30d"], default=habits[0])
        avg_rate = sum(h["completion_rate_30d"] for h in habits) // len(habits)
        return {
            "analysis": f"You're tracking {len(habits)} habits with an average 30-day completion rate of {avg_rate}%. {best['name']} is your strongest habit.",
            "score": avg_rate,
            "patterns": [{"pattern": f"{best['name']} shows great consistency", "impact": "positive", "habits_affected": [best["name"]]}],
            "suggestions": [
                f"Focus on improving {worst['name']} — it's at {worst['completion_rate_30d']}% completion",
                "Stack new habits onto your existing strong ones",
                "Review your habit schedule if weekend completion is lower"
            ],
            "best_habit": best["name"],
            "needs_work": worst["name"],
            "insight": "Note: Connect OpenAI API key for AI-powered insights."
        }

    def _fallback_report(self, habit_data: dict, error: str) -> dict:
        summary = habit_data["summary"]
        habits = habit_data["habits"]
        best = max(habits, key=lambda h: h["completion_rate_7d"], default=None) if habits else None
        worst = min(habits, key=lambda h: h["completion_rate_7d"], default=None) if habits else None
        return {
            "report": f"This week you completed {summary['weekly_completion_pct']}% of your habits. Keep building momentum!",
            "completion_rate": summary["weekly_completion_pct"],
            "best_habit": best["name"] if best else "N/A",
            "weak_habit": worst["name"] if worst else "N/A",
            "recommendation": "Focus on your weakest habit next week.",
            "wins": [f"Tracked {summary['total_habits']} habits", f"{summary['weekly_completion_pct']}% weekly completion"],
            "focus_areas": [worst["name"] if worst else "Add more habits"],
            "streak_highlights": [],
            "next_week_goal": f"Reach {min(summary['weekly_completion_pct']+10, 100)}% completion",
            "motivation": "Every habit completed is a vote for the person you want to become."
        }
