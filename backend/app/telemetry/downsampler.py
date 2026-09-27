import math

from app.schemas.domain import TelemetryPoint


def downsample_telemetry_lttb(
    points: list[TelemetryPoint], threshold: int
) -> list[TelemetryPoint]:
    """
    Largest Triangle Three Buckets (LTTB) downsampling algorithm adapted for
    multi-channel telemetry points based on distance (or timestamp).
    Preserves visual character, peaks (e.g. max lateral G, min corner speed).
    """
    n_points = len(points)
    if threshold >= n_points or threshold <= 2 or n_points <= 2:
        return points

    sampled: list[TelemetryPoint] = [points[0]]
    bucket_size = (n_points - 2) / (threshold - 2)
    a = 0  # initially points[0]

    for i in range(threshold - 2):
        # Calculate point average for next bucket (bucket c)
        avg_x = 0.0
        avg_y = 0.0
        avg_range_start = math.floor((i + 1) * bucket_size) + 1
        avg_range_end = math.floor((i + 2) * bucket_size) + 1
        avg_range_end = min(avg_range_end, n_points)

        avg_range_len = avg_range_end - avg_range_start
        if avg_range_len > 0:
            for j in range(avg_range_start, avg_range_end):
                avg_x += points[j].distance
                avg_y += points[j].speed
            avg_x /= avg_range_len
            avg_y /= avg_range_len

        # Get range for current bucket (bucket b)
        range_offs = math.floor(i * bucket_size) + 1
        range_to = math.floor((i + 1) * bucket_size) + 1
        range_to = min(range_to, n_points)

        # Point a
        point_a_x = points[a].distance
        point_a_y = points[a].speed

        max_area = -1.0
        next_a = range_offs

        for j in range(range_offs, range_to):
            # Calculate triangle area over points: a, j, avg
            area = (
                abs(
                    (point_a_x - avg_x) * (points[j].speed - point_a_y)
                    - (point_a_x - points[j].distance) * (avg_y - point_a_y)
                )
                * 0.5
            )
            if area > max_area:
                max_area = area
                next_a = j

        sampled.append(points[next_a])
        a = next_a

    sampled.append(points[-1])
    return sampled


def downsample_uniform(
    points: list[TelemetryPoint], max_points: int
) -> list[TelemetryPoint]:
    """Uniform stride decimation ensuring first and last points are included."""
    n = len(points)
    if n <= max_points or max_points <= 2:
        return points

    step = (n - 1) / (max_points - 1)
    indices = [round(i * step) for i in range(max_points)]
    # remove duplicate indices while preserving order
    unique_indices = []
    seen = set()
    for idx in indices:
        if idx not in seen and idx < n:
            seen.add(idx)
            unique_indices.append(idx)

    return [points[i] for i in unique_indices]
