from fastapi import APIRouter

from app.api.v1 import health, laps, runs, sessions, telemetry

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(sessions.router)
api_router.include_router(runs.router)
api_router.include_router(laps.router)
api_router.include_router(telemetry.router)
