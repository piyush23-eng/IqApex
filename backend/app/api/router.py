from fastapi import APIRouter

from app.api.v1 import (
    analysis,
    decomposition,
    health,
    laps,
    optimization,
    runs,
    sensitivity,
    sessions,
    statistics,
    strategy,
    telemetry,
    telemetry_pipeline,
    vehicle_performance,
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
api_router.include_router(optimization.router)
api_router.include_router(sensitivity.router)
api_router.include_router(vehicle_performance.router)
api_router.include_router(strategy.router)


