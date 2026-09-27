#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

echo "=== Running ApexIQ Backend Tests ==="
cd "$DIR/backend"
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi
PYTHONPATH=. pytest tests -v
ruff check app tests

echo "=== Running ApexIQ Frontend Verification ==="
cd "$DIR/frontend"
npm run type-check
npm run lint
npm run build

echo "=== All Tests and Type Checks Passed Successfully ==="
