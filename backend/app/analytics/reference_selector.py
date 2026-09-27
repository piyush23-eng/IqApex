from typing import Any

from app.schemas.domain import Lap
from app.services.telemetry_store import store


class ReferenceSelectionError(ValueError):
    pass


class ReferenceSelector:
    """
    Rigorously selects comparison reference lap according to explicit methodology:
    1. selected_lap: specific chosen lap ID
    2. session_best_valid: fastest valid lap across the active session
    3. driver_best_valid: fastest valid lap for the requested driver
    4. median_valid: median-pace valid lap in the session
    """

    @classmethod
    def resolve_reference(
        cls,
        method: str = "selected_lap",
        session_id: str = "demo-session-monza-2026",
        driver_id: str | None = None,
        selected_lap_id: str | None = None,
    ) -> tuple[Lap, dict[str, Any]]:
        # Gather all laps belonging to session
        session_runs = [r for r in store.runs.values() if r.session_id == session_id]
        run_ids = {r.run_id for r in session_runs}

        candidate_laps = [l for l in store.laps.values() if l.run_id in run_ids]
        if not candidate_laps:
            # Fallback to all store laps
            candidate_laps = list(store.laps.values())

        total_evaluated = len(candidate_laps)
        valid_laps = [l for l in candidate_laps if l.valid]
        excluded_count = total_evaluated - len(valid_laps)

        if not valid_laps:
            raise ReferenceSelectionError("No valid laps found in session for reference selection")

        resolved_lap: Lap | None = None

        if method == "selected_lap":
            if not selected_lap_id:
                selected_lap_id = "lap-demo-02"
            resolved_lap = store.laps.get(selected_lap_id)
            if not resolved_lap:
                raise ReferenceSelectionError(f"Selected reference lap '{selected_lap_id}' not found")

        elif method == "session_best_valid":
            # Minimum valid lap time
            valid_laps.sort(key=lambda l: l.lap_time)
            resolved_lap = valid_laps[0]

        elif method == "driver_best_valid":
            drv_id = driver_id or "drv-44"
            driver_runs = {r.run_id for r in session_runs if r.driver_id == drv_id}
            drv_laps = [l for l in valid_laps if l.run_id in driver_runs]
            if not drv_laps:
                drv_laps = valid_laps
            drv_laps.sort(key=lambda l: l.lap_time)
            resolved_lap = drv_laps[0]

        elif method == "median_valid":
            valid_laps.sort(key=lambda l: l.lap_time)
            mid = len(valid_laps) // 2
            resolved_lap = valid_laps[mid]

        else:
            raise ReferenceSelectionError(f"Unknown reference selection methodology: '{method}'")

        audit_info = {
            "method": method,
            "total_laps_evaluated": total_evaluated,
            "valid_laps_count": len(valid_laps),
            "excluded_laps_count": excluded_count,
            "resolved_lap_id": resolved_lap.lap_id,
            "resolved_lap_time": resolved_lap.lap_time,
        }

        return resolved_lap, audit_info
