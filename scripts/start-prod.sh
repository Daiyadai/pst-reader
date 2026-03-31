#!/bin/bash
# Production startup - runs both backend and frontend

cd /app

# Start backend on port 8000
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &

# Start frontend on port 3000
cd frontend && npx next start --port 3000 &

# Wait for either to exit
wait -n
exit $?
