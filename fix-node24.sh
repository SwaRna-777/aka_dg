#!/bin/bash
# ── HabitAI: Fix for Node.js v24 ajv incompatibility ──────────────────────
# Run this from the PROJECT ROOT: bash fix-node24.sh

echo "🔧 Fixing Node.js v24 + ajv incompatibility..."

cd frontend

# 1. Remove broken modules
echo "   Removing node_modules..."
rm -rf node_modules package-lock.json yarn.lock

# 2. Remove craco (not needed, causes the issue)
echo "   Removing craco..."
npm pkg delete dependencies['@craco/craco'] 2>/dev/null || true

# 3. Set scripts to use react-scripts directly
echo "   Updating scripts..."
npm pkg set scripts.start="react-scripts start"
npm pkg set scripts.build="react-scripts build"
npm pkg set scripts.test="react-scripts test"

# 4. Pin ajv v8 and ajv-keywords v5 (fix the root cause)
echo "   Pinning ajv@8 and ajv-keywords@5..."
npm pkg set overrides.ajv="8.17.1"
npm pkg set overrides.ajv-keywords="5.1.0"
npm pkg set overrides.core-js-pure="3.36.1"

# 5. Fresh install
echo "   Installing packages..."
npm install --legacy-peer-deps

echo ""
echo "✅ Fixed! Run: PORT=3000 npm start"
