#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

echo "=== Starting ApexIQ Engineering Platform Dev Environment ==="

# Trap to kill background children on exit
cleanup() {
    echo "Terminating dev processes..."
    kill 0
}
trap cleanup EXIT INT TERM

# Start Backend
echo "Starting Backend API on http://localhost:8000..."
cd "$DIR/backend"
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &

# Start Frontend
echo "Starting Frontend Workstation on http://localhost:5173..."
cd "$DIR/frontend"
npm run dev &

wait
