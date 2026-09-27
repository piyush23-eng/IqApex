from fastapi import APIRouter, HTTPException, Query

from app.schemas.domain import Session
from app.schemas.responses import SessionDetailResponse
from app.services.telemetry_store import DEMO_DATA_LABEL, store

router = APIRouter()


@router.get("/sessions", response_model=list[Session], tags=["Sessions"])
def list_sessions(
    include_demo: bool = Query(
        True, description="Include clearly labeled synthetic demonstration session"
    ),
) -> list[Session]:
    """Retrieve list of registered trackside sessions."""
    if include_demo:
        return list(store.sessions.values())
    return [s for s in store.sessions.values() if not s.session_id.startswith("demo-")]


@router.get(
    "/sessions/{session_id}", response_model=SessionDetailResponse, tags=["Sessions"]
)
def get_session(session_id: str) -> SessionDetailResponse:
    """Retrieve detailed session metadata, enrolled drivers, and executed runs."""
    session = store.sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")

    is_demo = session_id.startswith("demo-")
    label = DEMO_DATA_LABEL if is_demo else "Official trackside session"

    session_runs = [r for r in store.runs.values() if r.session_id == session_id]
    session_drivers = list(store.drivers.values())

    return SessionDetailResponse(
        session=session,
        data_label=label,
        drivers=session_drivers,
        runs=session_runs,
    )
