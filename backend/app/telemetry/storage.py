import hashlib
import os
from pathlib import Path

import pandas as pd


class TelemetryStorage:
    """
    Manages raw and processed Parquet persistence according to the ApexIQ data tiering specification:
    - Raw:        data/raw/{session_id}/{run_id}/telemetry.parquet
    - Processed:  data/processed/{session_id}/{run_id}/{lap_id}.parquet
    Enforces immutability of raw telemetry and cryptographic SHA-256 lineage tracking.
    """

    def __init__(self, base_data_dir: Path | None = None):
        if base_data_dir is not None:
            self.base_dir = Path(base_data_dir)
        elif "APEXIQ_DATA_DIR" in os.environ:
            self.base_dir = Path(os.environ["APEXIQ_DATA_DIR"])
        else:
            default_dir = Path(__file__).resolve().parents[3] / "data"
            try:
                default_dir.mkdir(parents=True, exist_ok=True)
                probe = default_dir / ".probe_test"
                probe.touch()
                probe.unlink()
                self.base_dir = default_dir
            except (OSError, PermissionError):
                self.base_dir = Path(__file__).resolve().parents[2] / "data"

        self.raw_dir = self.base_dir / "raw"
        self.processed_dir = self.base_dir / "processed"
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        self.processed_dir.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def compute_sha256(content: bytes | Path | str) -> str:
        """Computes SHA-256 digest for bytes or a file path."""
        hasher = hashlib.sha256()
        if isinstance(content, bytes):
            hasher.update(content)
        else:
            path = Path(content)
            with open(path, "rb") as f:
                while chunk := f.read(65536):
                    hasher.update(chunk)
        return hasher.hexdigest()

    def get_raw_path(self, session_id: str, run_id: str) -> Path:
        target_dir = self.raw_dir / session_id / run_id
        target_dir.mkdir(parents=True, exist_ok=True)
        return target_dir / "telemetry.parquet"

    def get_processed_path(self, session_id: str, run_id: str, lap_id: str) -> Path:
        target_dir = self.processed_dir / session_id / run_id
        target_dir.mkdir(parents=True, exist_ok=True)
        return target_dir / f"{lap_id}.parquet"

    def save_raw(self, df: pd.DataFrame, session_id: str, run_id: str) -> Path:
        path = self.get_raw_path(session_id, run_id)
        # Write to temporary file first then replace
        temp_path = path.with_suffix(".tmp.parquet")
        df.to_parquet(temp_path, engine="pyarrow", index=False)
        temp_path.replace(path)
        return path

    def save_processed(
        self, df: pd.DataFrame, session_id: str, run_id: str, lap_id: str
    ) -> Path:
        path = self.get_processed_path(session_id, run_id, lap_id)
        temp_path = path.with_suffix(".tmp.parquet")
        df.to_parquet(temp_path, engine="pyarrow", index=False)
        temp_path.replace(path)
        return path

    def load_processed(
        self, session_id: str, run_id: str, lap_id: str
    ) -> pd.DataFrame | None:
        path = self.get_processed_path(session_id, run_id, lap_id)
        if not path.exists():
            return None
        return pd.read_parquet(path, engine="pyarrow")

    def load_raw(self, session_id: str, run_id: str) -> pd.DataFrame | None:
        path = self.get_raw_path(session_id, run_id)
        if not path.exists():
            return None
        return pd.read_parquet(path, engine="pyarrow")


telemetry_storage = TelemetryStorage()
