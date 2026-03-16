#!/bin/bash
echo "🚀 Starting HabitAI..."
[ -z "$MONGO_URL" ] && echo "⚠️  Set MONGO_URL in Replit Secrets!" 
[ -z "$OPENAI_API_KEY" ] && echo "⚠️  Set OPENAI_API_KEY in Replit Secrets for AI features!"
cd backend && pip install -r requirements.txt -q && uvicorn server:app --host 0.0.0.0 --port 8001 --reload &
cd ../frontend && npm install --legacy-peer-deps 2>&1 | tail -3 && PORT=3000 BROWSER=none npm start &
wait
