from fastapi import APIRouter, HTTPException

from app.schemas.responses import RunDetailResponse
from app.services.telemetry_store import DEMO_DATA_LABEL, store

router = APIRouter()


@router.get("/runs/{run_id}", response_model=RunDetailResponse, tags=["Runs"])
def get_run(run_id: str) -> RunDetailResponse:
    """Retrieve executed run metadata, driver allocation, and lap times."""
    run = store.runs.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")

    driver = store.drivers.get(run.driver_id)
    laps = [lap for lap in store.laps.values() if lap.run_id == run_id]
    is_demo = run_id.startswith("run-03-") or run.session_id.startswith("demo-")
    label = DEMO_DATA_LABEL if is_demo else "Official trackside run"

    return RunDetailResponse(
        run=run,
        data_label=label,
        driver=driver,
        laps=laps,
    )
