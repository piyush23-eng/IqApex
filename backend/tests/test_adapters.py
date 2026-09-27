from pathlib import Path

from app.telemetry.adapters.csv_adapter import CSVTelemetryAdapter
from app.telemetry.adapters.parquet_adapter import ParquetTelemetryAdapter

DATA_DIR = Path(__file__).parent / "data"
CSV_FILE = DATA_DIR / "synthetic_telemetry.csv"
PARQUET_FILE = DATA_DIR / "synthetic_telemetry.parquet"


def test_csv_adapter_load_and_inspect():
    adapter = CSVTelemetryAdapter()
    adapter.load(CSV_FILE)

    raw_df = adapter.read_telemetry()
    assert len(raw_df) == 500
    assert "vCar" in raw_df.columns
    assert "Time" in raw_df.columns

    channels = adapter.read_channels()
    assert len(channels) == 10

    meta = adapter.read_metadata()
    assert meta["format"] == "CSV"
    assert meta["rows"] == 500

    inspection = adapter.inspect_schema()
    assert inspection.file_format == "CSV"
    assert inspection.row_count == 500
    assert len(inspection.core_channels_found) == 10
    assert len(inspection.core_channels_missing) == 0
    assert inspection.estimated_sampling_frequency is not None
    assert inspection.distance_range == [0.0, 3500.0]


def test_parquet_adapter_load_and_inspect():
    adapter = ParquetTelemetryAdapter()
    adapter.load(PARQUET_FILE)

    raw_df = adapter.read_telemetry()
    assert len(raw_df) == 500
    assert "vCar" in raw_df.columns

    meta = adapter.read_metadata()
    assert meta["format"] == "Parquet"

    inspection = adapter.inspect_schema()
    assert inspection.file_format == "Parquet"
    assert inspection.row_count == 500
    assert len(inspection.core_channels_found) == 10


def test_adapters_parity():
    csv_adapter = CSVTelemetryAdapter()
    csv_adapter.load(CSV_FILE)
    csv_df = csv_adapter.read_telemetry()

    pq_adapter = ParquetTelemetryAdapter()
    pq_adapter.load(PARQUET_FILE)
    pq_df = pq_adapter.read_telemetry()

    assert list(csv_df.columns) == list(pq_df.columns)
    assert len(csv_df) == len(pq_df)
    # Check speed match
    assert abs(csv_df["vCar"].iloc[0] - pq_df["vCar"].iloc[0]) < 1e-4


def test_csv_adapter_bytes_load():
    with open(CSV_FILE, "rb") as f:
        content = f.read()

    adapter = CSVTelemetryAdapter()
    adapter.load(content, filename="in_memory.csv")
    assert len(adapter.read_telemetry()) == 500
    assert adapter.source_name == "in_memory.csv"
