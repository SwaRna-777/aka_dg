#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ⚡ HabitAI — Starting"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

[ -z "$MONGO_URL" ]      && echo "⚠️  Set MONGO_URL in Secrets"
[ -z "$OPENAI_API_KEY" ] && echo "⚠️  Set OPENAI_API_KEY for AI features"

# ── Backend ──────────────────────────────────────────────────────────────────
echo "📦 Installing Python deps..."
cd backend
pip install -r requirements.txt -q 2>&1 | grep -v "already\|Requirement\|^$" || true
echo "🟢 Backend on :8001"
uvicorn server:app --host 0.0.0.0 --port 8001 --reload &

# ── Frontend ──────────────────────────────────────────────────────────────────
cd ../frontend

echo "📦 Installing Node deps..."
# Clean install to avoid stale lock file issues with ajv
rm -rf node_modules package-lock.json 2>/dev/null || true
npm install --legacy-peer-deps 2>&1 | tail -5

echo "🟢 Frontend on :3000"
PORT=3000 BROWSER=none FAST_REFRESH=false react-scripts start &

echo ""
echo "✅ Both services started"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8001"
echo "   API docs: http://localhost:8001/docs"
wait
