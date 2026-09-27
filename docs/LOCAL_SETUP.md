# ApexIQ — Local & Docker Deployment Guide

---

## 1. Quick Start with Docker Compose

ApexIQ is fully containerized with Docker and Docker Compose. This starts the PostgreSQL database, FastAPI backend, and React/Vite frontend in isolated containers.

### Prerequisites
* Docker Desktop 4.20+ or Docker Engine 24.0+
* Docker Compose v2.20+

### Steps
```bash
# 1. Clone the repository
git clone https://github.com/baleshwarpandit/apexiq.git
cd apexiq

# 2. Configure environment variables (safe defaults are provided)
cp .env.example .env

# 3. Start containers in detached mode
docker compose up --build -d

# 4. Access the workstation
# Frontend: http://localhost:5173
# Backend API Docs: http://localhost:8000/docs
# Health Endpoint: http://localhost:8000/health
```

To shut down services and clean up volumes:
```bash
docker compose down -v
```

---

## 2. Bare-Metal Local Development Setup

### Backend (Python 3.11 – 3.13)
```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Run automated tests
pytest tests/ -q

# Start FastAPI development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend (Node.js 18+)
```bash
cd frontend

# Install dependencies
npm install

# Run static type validation
npm run type-check

# Run linter
npm run lint

# Start Vite dev server
npm run dev
```

Open `http://localhost:5173` to interact with the workstation.
