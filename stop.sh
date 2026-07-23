#!/bin/bash
# F.R.I.D.A.Y. — Stop all services
FRIDAY_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "  Shutting down FRIDAY..."
kill -9 $(lsof -t -i:8000) 2>/dev/null && echo "  ✅ Backend stopped"
kill -9 $(lsof -t -i:5173) 2>/dev/null && echo "  ✅ Frontend stopped"
echo "  🔴 FRIDAY offline."
