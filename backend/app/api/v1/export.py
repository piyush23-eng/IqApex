"""
Telemetry Export API endpoint.
Enables exporting aligned 1m spatial telemetry laps into CSV format
compatible with external motorsport telemetry packages (MoTeC i2, McLaren ATLAS).
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import PlainTextResponse
from app.services.telemetry_store import store

router = APIRouter()


@router.get(
    "/telemetry/{lap_id}/export/csv",
    response_class=PlainTextResponse,
    tags=["Export"],
)
def export_lap_telemetry_csv(
    lap_id: str,
    channels: str = Query("timestamp,distance,speed,throttle,brake,gear,lat_acc,long_acc", description="Comma-separated channel list"),
) -> str:
    """Exports distance-aligned telemetry for a lap in CSV format."""
    df = store.get_lap_dataframe(lap_id)
    if df is None:
        raise HTTPException(status_code=404, detail=f"Lap '{lap_id}' telemetry trace not found")

    selected_cols = [c.strip() for c in channels.split(",") if c.strip() in df.columns]
    if not selected_cols:
        selected_cols = ["timestamp", "distance", "speed", "throttle", "brake", "gear"]

    return df[selected_cols].to_csv(index=False)
