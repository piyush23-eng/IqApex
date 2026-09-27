from fastapi import APIRouter

from app.api.v1 import (
    analysis,
    decomposition,
    health,
    laps,
    runs,
    sessions,
    statistics,
    telemetry,
    telemetry_pipeline,
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(sessions.router)
api_router.include_router(runs.router)
api_router.include_router(laps.router)
api_router.include_router(telemetry.router)
api_router.include_router(telemetry_pipeline.router)
api_router.include_router(analysis.router)
api_router.include_router(decomposition.router)
api_router.include_router(statistics.router)

