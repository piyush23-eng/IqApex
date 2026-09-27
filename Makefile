.PHONY: help install test lint type-check build demo clean docker-up docker-down

PYTHON = backend/.venv/bin/python3
PYTEST = backend/.venv/bin/pytest
RUFF = backend/.venv/bin/ruff

help:
	@echo "ApexIQ — Motorsport Engineering Decision-Support Platform"
	@echo ""
	@echo "Available commands:"
	@echo "  make demo        Run end-to-end reproducible analytical demonstration"
	@echo "  make test        Execute full backend test suite (148 tests)"
	@echo "  make lint        Run backend Ruff linter & frontend ESLint"
	@echo "  make type-check  Run frontend TypeScript static type validation"
	@echo "  make build       Build frontend production bundle"
	@echo "  make docker-up   Launch PostgreSQL, Backend, and Frontend containers"
	@echo "  make docker-down Terminate Docker containers and volumes"
	@echo "  make clean       Remove cached Python and Vite build artifacts"

install:
	cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
	cd frontend && npm install

demo:
	PYTHONPATH=backend $(PYTHON) scripts/run_demo.py

test:
	cd backend && PYTHONPATH=. ../$(PYTEST) tests/ -q

lint:
	cd backend && ../$(RUFF) check app tests
	cd frontend && npm run lint

type-check:
	cd frontend && npm run type-check

build:
	cd frontend && npm run build

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

clean:
	rm -rf backend/.pytest_cache frontend/dist frontend/node_modules/.vite
	find . -type d -name "__pycache__" -exec rm -rf {} +
