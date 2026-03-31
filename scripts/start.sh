#!/bin/bash
# Start PST Image Reader - both backend and frontend

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "=== PST Image Reader ==="

# Build frontend first
echo "Building frontend..."
cd frontend && npm run build && cd ..

echo "Starting backend (FastAPI) on port 8000..."
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "Starting frontend (Next.js) on port 3000..."
cd frontend && npm run start &
FRONTEND_PID=$!

echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"

cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

wait
