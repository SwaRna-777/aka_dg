# 🤖 rabbit — AI-Powered 

A full-stack habit tracking app with **4 AI features** powered by GPT-4o-mini.

## ✨ Features

### Core App
- ✅ User authentication (JWT + bcrypt)
- ✅ Habit tracking with streaks, completion rates, day-of-week analysis
- ✅ Goals with progress tracking
- ✅ Beautiful dark UI with real-time updates

### AI Features (GPT-4o-mini)
| Feature | Endpoint | Description |
|---------|----------|-------------|
| 🔍 Habit Analysis | `POST /api/ai/analyze-habits` | Personalized insights + productivity score |
| 💬 AI Chat Coach | `POST /api/ai/chat` | Conversational coaching with habit context |
| 📊 Weekly Report | `POST /api/ai/weekly-report` | Full weekly summary + recommendations |
| 💡 Habit Suggestions | `POST /api/ai/suggest-habits` | AI-recommended habits for any goal |
| ⚡ Motivation Boost | `POST /api/ai/motivate` | Personalized motivation + 7-day challenge |

## 🚀 Replit Setup

### Step 1 — Secrets (Required)
In Replit → **Secrets** tab, add:

| Key | Value |
|-----|-------|
| `MONGO_URL` | `mongodb+srv://user:pass@cluster.mongodb.net/habitai` |
| `JWT_SECRET` | Any 32+ char random string |
| `OPENAI_API_KEY` | `sk-...` from platform.openai.com |

> 🆓 Free MongoDB: [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
> 🤖 OpenAI key: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### Step 2 — Set Frontend URL
In `frontend/.env`, set your Replit URL:
```
REACT_APP_BACKEND_URL=https://your-repl.your-username.repl.co
```

### Step 3 — Run
Click **Run** → both services start automatically.

## 📁 Architecture

```
habitai/
├── backend/
│   ├── server.py              ← FastAPI app + auth routes
│   ├── requirements.txt
│   ├── routers/
│   │   ├── habits.py          ← CRUD + toggle + stats
│   │   ├── goals.py           ← CRUD + progress
│   │   └── ai.py              ← 5 AI endpoints
│   └── services/
│       └── ai_service.py      ← OpenAI integration (GPT-4o-mini)
└── frontend/
    └── src/
        ├── pages/
        │   ├── Dashboard.js   ← Stats + today's habits + motivation
        │   ├── Habits.js      ← Full habit management + rings
        │   ├── Goals.js       ← Goal tracking with progress
        │   └── AICoach.js     ← All 4 AI features in one page
        ├── context/AuthContext.js
        └── lib/api.js         ← All API calls
```

## 🔧 Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001

# Frontend
cd frontend
npm install --legacy-peer-deps
PORT=3000 npm start
```

## 🛠 Troubleshooting

**White screen**: `cd frontend && rm -rf node_modules && npm install --legacy-peer-deps`

**AI not working**: Check `OPENAI_API_KEY` is set in Replit Secrets (not just .env)

**MongoDB error**: Check `MONGO_URL` secret + Atlas IP whitelist (set to 0.0.0.0/0)
